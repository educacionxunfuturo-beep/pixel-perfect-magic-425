import type { Appointment } from "./appointments";

/**
 * Pet-parent accounts, checked by the server (/api/account/*, src/lib/server-api.ts).
 * The session is an HttpOnly cookie; the browser only sees the profile and the account's bookings.
 */

export interface ClientProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  pet: { name: string; breed: string; weightLbs: number };
  createdAt: string;
  access?: { code: string; notes: string };
  vaccines?: Partial<Record<VaccineKind, { expires: string; docId?: string; fileName?: string; uploadedAt: string }>>;
}

export type VaccineKind = "rabies" | "bordetella" | "dhpp";

export interface ClientAccount {
  profile: ClientProfile;
  bookings: Appointment[];
}

/** The sample pet parent: signs in without the server and shows the full demo portal. */
export const DEMO_CLIENT_EMAIL = "jordan.m@torontoparents.ca";

async function call(path: string, body?: unknown): Promise<ClientAccount> {
  const res = await fetch(path, body === undefined ? { credentials: "same-origin" } : {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<ClientAccount> & { error?: string };
  if (!res.ok || !data.profile) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return { profile: data.profile, bookings: data.bookings ?? [] };
}

export function clientSignup(input: { name: string; email: string; password: string; phone: string; address: string; petName: string; petBreed: string; petWeightLbs: number }) {
  return call("/api/account/signup", input);
}

export function clientLogin(email: string, password: string) {
  return call("/api/account/login", { email, password });
}

/** The signed-in account, or null. */
export async function getClientAccount(): Promise<ClientAccount | null> {
  try {
    return await call("/api/account");
  } catch {
    return null;
  }
}

export async function clientLogout() {
  await fetch("/api/account/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
}

/** Saves the lockbox / door code and access notes on the account. */
export function saveAccess(code: string, notes: string) {
  return call("/api/account/access", { code, notes });
}

/** Saves a vaccine's expiry date and, optionally, a photo or PDF of the certificate. */
export async function saveVaccine(kind: VaccineKind, expires: string, file?: File) {
  let upload = {};
  if (file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    upload = { fileName: file.name, contentType: file.type || "application/octet-stream", data: btoa(bin) };
  }
  return call("/api/account/vaccines", { kind, expires, ...upload });
}

export function vaccineDocUrl(docId: string) {
  return `/api/vaccine-docs/${docId}`;
}

/** Asks for a password reset; the answer is the same whether or not the email has an account. */
export async function requestPasswordReset(email: string): Promise<"email" | "owner"> {
  const res = await fetch("/api/account/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  const data = (await res.json().catch(() => ({}))) as { delivery?: "email" | "owner"; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data.delivery ?? "owner";
}

export function resetPassword(token: string, password: string) {
  return call("/api/account/reset", { token, password });
}
