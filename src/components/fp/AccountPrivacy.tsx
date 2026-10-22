import { useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { deleteAccount, downloadMyData, type ClientAccount } from "@/lib/client-account";

/** Pet-parent privacy controls: download the account's data, or delete the account for good. */
export function AccountPrivacy({ account, onDeleted }: { account: ClientAccount; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="privacy-account" className="card-surface mt-8 scroll-mt-24 p-6">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
        <ShieldCheck className="h-5 w-5 text-teal" /> Privacy & account
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Your data is yours. Download a copy at any time, or delete your account and personal data. Read our{" "}
        <a href="/privacy" className="font-semibold text-teal underline">Privacy Policy</a>.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadMyData(account)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-teal hover:text-teal"
        >
          <Download className="h-3.5 w-3.5" /> Download my data
        </button>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete my account
          </button>
        )}
      </div>

      {confirming && (
        <form onSubmit={remove} className="mt-4 max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-foreground">Delete your account for good?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Your profile, {account.profile.pet.name}'s records, your access code and your vaccine certificates are erased.</li>
            <li>Upcoming bookings are cancelled. Past bookings keep only the date, service and price, as Canadian tax law requires, without your name or contact details.</li>
            <li>This cannot be undone.</li>
          </ul>
          <label className="mt-3 block text-xs font-semibold text-muted-foreground">
            Enter your password to confirm
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-destructive"
            />
          </label>
          {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="rounded-full bg-destructive px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
            <button type="button" onClick={() => { setConfirming(false); setPassword(""); setError(null); }} className="rounded-full border border-border px-4 py-2 text-xs font-semibold">
              Keep my account
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
