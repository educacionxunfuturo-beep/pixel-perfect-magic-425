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
}

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
