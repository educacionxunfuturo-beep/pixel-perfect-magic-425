import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, MessageCircle } from "lucide-react";
import { Pill } from "./primitives";

interface ResetRequest {
  email: string;
  name: string;
  phone: string;
  petName: string;
  requestedAt: string;
}

interface IssuedLink {
  email: string;
  name: string;
  phone: string;
  link: string;
}

function whatsappUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.length === 10 ? `1${digits}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

/**
 * Pet parents who forgot their password. Without an email service the owner checks who is asking
 * and sends a one-time link (valid 24 h) by WhatsApp or text.
 */
export function AdminResets() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    fetch("/api/staff/password-resets", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((d: { requests?: ResetRequest[] }) => setRequests(d.requests ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  const issue = async (email: string) => {
    setError(null);
    setCopied(false);
    const res = await fetch("/api/staff/password-resets", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => ({}))) as { link?: string; name?: string; phone?: string; error?: string };
    if (!res.ok || !data.link) {
      setError(data.error ?? "Could not create the link.");
      return;
    }
    setIssued({ email, name: data.name ?? "", phone: data.phone ?? "", link: data.link });
    load();
  };

  const message = issued ? `Hi ${issued.name.split(" ")[0]}, here is your The Fresh Pooch password reset link (valid 24 hours): ${issued.link}` : "";

  return (
    <div className="card-surface mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <KeyRound className="h-5 w-5 text-gold" /> Password help
          {requests.length > 0 && <Pill tone="gold">{requests.length} waiting</Pill>}
        </h2>
        <Pill tone="muted">Links work once and expire after 24 hours</Pill>
      </div>

      {requests.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No pending requests. When a pet parent taps "Forgot password?", it shows up here and on your phone.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {requests.map((r) => (
            <li key={r.email} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <strong>{r.name}</strong> <span className="text-muted-foreground">({r.petName}'s family) · {r.email} · {r.phone || "no phone"}</span>
                <div className="text-xs text-muted-foreground">Asked {new Date(r.requestedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <button onClick={() => issue(r.email)} className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-ink-foreground">Create reset link</button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualEmail.trim()) void issue(manualEmail.trim());
        }}
        className="mt-4 flex flex-wrap items-center gap-2 text-sm"
      >
        <span className="text-xs text-muted-foreground">A client called you instead?</span>
        <input type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="client@email.com" className="min-w-[220px] flex-1 rounded-full border border-border bg-background px-4 py-1.5 text-sm" />
        <button type="submit" className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:border-teal hover:text-teal">Create link</button>
      </form>
      {error && <p className="mt-2 text-xs font-semibold text-destructive">{error}</p>}

      {issued && (
        <div className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm">
          <div className="font-semibold">Reset link for {issued.name}</div>
          <code className="mt-1 block break-all text-xs text-muted-foreground">{issued.link}</code>
          <div className="mt-3 flex flex-wrap gap-2">
            {issued.phone && (
              <a href={whatsappUrl(issued.phone, message)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-1.5 text-xs font-bold text-white">
                <MessageCircle className="h-3.5 w-3.5" /> Send by WhatsApp
              </a>
            )}
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(message).then(() => setCopied(true));
              }}
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-semibold"
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy message"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
