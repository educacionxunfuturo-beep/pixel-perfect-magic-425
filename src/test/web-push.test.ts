// @vitest-environment node
import { createDecipheriv, createECDH, hkdfSync, randomBytes, webcrypto } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { b64urlDecode, b64urlEncode, encryptPayload, vapidAuthorization } from "@/lib/web-push";
import { handleApi } from "@/lib/server-api";

/** A browser-side subscription: its P-256 key pair and auth secret. */
function fakeBrowser() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = randomBytes(16);
  return { ecdh, auth, sub: { endpoint: "https://push.example.com/send/abc", p256dh: b64urlEncode(ecdh.getPublicKey()), auth: b64urlEncode(auth) } };
}

/** RFC 8291 decryption with Node's own crypto, independent of the code under test. */
function decrypt(body: Uint8Array, ecdh: ReturnType<typeof createECDH>, auth: Buffer): string {
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const idlen = buf[20]!;
  const asPublic = buf.subarray(21, 21 + idlen);
  const ciphertext = buf.subarray(21 + idlen);
  const shared = ecdh.computeSecret(asPublic);
  const info = Buffer.concat([Buffer.from("WebPush: info\0"), ecdh.getPublicKey(), asPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", shared, auth, info, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const decipher = createDecipheriv("aes-128-gcm", cek, nonce);
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
  expect(plain[plain.length - 1]).toBe(2); // last-record delimiter
  return plain.subarray(0, plain.length - 1).toString("utf8");
}

async function vapidPair() {
  const pair = (await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = b64urlEncode(new Uint8Array((await webcrypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer));
  const privateJwk = (await webcrypto.subtle.exportKey("jwk", pair.privateKey)) as JsonWebKey;
  return { pair, keys: { publicKey, privateJwk, subject: "https://demo.test" } };
}

describe("web push crypto", () => {
  it("encrypts payloads that a browser can decrypt (RFC 8291)", async () => {
    const { ecdh, auth, sub } = fakeBrowser();
    const body = await encryptPayload(sub, new TextEncoder().encode(JSON.stringify({ title: "New booking request" })));
    expect(JSON.parse(decrypt(body, ecdh, auth))).toEqual({ title: "New booking request" });
  });

  it("signs a valid VAPID token for the push service", async () => {
    const { pair, keys } = await vapidPair();
    const header = await vapidAuthorization("https://fcm.googleapis.com/fcm/send/xyz", keys);
    const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(header)!;
    expect(k).toBe(keys.publicKey);
    const [h, c, sig] = jwt!.split(".");
    const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(c!)));
    expect(claims.aud).toBe("https://fcm.googleapis.com");
    const ok = await webcrypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, b64urlDecode(sig!), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });
});

function sqliteD1() {
  const db = new DatabaseSync(":memory:");
  const dir = join(process.cwd(), "migrations");
  for (const file of readdirSync(dir).sort()) db.exec(readFileSync(join(dir, file), "utf8"));
  return {
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          const params = values.map((v) => (v === undefined ? null : v)) as (string | number | null)[];
          return {
            async run() {
              return { meta: { changes: Number(db.prepare(sql).run(...params).changes) } };
            },
            async all<T>() {
              return { results: db.prepare(sql).all(...params) as T[] };
            },
            async first<T>() {
              return (db.prepare(sql).get(...params) ?? null) as T | null;
            },
          };
        },
      };
    },
  };
}

const req = (path: string, init: RequestInit = {}) =>
  new Request(`https://demo.test${path}`, { ...init, headers: { "cf-connecting-ip": `203.0.113.${Math.floor(Math.random() * 250)}`, "content-type": "application/json", ...(init.headers as Record<string, string>) } });

describe("staff alerts (server)", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("pushes a new booking to subscribed staff devices and keeps it in the history", async () => {
    const { keys } = await vapidPair();
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: sqliteD1(), VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: JSON.stringify(keys.privateJwk) };
    const { ecdh, auth, sub } = fakeBrowser();

    expect((await handleApi(req("/api/push/subscribe", { method: "POST", body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }) }), env))!.status).toBe(401);
    const login = await handleApi(req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "s3cret" }) }), env);
    const cookie = login!.headers.get("set-cookie")!.split(";")[0]!;
    const subscribed = await handleApi(req("/api/push/subscribe", { method: "POST", headers: { cookie }, body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }) }), env);
    expect(subscribed!.status).toBe(200);

    const pushed: { url: string; headers: Headers; body: Uint8Array }[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      pushed.push({ url: String(input), headers: new Headers(init?.headers), body: new Uint8Array(init?.body as ArrayBuffer) });
      return new Response(null, { status: 201 });
    }) as typeof fetch;

    await handleApi(req("/api/bookings", { method: "POST", body: JSON.stringify({ id: "appt-push-1", date: "2026-11-03", service: "full", source: "web", petName: "Milo", breed: "Goldendoodle", total: 180, address: "1 Secret St", ownerPhone: "416-555-0100", latchkeyCode: "9999" }) }), env);

    expect(pushed).toHaveLength(1);
    expect(pushed[0]!.url).toBe(sub.endpoint);
    expect(pushed[0]!.headers.get("content-encoding")).toBe("aes128gcm");
    expect(pushed[0]!.headers.get("authorization")).toMatch(/^vapid t=/);
    const message = JSON.parse(decrypt(pushed[0]!.body, ecdh, auth)) as { title: string; body: string; url: string };
    expect(message.title).toBe("New booking request");
    expect(message.body).toContain("Milo");
    expect(message.body).not.toMatch(/Secret St|416-555|9999/);
    expect(message.url).toBe("https://demo.test/?view=admin");

    globalThis.fetch = realFetch;
    const history = await handleApi(req("/api/staff/notifications", { headers: { cookie } }), env);
    const h = (await history!.json()) as { notifications: { title: string }[]; unread: number; devices: number };
    expect(h.notifications[0]!.title).toBe("New booking request");
    expect(h.unread).toBe(1);
    expect(h.devices).toBe(1);
    await handleApi(req("/api/staff/notifications", { method: "POST", headers: { cookie } }), env);
    const after = (await (await handleApi(req("/api/staff/notifications", { headers: { cookie } }), env))!.json()) as { unread: number };
    expect(after.unread).toBe(0);
  });

  it("forgets devices the push service no longer knows", async () => {
    const { keys } = await vapidPair();
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: sqliteD1(), VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: JSON.stringify(keys.privateJwk) };
    const { sub } = fakeBrowser();
    const login = await handleApi(req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "s3cret" }) }), env);
    const cookie = login!.headers.get("set-cookie")!.split(";")[0]!;
    await handleApi(req("/api/push/subscribe", { method: "POST", headers: { cookie }, body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }) }), env);
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 410 })) as typeof fetch;
    const test = await handleApi(req("/api/push/test", { method: "POST", headers: { cookie } }), env);
    expect(await test!.json()).toEqual({ sent: 0, devices: 1 });
    globalThis.fetch = realFetch;
    const h = (await (await handleApi(req("/api/staff/notifications", { headers: { cookie } }), env))!.json()) as { devices: number };
    expect(h.devices).toBe(0);
  });
});
