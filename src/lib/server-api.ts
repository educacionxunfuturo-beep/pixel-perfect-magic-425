import { buildCopilotPrompt, buildQimmiqPrompt, type QimmiqContext } from "./qimmiq-prompt";

/**
 * Server-only API routes, served by the Cloudflare Worker (src/server.ts).
 * Everything secret lives here, never in the browser bundle:
 *
 *   STAFF_PASSWORD      secret  staff sign-in password (sign-in is disabled while unset)
 *   SESSION_SECRET      secret  optional; signs staff sessions (falls back to a key derived from STAFF_PASSWORD)
 *   STAFF_EMAILS        var     comma-separated staff emails (default: admin@thefreshpooch.ca, hello@doggroomingtoronto.ca)
 *   DEMO_STAFF_ACCESS   var     "true" on the public demo: enables one-click demo sign-in
 *   DEMO_STAFF_HINT     var     text shown on the sign-in screen in demo mode, e.g. the demo credentials
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (secrets), TWILIO_FROM (var)   real SMS sending
 *   GEMINI_API_KEY      secret  live Qimmiq answers through Google Gemini (AI Studio key)
 *   GEMINI_MODELS       var     optional comma-separated model list, tried in order
 *   BOOKINGS_DB         D1      shared bookings (portal, quote and Qimmiq cart) so staff see them on any device
 *   NTFY_TOPIC          secret  optional; push alert to the owner's phone (ntfy app) for each new booking
 * Pet-parent accounts live in the same D1 database (table customers); see migrations/.
 */

type Env = Record<string, string | undefined>;

const SESSION_COOKIE = "fp_staff";
const SESSION_SECONDS = 8 * 60 * 60;
const DEFAULT_STAFF_EMAILS = "admin@thefreshpooch.ca,hello@doggroomingtoronto.ca";
// gemini-2.0-flash and 2.5-flash are no longer available to new keys (Oct 2026). Override with GEMINI_MODELS.
const DEFAULT_GEMINI_MODELS = "gemini-3.5-flash,gemini-3.8-flash,gemini-flash-lite-latest";

function readEnv(env: unknown): Env {
  const fromWorker = (env && typeof env === "object" ? env : {}) as Env;
  const fromNode = ((globalThis as { process?: { env?: Env } }).process?.env ?? {}) as Env;
  return new Proxy({} as Env, { get: (_t, key: string) => fromWorker[key] ?? fromNode[key] });
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

// ---------- rate limiting (per Worker isolate; best effort) ----------

const hits = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// ---------- crypto helpers ----------

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(text: string): string {
  return atob(text.replace(/-/g, "+").replace(/_/g, "/"));
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function hmacKey(env: Env, purpose: "staff" | "client" = "staff"): Promise<CryptoKey | null> {
  const secret = env["SESSION_SECRET"] || (env["STAFF_PASSWORD"] ? `fp-session:${env["STAFF_PASSWORD"]}` : "");
  if (!secret) return null;
  const raw = await sha256(purpose === "staff" ? secret : `${purpose}:${secret}`);
  return crypto.subtle.importKey("raw", raw.buffer as ArrayBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signedCookie(env: Env, purpose: "staff" | "client", name: string, email: string, maxAge: number, request: Request): Promise<string | null> {
  const key = await hmacKey(env, purpose);
  if (!key) return null;
  const payload = b64url(enc.encode(JSON.stringify({ email, kind: purpose, exp: Math.floor(Date.now() / 1000) + maxAge })));
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

async function readSignedCookie(request: Request, env: Env, purpose: "staff" | "client", name: string): Promise<string | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  const key = await hmacKey(env, purpose);
  if (!payload || !sig || !key) return null;
  const sigBytes = Uint8Array.from(fromB64url(sig), (c) => c.charCodeAt(0));
  if (!(await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload)))) return null;
  try {
    const data = JSON.parse(fromB64url(payload)) as { email: string; exp: number; kind?: string };
    if (data.exp < Date.now() / 1000 || (data.kind ?? "staff") !== purpose) return null;
    return data.email;
  } catch {
    return null;
  }
}

// ---------- staff sessions ----------

function staffEmails(env: Env): string[] {
  return (env["STAFF_EMAILS"] || DEFAULT_STAFF_EMAILS).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

async function createSession(env: Env, email: string, request: Request): Promise<string | null> {
  const key = await hmacKey(env);
  if (!key) return null;
  const payload = b64url(enc.encode(JSON.stringify({ email, kind: "staff", exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })));
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export async function readStaffSession(request: Request, rawEnv: unknown): Promise<{ email: string } | null> {
  const env = readEnv(rawEnv);
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  const key = await hmacKey(env);
  if (!payload || !sig || !key) return null;
  const sigBytes = Uint8Array.from(fromB64url(sig), (c) => c.charCodeAt(0));
  if (!(await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload)))) return null;
  try {
    const data = JSON.parse(fromB64url(payload)) as { email: string; exp: number; kind?: string };
    if (data.exp < Date.now() / 1000 || (data.kind ?? "staff") !== "staff" || !staffEmails(env).includes(data.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

const clearCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

async function staffLogin(request: Request, env: Env): Promise<Response> {
  if (rateLimited(`login:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return json({ error: "Too many sign-in attempts. Try again in a few minutes." }, 429);
  }
  const password = env["STAFF_PASSWORD"];
  if (!password) return json({ error: "Staff sign-in is not configured on this server." }, 503);
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email ?? "").trim().toLowerCase();
  const ok = staffEmails(env).includes(email) && sameBytes(await sha256(body.password ?? ""), await sha256(password));
  if (!ok) return json({ error: "Wrong email or password." }, 401);
  const cookie = await createSession(env, email, request);
  return json({ email }, 200, cookie ? { "set-cookie": cookie } : {});
}

async function staffDemoLogin(request: Request, env: Env): Promise<Response> {
  if (env["DEMO_STAFF_ACCESS"] !== "true") return json({ error: "Demo access is disabled." }, 403);
  const email = staffEmails(env)[0]!;
  const cookie = await createSession(env, email, request);
  if (!cookie) return json({ error: "Staff sign-in is not configured on this server." }, 503);
  return json({ email }, 200, { "set-cookie": cookie });
}

// ---------- SMS (Twilio) ----------

async function sendSms(request: Request, env: Env): Promise<Response> {
  if (!(await readStaffSession(request, env))) return json({ error: "Staff sign-in required." }, 401);
  const body = (await request.json().catch(() => ({}))) as { to?: string; body?: string };
  const to = (body.to ?? "").trim();
  const text = (body.body ?? "").slice(0, 640);
  if (!/^\+1\d{10}$/.test(to) || !text) return json({ error: "A Canadian phone number (+1XXXXXXXXXX) and a message are required." }, 400);

  const sid = env["TWILIO_ACCOUNT_SID"];
  const token = env["TWILIO_AUTH_TOKEN"];
  const from = env["TWILIO_FROM"];
  if (!sid || !token || !from) return json({ sent: false, reason: "not_configured" }, 501);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${sid}:${token}`)}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: text }),
  });
  if (!res.ok) return json({ sent: false, reason: "provider_error" }, 502);
  return json({ sent: true });
}

// ---------- Qimmiq through Gemini ----------

type GeminiTurn = { role: string; parts: { text: string }[] };

function readHistory(history: { from?: string; text?: string }[] | undefined): GeminiTurn[] {
  return (history ?? []).slice(-6).map((m) => ({
    role: m.from === "user" ? "user" : "model",
    parts: [{ text: String(m.text ?? "").slice(0, 2000) }],
  }));
}

/** Asks Gemini; returns null when every model failed or timed out. */
async function askGemini(env: Env, system: string, contents: GeminiTurn[], temperature: number): Promise<{ text: string; model: string } | null> {
  const apiKey = env["GEMINI_API_KEY"]!;
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature, maxOutputTokens: 4096 }, // room for the model's thinking tokens
  });

  // Google retires and overloads models often: try them in order, each with a time limit,
  // and give up after ~20 s so the browser falls back to the built-in engine.
  const models = (env["GEMINI_MODELS"] || DEFAULT_GEMINI_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  const started = Date.now();
  for (const model of models) {
    const remaining = 20_000 - (Date.now() - started);
    if (remaining < 2_000) break;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: payload,
        signal: AbortSignal.timeout(Math.min(9_000, remaining)),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text ?? "").join("") ?? "";
      if (text) return { text, model };
    } catch {
      // timeout or network error: try the next model
    }
  }
  return null;
}

async function qimmiq(request: Request, env: Env): Promise<Response> {
  if (!env["GEMINI_API_KEY"]) return json({ configured: false }, 503);
  if (rateLimited(`qimmiq:${clientIp(request)}`, 12, 60 * 1000)) return json({ error: "Too many questions, please wait a minute." }, 429);

  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    history?: { from?: string; text?: string }[];
    context?: QimmiqContext;
  };
  const query = (body.query ?? "").trim().slice(0, 1000);
  if (!query) return json({ error: "Empty question." }, 400);
  const ctx = body.context ?? {};
  const context: QimmiqContext = {
    ...(typeof ctx.breed === "string" ? { breed: ctx.breed.slice(0, 60) } : {}),
    ...(typeof ctx.breedTier === "string" ? { breedTier: ctx.breedTier.slice(0, 20) } : {}),
    ...(typeof ctx.location === "string" ? { location: ctx.location.slice(0, 60) } : {}),
  };

  const answer = await askGemini(env, buildQimmiqPrompt(context), [...readHistory(body.history), { role: "user", parts: [{ text: query }] }], 0.6);
  return answer ? json(answer) : json({ error: "AI provider unavailable." }, 502);
}

/** Owner copilot: staff only; the browser sends a business summary without codes, phones or addresses. */
async function qimmiqCopilot(request: Request, env: Env, rawEnv: unknown): Promise<Response> {
  if (!env["GEMINI_API_KEY"]) return json({ configured: false }, 503);
  if (!(await readStaffSession(request, rawEnv))) return json({ error: "Staff sign-in required." }, 401);
  if (rateLimited(`copilot:${clientIp(request)}`, 20, 60 * 1000)) return json({ error: "Too many questions, please wait a minute." }, 429);

  const body = (await request.json().catch(() => ({}))) as { query?: string; history?: { from?: string; text?: string }[]; snapshot?: string };
  const query = (body.query ?? "").trim().slice(0, 1000);
  if (!query) return json({ error: "Empty question." }, 400);
  const snapshot = String(body.snapshot ?? "").slice(0, 12_000);

  const answer = await askGemini(env, buildCopilotPrompt(snapshot), [...readHistory(body.history), { role: "user", parts: [{ text: query }] }], 0.3);
  return answer ? json(answer) : json({ error: "AI provider unavailable." }, 502);
}

// ---------- shared bookings (D1) ----------

interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown>; all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null> } };
}

function bookingsDb(rawEnv: unknown): D1Like | null {
  // nitro's Cloudflare handler keeps the Worker bindings on globalThis.__env__
  const sources = [rawEnv, (globalThis as { __env__?: unknown }).__env__];
  const db = sources.map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>)["BOOKINGS_DB"] : undefined)).find(Boolean) as D1Like | undefined;
  return db && typeof db.prepare === "function" ? db : null;
}

const BOOKING_STATUSES = ["requested", "confirmed", "en_route", "in_progress", "completed", "cancelled"];
type BookingFields = "id" | "date" | "service" | "source" | "status" | "total" | "weightLbs" | "reference" | "petName" | "breed" | "time" | "address" | "timeWindow" | "postalCode" | "ownerName" | "ownerPhone" | "latchkeyCode" | "notes" | "waiver" | "paymentMethod" | "createdAt" | "completedAt" | "report";
type BookingRecord = { [K in BookingFields]?: unknown };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

/** Keeps only known appointment fields, with length limits; returns null when the booking is not valid. */
function cleanBooking(raw: BookingRecord): BookingRecord | null {
  const id = text(raw.id, 40);
  const date = text(raw.date, 10);
  if (!id || !/^appt-[a-z0-9-]+$/i.test(id) || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!["tidy", "full", "ultimate"].includes(String(raw.service))) return null;
  if (raw.source !== "portal" && raw.source !== "web") return null;
  const total = Number(raw.total);
  const weight = Number(raw.weightLbs);
  const out: BookingRecord = {
    id,
    date,
    service: raw.service,
    source: raw.source,
    status: "requested", // public bookings are requests until staff confirm them
    total: Number.isFinite(total) ? Math.min(Math.max(Math.round(total), 0), 5000) : 0,
    weightLbs: Number.isFinite(weight) ? Math.min(Math.max(Math.round(weight), 1), 250) : 30,
    reference: text(raw.reference, 30) ?? id,
    petName: text(raw.petName, 60) ?? "Dog",
    breed: text(raw.breed, 60) ?? "",
    time: text(raw.time, 12) ?? "8:30 AM",
    address: text(raw.address, 160) ?? "",
    createdAt: new Date().toISOString(),
  };
  for (const [key, max] of [["timeWindow", 40], ["postalCode", 10], ["ownerName", 80], ["ownerPhone", 30], ["latchkeyCode", 20], ["notes", 500], ["waiver", 40], ["paymentMethod", 20]] as const) {
    const v = text(raw[key], max);
    if (v) out[key] = v;
  }
  return out;
}

async function createBooking(request: Request, rawEnv: unknown): Promise<Response> {
  const db = bookingsDb(rawEnv);
  if (!db) return json({ shared: false }, 503);
  if (rateLimited(`booking:${clientIp(request)}`, 10, 10 * 60 * 1000)) return json({ error: "Too many bookings, please wait a few minutes." }, 429);
  const booking = cleanBooking(((await request.json().catch(() => ({}))) ?? {}) as BookingRecord);
  if (!booking) return json({ error: "Invalid booking." }, 400);
  const now = new Date().toISOString();
  // INSERT OR IGNORE: a request can never overwrite an existing booking
  const customerEmail = await readSignedCookie(request, readEnv(rawEnv), "client", CLIENT_COOKIE);
  const result = (await db
    .prepare("INSERT OR IGNORE INTO bookings (id, date, data, created_at, updated_at, customer_email) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(booking.id, booking.date, JSON.stringify(booking), now, now, customerEmail)
    .run()) as { meta?: { changes?: number } };
  if (result?.meta?.changes !== 0) await notifyOwner(request, readEnv(rawEnv), booking);
  return json({ shared: true, id: booking.id }, 201);
}

const SERVICE_LABELS: Record<string, string> = { tidy: "Bath & Tidy", full: "Premium Full Groom", ultimate: "Ultimate Spa" };

/** Push alert to the owner's phone through ntfy. Only the dog, service and date go out: no address, phone or codes. */
async function notifyOwner(request: Request, env: Env, booking: BookingRecord) {
  const topic = env["NTFY_TOPIC"];
  if (!topic) return;
  const dog = [booking.petName, booking.breed].filter(Boolean).join(", ");
  const when = [booking.date, booking.timeWindow].filter(Boolean).join(" ");
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: { Title: "New booking request", Tags: "dog", Click: new URL("/", request.url).toString() },
      body: `${dog}: ${SERVICE_LABELS[String(booking.service)] ?? booking.service}, ${when}, $${booking.total} CAD. Confirm it in the owner dashboard.`,
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // the booking is saved either way; the dashboard shows it
  }
}

async function listBookings(request: Request, rawEnv: unknown): Promise<Response> {
  const db = bookingsDb(rawEnv);
  if (!db) return json({ shared: false, bookings: [] });
  if (!(await readStaffSession(request, rawEnv))) return json({ error: "Staff sign-in required." }, 401);
  const since = new Date(Date.now() - 62 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { results } = await db.prepare("SELECT data FROM bookings WHERE date >= ? ORDER BY date LIMIT 500").bind(since).all<{ data: string }>();
  return json({ shared: true, bookings: results.map((r) => JSON.parse(r.data)) });
}

async function patchBooking(request: Request, rawEnv: unknown, id: string): Promise<Response> {
  const db = bookingsDb(rawEnv);
  if (!db) return json({ shared: false }, 503);
  if (!(await readStaffSession(request, rawEnv))) return json({ error: "Staff sign-in required." }, 401);
  const row = await db.prepare("SELECT data FROM bookings WHERE id = ?").bind(id).first<{ data: string }>();
  if (!row) return json({ error: "Not found" }, 404);
  const patch = ((await request.json().catch(() => ({}))) ?? {}) as BookingRecord;
  const booking = JSON.parse(row.data) as BookingRecord;
  if (typeof patch.status === "string" && BOOKING_STATUSES.includes(patch.status)) booking.status = patch.status;
  if (typeof patch.completedAt === "string") booking.completedAt = patch.completedAt.slice(0, 40);
  if (patch.report && typeof patch.report === "object") {
    const report: Record<string, string> = {};
    for (const [k, v] of Object.entries(patch.report as Record<string, unknown>)) if (typeof v === "string" && k.length < 20) report[k] = v.slice(0, 500);
    booking.report = report;
  }
  await db.prepare("UPDATE bookings SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(booking), new Date().toISOString(), id).run();
  return json({ ok: true });
}

// ---------- pet-parent accounts (D1 table customers) ----------

const CLIENT_COOKIE = "fp_client";
const CLIENT_SECONDS = 30 * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 100_000; // the Workers runtime maximum

interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  pet: { name: string; breed: string; weightLbs: number };
  createdAt: string;
}

async function hashPassword(password: string, saltB64?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltB64 ? Uint8Array.from(fromB64url(saltB64), (c) => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, key, 256);
  return { hash: b64url(bits), salt: b64url(salt) };
}

async function accountResponse(db: D1Like, profile: CustomerProfile, headers: Record<string, string> = {}): Promise<Response> {
  const { results } = await db.prepare("SELECT data FROM bookings WHERE customer_email = ? ORDER BY date DESC LIMIT 50").bind(profile.email).all<{ data: string }>();
  return json({ profile, bookings: results.map((r) => JSON.parse(r.data)) }, 200, headers);
}

async function signup(request: Request, env: Env, rawEnv: unknown): Promise<Response> {
  const db = bookingsDb(rawEnv);
  if (!db) return json({ error: "Accounts are not available on this server." }, 503);
  if (rateLimited(`signup:${clientIp(request)}`, 5, 60 * 60 * 1000)) return json({ error: "Too many sign-ups from this connection. Try again later." }, 429);
  const body = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const email = String(body["email"] ?? "").trim().toLowerCase().slice(0, 120);
  const password = String(body["password"] ?? "");
  const name = String(body["name"] ?? "").trim().slice(0, 80);
  const petName = String(body["petName"] ?? "").trim().slice(0, 40);
  const weight = Number(body["petWeightLbs"]);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: "Use a password of at least 8 characters." }, 400);
  if (!name || !petName) return json({ error: "Please add your name and your dog's name." }, 400);
  if (staffEmails(env).includes(email)) return json({ error: "This email belongs to the staff. Sign in with it instead." }, 400);
  const profile: CustomerProfile = {
    name,
    email,
    phone: String(body["phone"] ?? "").trim().slice(0, 30),
    address: String(body["address"] ?? "").trim().slice(0, 160),
    pet: { name: petName, breed: String(body["petBreed"] ?? "").trim().slice(0, 60) || "Mixed breed", weightLbs: Number.isFinite(weight) ? Math.min(Math.max(Math.round(weight), 2), 250) : 30 },
    createdAt: new Date().toISOString(),
  };
  const { hash, salt } = await hashPassword(password);
  const result = (await db
    .prepare("INSERT OR IGNORE INTO customers (email, data, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(email, JSON.stringify(profile), hash, salt, profile.createdAt)
    .run()) as { meta?: { changes?: number } };
  if (result?.meta?.changes === 0) return json({ error: "An account with this email already exists. Sign in instead." }, 409);
  const cookie = await signedCookie(env, "client", CLIENT_COOKIE, email, CLIENT_SECONDS, request);
  return accountResponse(db, profile, cookie ? { "set-cookie": cookie } : {});
}

async function clientLogin(request: Request, env: Env, rawEnv: unknown): Promise<Response> {
  const db = bookingsDb(rawEnv);
  if (!db) return json({ error: "Accounts are not available on this server." }, 503);
  if (rateLimited(`client-login:${clientIp(request)}`, 10, 10 * 60 * 1000)) return json({ error: "Too many sign-in attempts. Try again in a few minutes." }, 429);
  const body = ((await request.json().catch(() => ({}))) ?? {}) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const row = await db.prepare("SELECT data, password_hash, salt FROM customers WHERE email = ?").bind(email).first<{ data: string; password_hash: string; salt: string }>();
  // hash even when the account does not exist, so timing does not reveal which emails are registered
  const { hash } = await hashPassword(String(body.password ?? ""), row?.salt);
  if (!row || !sameBytes(enc.encode(hash), enc.encode(row.password_hash))) return json({ error: "Wrong email or password." }, 401);
  const cookie = await signedCookie(env, "client", CLIENT_COOKIE, email, CLIENT_SECONDS, request);
  return accountResponse(db, JSON.parse(row.data) as CustomerProfile, cookie ? { "set-cookie": cookie } : {});
}

async function currentAccount(request: Request, env: Env, rawEnv: unknown): Promise<Response> {
  const db = bookingsDb(rawEnv);
  const email = await readSignedCookie(request, env, "client", CLIENT_COOKIE);
  if (!db || !email) return json({ authenticated: false }, 401);
  const row = await db.prepare("SELECT data FROM customers WHERE email = ?").bind(email).first<{ data: string }>();
  if (!row) return json({ authenticated: false }, 401);
  return accountResponse(db, JSON.parse(row.data) as CustomerProfile);
}

// ---------- router ----------

/** Handles /api/* routes; returns null for anything else so the app renders normally. */
export async function handleApi(request: Request, rawEnv: unknown): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/api/")) return null;
  const env = readEnv(rawEnv);
  const method = request.method;

  if (pathname === "/api/staff/config" && method === "GET") {
    const demo = env["DEMO_STAFF_ACCESS"] === "true";
    return json({ signInEnabled: Boolean(env["STAFF_PASSWORD"]), demoAccess: demo, ...(demo && env["DEMO_STAFF_HINT"] ? { demoHint: env["DEMO_STAFF_HINT"] } : {}) });
  }
  if (pathname === "/api/staff/session" && method === "GET") {
    const session = await readStaffSession(request, rawEnv);
    return json(session ? { authenticated: true, email: session.email } : { authenticated: false });
  }
  if (pathname === "/api/staff/login" && method === "POST") return staffLogin(request, env);
  if (pathname === "/api/staff/demo-login" && method === "POST") return staffDemoLogin(request, env);
  if (pathname === "/api/staff/logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": clearCookie });
  if (pathname === "/api/notifications/sms" && method === "POST") return sendSms(request, env);
  if (pathname === "/api/qimmiq/status" && method === "GET") return json({ configured: Boolean(env["GEMINI_API_KEY"]) });
  if (pathname === "/api/qimmiq" && method === "POST") return qimmiq(request, env);
  if (pathname === "/api/qimmiq/copilot" && method === "POST") return qimmiqCopilot(request, env, rawEnv);
  if (pathname === "/api/account/signup" && method === "POST") return signup(request, env, rawEnv);
  if (pathname === "/api/account/login" && method === "POST") return clientLogin(request, env, rawEnv);
  if (pathname === "/api/account" && method === "GET") return currentAccount(request, env, rawEnv);
  if (pathname === "/api/account/logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": `${CLIENT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
  if (pathname === "/api/bookings" && method === "POST") return createBooking(request, rawEnv);
  if (pathname === "/api/bookings" && method === "GET") return listBookings(request, rawEnv);
  const bookingPath = /^\/api\/bookings\/(appt-[a-z0-9-]+)$/i.exec(pathname);
  if (bookingPath && method === "PATCH") return patchBooking(request, rawEnv, bookingPath[1]!);
  return json({ error: "Not found" }, 404);
}
