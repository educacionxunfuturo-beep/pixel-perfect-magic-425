/**
 * Staff (owner / dispatcher) sign-in. The password is checked by the server
 * (src/lib/server-api.ts) and the session lives in an HttpOnly cookie, so no
 * credential is stored in or compared by the browser code.
 */

export interface StaffConfig {
  signInEnabled: boolean;
  demoAccess: boolean;
  demoHint?: string;
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

export async function staffLogin(email: string, password: string): Promise<void> {
  const res = await post("/api/staff/login", { email, password });
  if (!res.ok) throw new Error(await errorMessage(res, "Sign-in failed."));
}

export async function staffDemoLogin(): Promise<void> {
  const res = await post("/api/staff/demo-login");
  if (!res.ok) throw new Error(await errorMessage(res, "Demo access is not available."));
}

export async function staffLogout(): Promise<void> {
  await post("/api/staff/logout").catch(() => undefined);
}

export async function getStaffSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const res = await fetch("/api/staff/session", { credentials: "same-origin" });
    if (!res.ok) return { authenticated: false };
    return (await res.json()) as { authenticated: boolean; email?: string };
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
