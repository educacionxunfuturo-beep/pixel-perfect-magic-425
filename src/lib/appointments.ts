import { useCallback, useEffect, useState } from "react";
import { DEMO_ROUTE_STOPS } from "./demo-route";
import { QUOTE_BREEDS, SERVICES, quote, tierForWeight, type ServiceId } from "./pricing";

/**
 * One appointment store for the whole app: the portal and the public quote
 * create bookings, the groomer app works through today's route, and the owner
 * dashboard computes its figures from the same records.
 *
 * - With VITE_API_URL set, appointments live in the NestJS backend (/booking/*).
 * - Without it (the public demo), they live in this browser's localStorage,
 *   seeded with today's Van #1 route and a deterministic sample history so the
 *   dashboard has something to count. Each visitor gets their own copy.
 */

export type AppointmentStatus = "requested" | "confirmed" | "en_route" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "card" | "apple_pay" | "google_pay" | "interac";
export type AppointmentSource = "route" | "portal" | "web" | "history";

export interface ReportCard {
  coat?: string;
  skin?: string;
  ears?: string;
  nails?: string;
  temperament?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  reference: string;
  petName: string;
  breed: string;
  weightLbs: number;
  service: ServiceId;
  total: number;
  /** YYYY-MM-DD, Toronto time */
  date: string;
  /** Stop time on the route, e.g. "10:00 AM" */
  time: string;
  timeWindow?: string;
  address: string;
  postalCode?: string;
  ownerName?: string;
  ownerPhone?: string;
  latchkeyCode?: string;
  notes?: string;
  waiver?: string;
  paymentMethod?: PaymentMethod;
  status: AppointmentStatus;
  source: AppointmentSource;
  createdAt: string;
  completedAt?: string;
  report?: ReportCard;
}

export type NewAppointment = Omit<Appointment, "id" | "reference" | "createdAt" | "total" | "status"> & {
  status?: AppointmentStatus;
  /** Quoted total including coat, add-ons and discounts; defaults to the base price. */
  total?: number;
};

export const TIME_WINDOWS = [
  { label: "Morning (8:30 AM – 11:00 AM)", start: "8:30 AM" },
  { label: "Midday (11:30 AM – 2:00 PM)", start: "11:30 AM" },
  { label: "Afternoon (2:30 PM – 5:30 PM)", start: "2:30 PM" },
];

/** Weekly route: which neighbourhood Van #1 serves each day (Sunday = 0). */
export const ROUTE_DAYS: { day: string; area: string }[] = [
  { day: "Sunday", area: "Leaside" },
  { day: "Monday", area: "King West" },
  { day: "Tuesday", area: "The Annex" },
  { day: "Wednesday", area: "Midtown" },
  { day: "Thursday", area: "Rosedale" },
  { day: "Friday", area: "Christie Pits" },
  { day: "Saturday", area: "The Beaches" },
];

/** Stops Van #1 can take in one route day (used for zone fill rates). */
export const STOPS_PER_ROUTE_DAY = 6;

const TZ = "America/Toronto";
const STORE_KEY = "fp_appointments_v1";
const CHANGED_EVENT = "fp-appointments-changed";
const API_BASE: string | undefined = (import.meta as any).env?.VITE_API_URL || undefined;

// ---------- dates ----------

export function torontoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayIndex(date: string): number {
  return parseDate(date).getUTCDay();
}

export function routeForDate(date: string): { day: string; area: string } {
  return ROUTE_DAYS[weekdayIndex(date)]!;
}

export function formatDate(date: string): string {
  return parseDate(date).toLocaleDateString("en-CA", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
}

/** "1:30 PM" -> minutes since midnight */
export function timeToMinutes(time: string): number {
  const [, h, m, ampm] = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim()) ?? [];
  if (!h) return 0;
  return (Number(h) % 12) * 60 + (ampm?.toUpperCase() === "PM" ? 720 : 0) + Number(m);
}

export function sortByTime(list: Appointment[]): Appointment[] {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || timeToMinutes(a.time) - timeToMinutes(b.time));
}

// ---------- pricing ----------

function canonicalBreed(breed: string): string | undefined {
  const b = breed.toLowerCase();
  return QUOTE_BREEDS.find((q) => b.includes(q.name.toLowerCase()))?.name;
}

export function priceFor(service: ServiceId, breed: string, weightLbs: number): number {
  return quote({ service, tier: tierForWeight(weightLbs), breed: canonicalBreed(breed) ?? breed }).total;
}

// ---------- demo seed ----------

const ROUTE_SERVICE: Record<string, ServiceId> = {
  "Full Spa": "full",
  "Teddy Cut": "full",
  "Bath & Tidy": "tidy",
  "De-Shed Spa": "ultimate",
};
const ROUTE_WEIGHT: Record<string, number> = {
  Maltese: 9,
  Goldendoodle: 32,
  "French Bulldog": 24,
  "Golden Retriever": 68,
  "Shih Tzu": 14,
};
const ROUTE_STATUS: Record<string, AppointmentStatus> = {
  Completed: "completed",
  "En Route": "en_route",
  Next: "confirmed",
  Pending: "confirmed",
};

function todaysRoute(today: string): Appointment[] {
  return DEMO_ROUTE_STOPS.map((stop, i) => {
    const service = ROUTE_SERVICE[stop.svc] ?? "full";
    const weightLbs = ROUTE_WEIGHT[stop.breed] ?? 30;
    const status = ROUTE_STATUS[stop.status] ?? "confirmed";
    return {
      id: `route-${today}-${i + 1}`,
      reference: `FP-${today.replace(/-/g, "").slice(2)}-${i + 1}`,
      petName: stop.pet,
      breed: stop.breed,
      weightLbs,
      service,
      total: priceFor(service, stop.breed, weightLbs),
      date: today,
      time: stop.time,
      address: stop.address,
      ownerName: `${stop.pet}'s family`,
      ownerPhone: stop.phone,
      latchkeyCode: stop.code,
      notes: stop.notes,
      waiver: stop.waiver,
      status,
      source: "route",
      createdAt: `${today}T07:00:00.000Z`,
      ...(status === "completed" ? { completedAt: `${today}T${String(9 + i).padStart(2, "0")}:30:00.000Z` } : {}),
    };
  });
}

// Small deterministic PRNG so the sample history is identical on every visit.
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SAMPLE_PETS = ["Milo", "Coco", "Winston", "Daisy", "Teddy", "Luna", "Murphy", "Rosie", "Oliver", "Maple", "Bailey", "Pip", "Biscuit", "Hazel"];
const SAMPLE_WEIGHTS: Record<string, number> = {
  Goldendoodle: 35, Maltese: 9, "French Bulldog": 24, "Golden Retriever": 68, "Shih Tzu": 14,
  Bernedoodle: 80, "Labrador Retriever": 70, "Cavalier King Charles": 16, "Standard Poodle": 55, "Siberian Husky": 50,
};
const SAMPLE_SLOTS = ["8:30 AM", "10:00 AM", "11:45 AM", "1:30 PM", "3:15 PM", "4:45 PM"];

function sampleHistory(today: string): Appointment[] {
  const first = parseDate(today);
  first.setUTCMonth(first.getUTCMonth() - 1, 1);
  const out: Appointment[] = [];
  for (let date = first.toISOString().slice(0, 10); date < today; date = addDays(date, 1)) {
    const rnd = seededRandom(date);
    const { area } = routeForDate(date);
    const stops = 3 + Math.floor(rnd() * (STOPS_PER_ROUTE_DAY - 2));
    for (let i = 0; i < stops; i++) {
      const breed = QUOTE_BREEDS[Math.floor(rnd() * QUOTE_BREEDS.length)]!.name;
      const r = rnd();
      const service: ServiceId = r < 0.25 ? "tidy" : r < 0.8 ? "full" : "ultimate";
      const weightLbs = SAMPLE_WEIGHTS[breed] ?? 30;
      out.push({
        id: `hist-${date}-${i + 1}`,
        reference: `FP-${date.replace(/-/g, "").slice(2)}-${i + 1}`,
        petName: SAMPLE_PETS[Math.floor(rnd() * SAMPLE_PETS.length)]!,
        breed,
        weightLbs,
        service,
        total: priceFor(service, breed, weightLbs),
        date,
        time: SAMPLE_SLOTS[i]!,
        address: `${area}, Toronto`,
        status: "completed",
        source: "history",
        createdAt: `${date}T07:00:00.000Z`,
        completedAt: `${date}T18:00:00.000Z`,
      });
    }
  }
  return out;
}

// ---------- local store ----------

interface LocalStore {
  seededFor: string;
  appointments: Appointment[];
}

function readLocal(): LocalStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as LocalStore) : null;
  } catch {
    return null;
  }
}

function writeLocal(store: LocalStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // storage full or blocked: the session keeps working with in-memory data
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Loads the local store, re-seeding the route and sample history when the day changes. */
function loadLocal(today = torontoToday()): LocalStore {
  const existing = readLocal();
  if (existing && existing.seededFor === today) return existing;
  const keep = (existing?.appointments ?? []).filter((a) => a.source === "portal" || a.source === "web");
  const store = { seededFor: today, appointments: [...sampleHistory(today), ...todaysRoute(today), ...keep] };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      // ignore
    }
  }
  return store;
}

function newReference(date: string): string {
  return `FP-${date.replace(/-/g, "").slice(2)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ---------- backend adapter (VITE_API_URL) ----------

const API_SERVICE: Record<ServiceId, string> = { tidy: "BATH_TIDY", full: "PREMIUM_GROOM", ultimate: "ULTIMATE_SPA" };
const API_STATUS_TO_LOCAL: Record<string, AppointmentStatus> = {
  DRAFT: "requested",
  CONFIRMED: "confirmed",
  EN_ROUTE: "en_route",
  ARRIVED: "in_progress",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "cancelled",
};
const LOCAL_STATUS_TO_API: Record<AppointmentStatus, string> = {
  requested: "DRAFT",
  confirmed: "CONFIRMED",
  en_route: "EN_ROUTE",
  in_progress: "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};
// The backend does not store breed, service or report cards on the appointment; keep them per id.
const API_EXTRAS_KEY = "fp_api_appointment_extras";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(message || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function apiExtras(): Record<string, Partial<Appointment>> {
  try {
    return JSON.parse(localStorage.getItem(API_EXTRAS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveApiExtras(id: string, extras: Partial<Appointment>) {
  const all = apiExtras();
  all[id] = { ...all[id], ...extras };
  try {
    localStorage.setItem(API_EXTRAS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

interface ApiAppointment {
  id: string;
  bookingReference: string;
  status: string;
  petName: string;
  scheduledStart: string;
  totalPriceCents: number;
  fullAddress: string;
  lockboxCode?: string;
  customerPhone?: string;
  createdAt?: string;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fromApi(a: ApiAppointment): Appointment {
  const [date = torontoToday(), clock = "09:00"] = a.scheduledStart.split("T");
  const [hh = "9", mm = "0"] = clock.split(":");
  const extras = apiExtras()[a.id] ?? {};
  return {
    service: "full",
    breed: "",
    weightLbs: 30,
    source: "portal",
    ...extras,
    id: a.id,
    reference: a.bookingReference,
    petName: a.petName,
    total: Math.round(a.totalPriceCents / 100),
    date,
    time: minutesToTime(Number(hh) * 60 + Number(mm)),
    address: a.fullAddress,
    ...(a.lockboxCode ? { latchkeyCode: a.lockboxCode } : {}),
    ...(a.customerPhone ? { ownerPhone: a.customerPhone } : {}),
    status: API_STATUS_TO_LOCAL[a.status] ?? "confirmed",
    createdAt: a.createdAt ?? new Date().toISOString(),
  };
}

function to24h(time: string): string {
  const minutes = timeToMinutes(time);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

async function apiCreate(input: NewAppointment): Promise<Appointment> {
  const pet = await apiJson<{ id: string }>("/pets", {
    method: "POST",
    body: JSON.stringify({ name: input.petName, breed: input.breed || "Mixed", weightLbs: input.weightLbs }),
  });
  const created = await apiJson<ApiAppointment>("/booking/reserve", {
    method: "POST",
    body: JSON.stringify({
      petId: pet.id,
      serviceCode: API_SERVICE[input.service],
      addressLine1: input.address,
      postalCode: input.postalCode || "M4P 1R4",
      isCondo: false,
      isLatchkeyService: Boolean(input.latchkeyCode),
      ...(input.latchkeyCode ? { lockboxCode: input.latchkeyCode } : {}),
      emergencyMedicalAuthSigned: true,
      scheduledDate: input.date,
      slotTime: to24h(input.time),
      customerName: input.ownerName || "Pet Parent",
      customerPhone: input.ownerPhone || "+16474511747",
      customerEmail: "bookings@thefreshpooch.ca",
      acceptedCancellationPolicy: true,
      // The backend defaults to an 18% tip; tips are chosen after the groom, not at booking.
      tipPercentage: 0,
    }),
  });
  saveApiExtras(created.id, {
    breed: input.breed,
    weightLbs: input.weightLbs,
    service: input.service,
    source: input.source,
    ...(input.timeWindow ? { timeWindow: input.timeWindow } : {}),
    ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
    ...(input.ownerName ? { ownerName: input.ownerName } : {}),
  });
  return fromApi(created);
}

// ---------- shared bookings (/api/bookings, Cloudflare D1) ----------
// Without the NestJS backend, bookings from the portal, the quote and the Qimmiq cart are also
// sent to the Worker so staff see them on any device. Only a signed-in staff session can read them.

let sharedAccess = false;

async function shareBooking(appt: Appointment) {
  try {
    await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(appt) });
  } catch {
    // offline or no shared store: the booking stays on this device
  }
}

async function fetchSharedBookings(): Promise<Appointment[]> {
  try {
    const res = await fetch("/api/bookings", { credentials: "same-origin" });
    sharedAccess = res.ok;
    if (!res.ok) return [];
    const data = (await res.json()) as { bookings?: Appointment[] };
    return data.bookings ?? [];
  } catch {
    sharedAccess = false;
    return [];
  }
}

/** Shared copies win: staff may have confirmed or completed them on another device. */
function mergeShared(local: Appointment[], shared: Appointment[]): Appointment[] {
  if (!shared.length) return local;
  const byId = new Map(shared.map((a) => [a.id, a]));
  const merged = local.map((a) => (byId.has(a.id) ? { ...a, ...byId.get(a.id)! } : a));
  const known = new Set(local.map((a) => a.id));
  return [...merged, ...shared.filter((a) => !known.has(a.id))];
}

// ---------- public API ----------

export const isUsingBackend = Boolean(API_BASE);

export async function listAppointments(): Promise<Appointment[]> {
  if (API_BASE) {
    const list = await apiJson<ApiAppointment[]>("/booking/appointments");
    return sortByTime(list.map(fromApi));
  }
  const shared = await fetchSharedBookings();
  return sortByTime(mergeShared(loadLocal().appointments, shared));
}

export async function createAppointment(input: NewAppointment): Promise<Appointment> {
  if (API_BASE) {
    const created = await apiCreate(input);
    window.dispatchEvent(new Event(CHANGED_EVENT));
    return created;
  }
  const store = loadLocal();
  const appt: Appointment = {
    ...input,
    id: `appt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    reference: newReference(input.date),
    total: input.total ?? priceFor(input.service, input.breed, input.weightLbs),
    status: input.status ?? "confirmed",
    createdAt: new Date().toISOString(),
  };
  store.appointments.push(appt);
  writeLocal(store);
  if (appt.source === "portal" || appt.source === "web") await shareBooking(appt);
  return appt;
}

export async function updateAppointment(id: string, patch: Partial<Pick<Appointment, "status" | "report" | "completedAt">>) {
  if (API_BASE) {
    if (patch.status) {
      await apiJson(`/booking/appointments/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: LOCAL_STATUS_TO_API[patch.status] }),
      });
    }
    const { status: _status, ...extras } = patch;
    if (Object.keys(extras).length) saveApiExtras(id, extras);
    window.dispatchEvent(new Event(CHANGED_EVENT));
    return;
  }
  if (sharedAccess) {
    try {
      // 404 for route stops that only live on this device
      await fetch(`/api/bookings/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    } catch {
      // keep the local update
    }
  }
  const store = loadLocal();
  store.appointments = store.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a));
  writeLocal(store);
}

/** Live list of appointments; refreshes when any part of the app changes them (also across tabs). */
export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    listAppointments()
      .then((list) => {
        setAppointments(list);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => e.key === STORE_KEY && reload();
    window.addEventListener(CHANGED_EVENT, reload);
    window.addEventListener("storage", onStorage);
    // staff screens pick up bookings made on other devices
    const poll = window.setInterval(() => {
      if (sharedAccess && document.visibilityState === "visible") reload();
    }, 20_000);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener(CHANGED_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  return { appointments, loaded, error, reload };
}

export function serviceName(service: ServiceId): string {
  return SERVICES[service].name;
}
