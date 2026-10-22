import { useState } from "react";
import { CheckCircle2, UserCog } from "lucide-react";
import { updateOwnerAccount } from "@/lib/staff-session";
import { Pill } from "./primitives";

const input = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-1 focus:ring-teal";

/**
 * The owner replaces the starter password with her own. From then on the app is "live":
 * sample bookings and figures disappear and the dashboard counts only real bookings.
 */
export function OwnerAccount({ email, live, onSaved }: { email: string; live: boolean; onSaved: (email: string) => void }) {
  const [form, setForm] = useState({ email, current: "", next: "", repeat: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.next !== form.repeat) {
      setError("The two new passwords are not the same.");
      return;
    }
    setSaving(true);
    try {
      const saved = await updateOwnerAccount({ currentPassword: form.current, newPassword: form.next, email: form.email });
      setForm({ email: saved, current: "", next: "", repeat: "" });
      setDone(true);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the new sign-in.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="owner-account" className="card-surface mt-6 scroll-mt-24 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <UserCog className="h-5 w-5 text-gold" /> Your owner sign-in
        </h2>
        {live ? <Pill tone="success">Your own password is active</Pill> : <Pill tone="gold">Starter password in use</Pill>}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {live
          ? "Change your sign-in email or password at any time. Only you know this password: nobody else, including the developer, can see it."
          : "Choose your own password to make this dashboard yours. Sample bookings and figures disappear and only your real bookings remain."}
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
          Sign-in email
          <input type="email" required value={form.email} onChange={set("email")} placeholder="you@doggroomingtoronto.ca" className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
          Current password
          <input type="password" required autoComplete="current-password" value={form.current} onChange={set("current")} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          New password (10+ characters)
          <input type="password" required minLength={10} autoComplete="new-password" value={form.next} onChange={set("next")} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          Repeat new password
          <input type="password" required minLength={10} autoComplete="new-password" value={form.repeat} onChange={set("repeat")} className={`${input} mt-1`} />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={saving} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-ink-foreground transition hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : live ? "Save changes" : "Make this dashboard mine"}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> Saved. Use it next time you sign in.
            </span>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-destructive sm:col-span-2">{error}</p>}
      </form>
    </div>
  );
}
