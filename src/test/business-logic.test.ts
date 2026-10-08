import { beforeEach, describe, expect, it } from "vitest";

import { createAppointment, listAppointments, torontoToday, updateAppointment, type Appointment } from "@/lib/appointments";
import { monthKpis, upcomingBookings, weekBars, zoneCoverage } from "@/lib/dashboard-stats";
import { buildDemoCalendar } from "@/lib/demo-calendar";
import { PACKAGES } from "@/components/fp/PublicSections";
import { QUOTE_BREEDS, SERVICE_IDS, WEIGHT_TIERS, priceRange, quote } from "@/lib/pricing";
import { copilotReply, quoteReply } from "@/lib/qimmiq-replies";
import { handleApi } from "@/lib/server-api";
import { buildOpsSnapshot } from "@/lib/copilot-snapshot";

describe("shared price list", () => {
  it("keeps every quote inside the published package floor", () => {
    for (const service of SERVICE_IDS) {
      const pkg = PACKAGES.find((p) => p.id === service)!;
      for (const tier of WEIGHT_TIERS) {
        for (const breed of QUOTE_BREEDS) {
          expect(quote({ service, tier: tier.id, breed: breed.name }).base).toBeGreaterThanOrEqual(pkg.from);
        }
      }
    }
  });

  it("matches the quote wizard formula (Goldendoodle, medium, full groom = $180)", () => {
    expect(quote({ service: "full", tier: "m", breed: "Goldendoodle" }).base).toBe(180);
    expect(quote({ service: "full", tier: "m", breed: "Goldendoodle", coat: "light", addons: ["salt"], sibling: true }).total).toBe(180 + 20 + 25 - 20);
  });

  it("gives Qimmiq the same price as the wizard", () => {
    const reply = quoteReply("en", { breed: "Goldendoodle", breedTier: "medium" });
    expect(reply.text).toContain("**Premium Full Groom:** $180 CAD");
    expect(reply.actionItems?.find((c) => c.name.startsWith("Premium Full Groom"))?.price).toBe(180);
  });

  it("returns ordered ranges", () => {
    for (const service of SERVICE_IDS) {
      const [low, high] = priceRange(service);
      expect(low).toBeLessThanOrEqual(high);
    }
  });
});

describe("appointment store (demo mode)", () => {
  beforeEach(() => localStorage.clear());

  it("seeds today's route and links a new booking to the dashboard", async () => {
    const today = torontoToday();
    const before = await listAppointments();
    expect(before.filter((a) => a.date === today && a.source === "route")).toHaveLength(5);

    const created = await createAppointment({
      petName: "Barnaby",
      breed: "Mini Goldendoodle",
      weightLbs: 26,
      service: "full",
      date: today,
      time: "2:30 PM",
      address: "142 Roehampton Ave",
      source: "portal",
    });
    expect(created.total).toBe(180);

    const after = await listAppointments();
    expect(upcomingBookings(after, today).map((a) => a.id)).toContain(created.id);
    expect(weekBars(after, today).find((d) => d.date === today)!.grooms).toBe(6);
  });

  it("counts a groom only when it is completed", async () => {
    const today = torontoToday();
    const list = await listAppointments();
    const doneBefore = monthKpis(list, today).grooms;
    const next = list.find((a) => a.date === today && a.status !== "completed")!;
    await updateAppointment(next.id, { status: "completed" });
    expect(monthKpis(await listAppointments(), today).grooms).toBe(doneBefore + 1);
  });

  it("reports zone fill as a percentage", async () => {
    for (const z of zoneCoverage(await listAppointments())) {
      expect(z.fill).toBeGreaterThanOrEqual(0);
      expect(z.fill).toBeLessThanOrEqual(100);
    }
  });

  it("answers the owner copilot from the stored data", async () => {
    const list: Appointment[] = await listAppointments();
    const reply = copilotReply("today's revenue", "en", list);
    expect(reply.text).toContain(`${monthKpis(list).grooms} grooms`);
  });
});

describe("staff sign-in (server)", () => {
  const env = { STAFF_PASSWORD: "s3cret", DEMO_STAFF_ACCESS: "true" };
  const req = (path: string, init?: RequestInit) => new Request(`https://demo.test${path}`, init);

  it("rejects a wrong password and accepts the right one", async () => {
    const bad = await handleApi(
      req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "nope" }) }),
      env,
    );
    expect(bad!.status).toBe(401);

    const good = await handleApi(
      req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "s3cret" }) }),
      env,
    );
    expect(good!.status).toBe(200);
    const cookie = good!.headers.get("set-cookie")!.split(";")[0]!;
    expect(cookie).toMatch(/^fp_staff=/);

    const session = await handleApi(req("/api/staff/session", { headers: { cookie } }), env);
    expect(await session!.json()).toEqual({ authenticated: true, email: "admin@thefreshpooch.ca" });

    const forged = await handleApi(req("/api/staff/session", { headers: { cookie: `${cookie}x` } }), env);
    expect(await forged!.json()).toEqual({ authenticated: false });
  });

  it("refuses sign-in when no password is configured", async () => {
    const res = await handleApi(req("/api/staff/login", { method: "POST", body: "{}" }), {});
    expect(res!.status).toBe(503);
  });

  it("requires a staff session to send SMS", async () => {
    const res = await handleApi(req("/api/notifications/sms", { method: "POST", body: JSON.stringify({ to: "+14165550199", body: "hi" }) }), env);
    expect(res!.status).toBe(401);
  });

  it("requires a staff session for the AI owner copilot", async () => {
    const res = await handleApi(req("/api/qimmiq/copilot", { method: "POST", body: JSON.stringify({ query: "revenue?" }) }), { ...env, GEMINI_API_KEY: "test" });
    expect(res!.status).toBe(401);
  });

  it("leaves non-API paths to the app", async () => {
    expect(await handleApi(req("/"), env)).toBeNull();
  });
});

describe("demo calendar feed", () => {
  it("lists today's route without access codes or phone numbers", () => {
    const ics = buildDemoCalendar(new Date("2026-10-08T12:00:00Z"));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(5);
    expect(ics).toContain("DTSTART;TZID=America/Toronto:20261008T083000");
    expect(ics).not.toMatch(/4821|3390|416-555/);
  });
});

describe("owner copilot snapshot", () => {
  it("summarises the business without access codes, phones or addresses", async () => {
    const list = await listAppointments();
    const snapshot = buildOpsSnapshot(list);
    expect(snapshot).toContain("Month to date");
    expect(snapshot).toContain("Today's stops");
    for (const a of list.filter((x) => x.latchkeyCode || x.ownerPhone)) {
      if (a.latchkeyCode) expect(snapshot).not.toContain(a.latchkeyCode);
      if (a.ownerPhone) expect(snapshot).not.toContain(a.ownerPhone);
    }
    expect(snapshot).not.toMatch(/9142|4821|3390|7105|1628|Roehampton|Broadway Ave/);
  });
});

describe("shared bookings (server, D1)", () => {
  // Minimal in-memory stand-in for the D1 binding
  function fakeD1() {
    const rows = new Map<string, { id: string; date: string; data: string }>();
    return {
      rows,
      prepare(sql: string) {
        return {
          bind(...v: unknown[]) {
            return {
              async run() {
                if (sql.startsWith("INSERT OR IGNORE") && !rows.has(String(v[0]))) rows.set(String(v[0]), { id: String(v[0]), date: String(v[1]), data: String(v[2]) });
                if (sql.startsWith("UPDATE")) rows.get(String(v[2]))!.data = String(v[0]);
                return {};
              },
              async all<T>() {
                return { results: [...rows.values()].filter((r) => r.date >= String(v[0])) as T[] };
              },
              async first<T>() {
                return (rows.get(String(v[0])) ?? null) as T | null;
              },
            };
          },
        };
      },
    };
  }
  const req = (path: string, init?: RequestInit) => new Request(`https://demo.test${path}`, { headers: { "cf-connecting-ip": "203.0.113.9" }, ...init });
  const booking = { id: "appt-test-1", date: "2026-10-10", service: "full", source: "web", petName: "Milo", breed: "Goldendoodle", total: 180, latchkeyCode: "1234", status: "completed" };

  it("stores public bookings as requests and shows them only to staff", async () => {
    const env = { STAFF_PASSWORD: "s3cret", BOOKINGS_DB: fakeD1() };
    const created = await handleApi(req("/api/bookings", { method: "POST", body: JSON.stringify(booking) }), env);
    expect(created!.status).toBe(201);
    expect(JSON.parse(env.BOOKINGS_DB.rows.get("appt-test-1")!.data).status).toBe("requested");

    const overwrite = await handleApi(req("/api/bookings", { method: "POST", body: JSON.stringify({ ...booking, petName: "Hacker" }) }), env);
    expect(overwrite!.status).toBe(201);
    expect(JSON.parse(env.BOOKINGS_DB.rows.get("appt-test-1")!.data).petName).toBe("Milo");

    expect((await handleApi(req("/api/bookings"), env))!.status).toBe(401);
    expect((await handleApi(req("/api/bookings/appt-test-1", { method: "PATCH", body: '{"status":"cancelled"}' }), env))!.status).toBe(401);

    const login = await handleApi(req("/api/staff/login", { method: "POST", body: JSON.stringify({ email: "admin@thefreshpooch.ca", password: "s3cret" }) }), env);
    const cookie = login!.headers.get("set-cookie")!.split(";")[0]!;
    const list = await handleApi(req("/api/bookings", { headers: { cookie } }), env);
    expect((await list!.json()).bookings).toHaveLength(1);

    const patched = await handleApi(req("/api/bookings/appt-test-1", { method: "PATCH", headers: { cookie }, body: '{"status":"confirmed"}' }), env);
    expect(patched!.status).toBe(200);
    expect(JSON.parse(env.BOOKINGS_DB.rows.get("appt-test-1")!.data).status).toBe("confirmed");
  });

  it("rejects malformed bookings", async () => {
    const env = { BOOKINGS_DB: fakeD1() };
    const bad = await handleApi(req("/api/bookings", { method: "POST", body: JSON.stringify({ ...booking, id: "x'; DROP", date: "tomorrow" }) }), env);
    expect(bad!.status).toBe(400);
  });
});
