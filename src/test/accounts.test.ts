// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { handleApi } from "@/lib/server-api";

/** A D1-shaped wrapper over an in-memory SQLite database with the real migrations applied. */
function sqliteD1() {
  const db = new DatabaseSync(":memory:");
  const dir = join(process.cwd(), "migrations");
  for (const file of readdirSync(dir).sort()) db.exec(readFileSync(join(dir, file), "utf8"));
  return {
    db,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          const params = values.map((v) => (v === undefined ? null : v)) as (string | number | null)[];
          return {
            async run() {
              const r = db.prepare(sql).run(...params);
              return { meta: { changes: Number(r.changes) } };
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
  new Request(`https://demo.test${path}`, { ...init, headers: { "cf-connecting-ip": `198.51.100.${Math.floor(Math.random() * 250)}`, "content-type": "application/json", ...(init.headers as Record<string, string>) } });
const cookieOf = (res: Response) => res.headers.get("set-cookie")!.split(";")[0]!;

async function signedUpParent(env: Record<string, unknown>, email = "sam@example.com") {
  const res = await handleApi(
    req("/api/account/signup", { method: "POST", body: JSON.stringify({ name: "Sam Lee", email, password: "woofwoof1", phone: "416-555-0199", address: "1 Main St", petName: "Milo", petBreed: "Maltese", petWeightLbs: 12 }) }),
    env,
  );
  expect(res!.status).toBe(200);
  return cookieOf(res!);
}

async function staffCookie(env: Record<string, unknown>) {
  const res = await handleApi(req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "s3cret" }) }), env);
  return cookieOf(res!);
}

describe("pet-parent account records (server, SQLite)", () => {
  it("saves the access code and vaccine certificates on the account and shares them with the groomer", async () => {
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: sqliteD1() };
    const cookie = await signedUpParent(env);

    const access = await handleApi(req("/api/account/access", { method: "POST", headers: { cookie }, body: JSON.stringify({ code: "4821", notes: "Side gate" }) }), env);
    expect(((await access!.json()) as { profile: { access: { code: string } } }).profile.access.code).toBe("4821");

    const pdf = Buffer.from("%PDF-1.4 certificate").toString("base64");
    const saved = await handleApi(
      req("/api/account/vaccines", { method: "POST", headers: { cookie }, body: JSON.stringify({ kind: "rabies", expires: "2027-05-01", fileName: "rabies.pdf", contentType: "application/pdf", data: pdf }) }),
      env,
    );
    const profile = ((await saved!.json()) as { profile: { vaccines: { rabies: { expires: string; docId: string } } } }).profile;
    expect(profile.vaccines.rabies.expires).toBe("2027-05-01");
    const docId = profile.vaccines.rabies.docId;

    // the owner of the account and staff can open the certificate; nobody else can
    expect((await handleApi(req(`/api/vaccine-docs/${docId}`, { headers: { cookie } }), env))!.status).toBe(200);
    expect((await handleApi(req(`/api/vaccine-docs/${docId}`), env))!.status).toBe(404);
    const otherParent = await signedUpParent(env, "other@example.com");
    expect((await handleApi(req(`/api/vaccine-docs/${docId}`, { headers: { cookie: otherParent } }), env))!.status).toBe(404);
    const staff = await staffCookie(env);
    const asStaff = await handleApi(req(`/api/vaccine-docs/${docId}`, { headers: { cookie: staff } }), env);
    expect(asStaff!.headers.get("content-type")).toBe("application/pdf");

    // a booking made while signed in carries the code and the vaccine dates
    await handleApi(req("/api/bookings", { method: "POST", headers: { cookie }, body: JSON.stringify({ id: "appt-sam-1", date: "2026-11-02", service: "tidy", source: "portal", petName: "Milo", total: 135 }) }), env);
    const list = await handleApi(req("/api/bookings", { headers: { cookie: staff } }), env);
    const booking = ((await list!.json()) as { bookings: { latchkeyCode: string; vaccines: { rabies: { expires: string } } }[] }).bookings[0]!;
    expect(booking.latchkeyCode).toBe("4821");
    expect(booking.vaccines.rabies.expires).toBe("2027-05-01");
  });

  it("rejects certificates that are not images or PDFs", async () => {
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: sqliteD1() };
    const cookie = await signedUpParent(env);
    const res = await handleApi(
      req("/api/account/vaccines", { method: "POST", headers: { cookie }, body: JSON.stringify({ kind: "dhpp", expires: "2027-01-01", fileName: "x.html", contentType: "text/html", data: "PGgxPg==" }) }),
      env,
    );
    expect(res!.status).toBe(400);
  });
});

describe("password reset (server, SQLite)", () => {
  it("lets the owner send a one-time link when no email service is set up", async () => {
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: sqliteD1() };
    await signedUpParent(env);

    // same answer for known and unknown emails
    const known = await handleApi(req("/api/account/forgot", { method: "POST", body: JSON.stringify({ email: "sam@example.com" }) }), env);
    const unknown = await handleApi(req("/api/account/forgot", { method: "POST", body: JSON.stringify({ email: "nobody@example.com" }) }), env);
    expect(await known!.json()).toEqual(await unknown!.json());

    expect((await handleApi(req("/api/staff/password-resets"), env))!.status).toBe(401);
    const staff = await staffCookie(env);
    const pending = await handleApi(req("/api/staff/password-resets", { headers: { cookie: staff } }), env);
    expect(((await pending!.json()) as { requests: { email: string }[] }).requests.map((r) => r.email)).toEqual(["sam@example.com"]);

    const issued = await handleApi(req("/api/staff/password-resets", { method: "POST", headers: { cookie: staff }, body: JSON.stringify({ email: "sam@example.com" }) }), env);
    const { link } = (await issued!.json()) as { link: string };
    const token = new URL(link).searchParams.get("reset")!;

    const reset = await handleApi(req("/api/account/reset", { method: "POST", body: JSON.stringify({ token, password: "brand-new-pass" }) }), env);
    expect(reset!.status).toBe(200);
    const reused = await handleApi(req("/api/account/reset", { method: "POST", body: JSON.stringify({ token, password: "another-pass1" }) }), env);
    expect(reused!.status).toBe(400);

    const oldLogin = await handleApi(req("/api/account/login", { method: "POST", body: JSON.stringify({ email: "sam@example.com", password: "woofwoof1" }) }), env);
    expect(oldLogin!.status).toBe(401);
    const newLogin = await handleApi(req("/api/account/login", { method: "POST", body: JSON.stringify({ email: "sam@example.com", password: "brand-new-pass" }) }), env);
    expect(newLogin!.status).toBe(200);
  });
});
