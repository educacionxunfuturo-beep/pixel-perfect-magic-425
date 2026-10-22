/**
 * Staff (owner / dispatcher) sign-in. The password is checked by the server
 * (src/lib/server-api.ts) and the session lives in an HttpOnly cookie, so no
 * credential is stored in or compared by the browser code.
 */

export interface StaffConfig {
  signInEnabled: boolean;
  demoAccess: boolean;
  demoHint?: string;
  /** The owner set her own sign-in: the app shows real data only, no sample figures. */
  live?: boolean;
}

/** Business domains: only these emails are sent to the staff sign-in. */
const STAFF_DOMAINS = ["@thefreshpooch.ca", "@doggroomingtoronto.ca"];

export function looksLikeStaffEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return STAFF_DOMAINS.some((d) => e.endsWith(d));
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

// The session cookie is HttpOnly, so this flag tells the page whether asking for the shared
// bookings is worth it. Visitors never send that request (it would only answer 401).
const STAFF_HINT_KEY = "fp-staff-hint";

export function hasStaffHint(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(STAFF_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStaffHint(on: boolean) {
  try {
    if (on) window.localStorage.setItem(STAFF_HINT_KEY, "1");
    else window.localStorage.removeItem(STAFF_HINT_KEY);
  } catch {
    // storage blocked: bookings then load after the session check
  }
}

/** Staff can read the shared bookings: every part of the app showing bookings reloads them. */
function refreshBookings() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fp-appointments-changed"));
}

export async function staffLogin(email: string, password: string): Promise<void> {
  const res = await post("/api/staff/login", { email, password });
  if (!res.ok) throw new Error(await errorMessage(res, "Sign-in failed."));
  setStaffHint(true);
  refreshBookings();
}

export async function staffDemoLogin(): Promise<void> {
  const res = await post("/api/staff/demo-login");
  if (!res.ok) throw new Error(await errorMessage(res, "Demo access is not available."));
  setStaffHint(true);
  refreshBookings();
}

export async function staffLogout(): Promise<void> {
  await post("/api/staff/logout").catch(() => undefined);
  setStaffHint(false);
  refreshBookings();
}

/** Replaces the starter password with the owner's own (and optionally her sign-in email). */
export async function updateOwnerAccount(input: { currentPassword: string; newPassword: string; email: string }): Promise<string> {
  const res = await post("/api/staff/account", input);
  if (!res.ok) throw new Error(await errorMessage(res, "Could not save the new sign-in."));
  setStaffHint(true);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("fp-business-live"));
  return ((await res.json()) as { email: string }).email;
}

export async function getStaffSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const res = await fetch("/api/staff/session", { credentials: "same-origin" });
    if (!res.ok) return { authenticated: false };
    const session = (await res.json()) as { authenticated: boolean; email?: string };
    const had = hasStaffHint();
    setStaffHint(session.authenticated);
    if (session.authenticated && !had) refreshBookings();
    return session;
  } catch {
    return { authenticated: false };
  }
}

export async function getStaffConfig(): Promise<StaffConfig> {
  try {
    const res = await fetch("/api/staff/config");
    if (!res.ok) return { signInEnabled: false, demoAccess: false };
    return (await res.json()) as StaffConfig;
  } catch {
    return { signInEnabled: false, demoAccess: false };
  }
}
