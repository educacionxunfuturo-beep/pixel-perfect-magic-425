import { useState } from "react";
import { AlertTriangle, Check, FileText, ShieldCheck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "./primitives";
import { saveVaccine, vaccineDocUrl, type ClientAccount, type VaccineKind } from "@/lib/client-account";
import { torontoToday } from "@/lib/appointments";

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-CA", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

const VACCINES: { kind: VaccineKind; name: string; sub: string }[] = [
  { kind: "rabies", name: "Rabies Vaccine", sub: "Required by law in Ontario" },
  { kind: "bordetella", name: "Bordetella (Kennel Cough)", sub: "Required for grooming" },
  { kind: "dhpp", name: "DHPP (Core Canine Vaccine)", sub: "Distemper, Hepatitis, Parvovirus" },
];

type Status = "missing" | "valid" | "due" | "expired";

function statusOf(expires: string | undefined, today: string): Status {
  if (!expires) return "missing";
  if (expires < today) return "expired";
  const days = (Date.parse(expires) - Date.parse(today)) / 86_400_000;
  return days <= 30 ? "due" : "valid";
}

const STATUS_UI: Record<Status, { label: string; tone: "success" | "gold" | "muted"; box: string }> = {
  valid: { label: "Up to date", tone: "success", box: "border-success/30 bg-success-soft/50" },
  due: { label: "Booster due soon", tone: "gold", box: "border-amber/40 bg-amber-soft/50" },
  expired: { label: "Expired", tone: "gold", box: "border-destructive/40 bg-destructive/5" },
  missing: { label: "Not on file", tone: "muted", box: "border-border bg-card" },
};

/** Vaccine records saved on the pet parent's account: expiry dates and certificates, visible to the groomer. */
export function AccountVaccines({ account, onSaved }: { account: ClientAccount; onSaved: (acc: ClientAccount) => void }) {
  const today = torontoToday();
  const [editing, setEditing] = useState<VaccineKind | null>(null);
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const records = account.profile.vaccines ?? {};

  const startEdit = (kind: VaccineKind) => {
    setEditing(kind);
    setExpires(records[kind]?.expires ?? "");
    setFile(null);
    setError(null);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      onSaved(await saveVaccine(editing, expires, file ?? undefined));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {VACCINES.map((v) => {
        const rec = records[v.kind];
        const status = statusOf(rec?.expires, today);
        const ui = STATUS_UI[status];
        const Icon = status === "valid" ? ShieldCheck : status === "missing" ? FileText : AlertTriangle;
        return (
          <div key={v.kind} className={cn("rounded-2xl border p-4", ui.box)}>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", status === "valid" ? "bg-success text-white" : status === "missing" ? "bg-muted text-muted-foreground" : "bg-amber text-ink")}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{v.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {v.sub} • {rec ? `${status === "expired" ? "Expired" : "Valid until"} ${longDate(rec.expires)}` : "Add the expiry date from your vet certificate"}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={ui.tone}>{ui.label}</Pill>
                {rec?.docId && (
                  <a href={vaccineDocUrl(rec.docId)} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-teal hover:text-teal">
                    View certificate
                  </a>
                )}
                <button onClick={() => startEdit(v.kind)} className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
                  <Upload className="h-3.5 w-3.5" /> {rec ? "Update" : "Add"}
                </button>
              </div>
            </div>

            {editing === v.kind && (
              <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                <label className="text-xs font-semibold text-muted-foreground">
                  Valid until
                  <input type="date" required value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Certificate (photo or PDF, under 1.4 MB)
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full text-xs text-foreground file:mr-2 file:rounded-full file:border-0 file:bg-teal file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
                </label>
                <div className="flex gap-2">
                  <button disabled={busy || !expires} onClick={save} className="flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                    <Check className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditing(null)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold">Cancel</button>
                </div>
                {error && <p className="text-xs font-semibold text-destructive sm:col-span-3">{error}</p>}
              </div>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground">Saved to your account. Your groomer sees these dates and certificates with every booking.</p>
    </div>
  );
}
