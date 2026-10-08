import { useEffect, useMemo, useState } from "react";
import {
  Phone, MessageSquare, KeyRound, Eye, EyeOff, FileSignature, Camera, Rocket, MapPin, Check, ShieldCheck,
  Bell, Send, CheckCircle2, DollarSign, X, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, Pill } from "./primitives";
import { dispatchNotification, type DispatchResult, generateWhatsAppLink } from "@/lib/notifications";
import { recordRealCompletedGroom } from "@/lib/useLiveGroomCounter";
import { routeForDate, serviceName, torontoToday, updateAppointment, useAppointments, type Appointment } from "@/lib/appointments";

type StopLabel = "Completed" | "En Route" | "In Progress" | "Next" | "Pending";
const statusTone: Record<StopLabel, "success" | "gold" | "teal" | "muted"> = {
  Completed: "success",
  "En Route": "gold",
  "In Progress": "gold",
  Next: "teal",
  Pending: "muted",
};

function stopLabels(stops: Appointment[]): StopLabel[] {
  let nextGiven = stops.some((s) => s.status === "en_route" || s.status === "in_progress");
  return stops.map((s) => {
    if (s.status === "completed") return "Completed";
    if (s.status === "en_route") return "En Route";
    if (s.status === "in_progress") return "In Progress";
    if (!nextGiven) {
      nextGiven = true;
      return "Next";
    }
    return "Pending";
  });
}

const REPORT: { key: string; label: string; opts: string[] }[] = [
  { key: "coat", label: "Coat", opts: ["Silky", "Light Tangling", "Shaved Down"] },
  { key: "skin", label: "Skin", opts: ["Healthy", "Dry/Flaky", "Hotspots Noted"] },
  { key: "ears", label: "Ears", opts: ["Clean & Fresh", "Light Wax Cleared"] },
  { key: "nails", label: "Nails", opts: ["Clipped & Buffed"] },
  { key: "temp", label: "Temperament", opts: ["Happy Angel ⭐", "A bit wiggly", "Nervous"] },
];

export function GroomerSurface({ onBackToAdmin }: { onBackToAdmin?: () => void }) {
  const today = torontoToday();
  const { appointments, loaded } = useAppointments();
  const stops = useMemo(
    () => appointments.filter((a) => a.date === today && a.status !== "cancelled" && a.status !== "requested"),
    [appointments, today],
  );
  const labels = stopLabels(stops);
  const completedCount = stops.filter((s) => s.status === "completed").length;
  const route = routeForDate(today);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [report, setReport] = useState<Record<string, string>>({ coat: "Silky", ears: "Clean & Fresh", nails: "Clipped & Buffed" });
  const [photos, setPhotos] = useState<{ before?: string; after?: string }>({});
  const [ownerNotes, setOwnerNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [notifyResult, setNotifyResult] = useState<DispatchResult | null>(null);
  const [sendingAlert, setSendingAlert] = useState(false);
  // Default to the stop the van is driving to, otherwise the first one still to do.
  useEffect(() => {
    if (activeId && stops.some((s) => s.id === activeId)) return;
    const current =
      stops.find((s) => s.status === "en_route" || s.status === "in_progress") ?? stops.find((s) => s.status !== "completed") ?? stops[0];
    setActiveId(current?.id ?? null);
  }, [stops, activeId]);
  const stop = stops.find((s) => s.id === activeId);
  const sent = stop?.status === "completed";

  const selectStop = (id: string) => {
    setActiveId(id);
    setReveal(false);
    setNotifyResult(null);
    setPhotos({});
    setOwnerNotes("");
  };

  const onPhoto = (k: "before" | "after", f?: File) => f && setPhotos((p) => ({ ...p, [k]: URL.createObjectURL(f) }));

  const handle10MinAlert = async (channel: "sms" | "whatsapp") => {
    setSendingAlert(true);
    if (!stop) return;
    const res = await dispatchNotification("10_min_alert", channel, {
      toPhone: stop.ownerPhone ?? "",
      clientName: stop.ownerName ?? `${stop.petName}'s family`,
      dogName: stop.petName,
      address: stop.address,
    });
    setNotifyResult(res);
    setSendingAlert(false);
  };

  const handleSendReport = async (channel: "sms" | "whatsapp" | "email") => {
    if (!stop) return;
    const res = await dispatchNotification("report_card", channel, {
      toPhone: stop.ownerPhone ?? "",
      clientName: stop.ownerName ?? `${stop.petName}'s family`,
      dogName: stop.petName,
      reportCardUrl: typeof window !== "undefined" ? window.location.origin : "https://thefreshpooch.valetdemo.workers.dev",
    });
    setNotifyResult(res);
  };

  // Completing a stop is the only thing that counts a groom as done.
  const completeStop = async () => {
    if (!stop || sent || completing) return;
    setCompleting(true);
    try {
      await updateAppointment(stop.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        report: {
          ...(report["coat"] ? { coat: report["coat"] } : {}),
          ...(report["skin"] ? { skin: report["skin"] } : {}),
          ...(report["ears"] ? { ears: report["ears"] } : {}),
          ...(report["nails"] ? { nails: report["nails"] } : {}),
          ...(report["temp"] ? { temperament: report["temp"] } : {}),
          ...(ownerNotes ? { notes: ownerNotes } : {}),
        },
      });
      recordRealCompletedGroom();
      const othersMoving = stops.some((s) => s.id !== stop.id && (s.status === "en_route" || s.status === "in_progress"));
      const next = stops.find((s) => s.id !== stop.id && s.status === "confirmed");
      if (next && !othersMoving) await updateAppointment(next.id, { status: "en_route" });
      await handleSendReport("sms");
    } finally {
      setCompleting(false);
    }
  };

  if (!loaded) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-muted-foreground md:px-6">Loading today&apos;s route…</div>;
  }

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
      {onBackToAdmin && (
        <button
          onClick={onBackToAdmin}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-teal hover:bg-secondary transition shadow-sm"
        >
          ← Back to Operations Admin Dashboard
        </button>
      )}
      <div className="bg-gradient-teal trailer-rivets mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-5 text-primary-foreground">
        <div>
          <div className="eyebrow text-gold">Van #1 • Groomer Sarah</div>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Today: {route.day} • {route.area} route • {stops.length} {stops.length === 1 ? "Appointment" : "Appointments"}
          </h1>
        </div>
        <div className="text-right text-sm"><div className="font-serif text-3xl text-gold">{completedCount} / {stops.length}</div>completed</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-2">
          {stops.map((s, i) => (
            <button key={s.id} onClick={() => selectStop(s.id)} className={cn("flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all", s.id === activeId ? "border-teal bg-card shadow-lift" : "border-transparent bg-card/60 hover:bg-card")}>
              <div className="rounded-xl bg-ink px-3 py-2 text-center font-mono text-sm font-bold text-ink-foreground">{s.time}</div>
              <div className="flex-1">
                <div className="text-lg font-bold">{s.petName}</div>
                <div className="text-sm text-muted-foreground">{s.breed} • {serviceName(s.service)}</div>
              </div>
              <Pill tone={statusTone[labels[i]!]}>{labels[i]}</Pill>
            </button>
          ))}
          {stops.length === 0 && <div className="rounded-2xl bg-card/60 p-4 text-sm text-muted-foreground">No stops booked for today.</div>}
        </div>

        {stop && (
        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-muted-foreground">Active Stop • {stop.time} • {serviceName(stop.service)} • ${stop.total} CAD</div>
                <h2 className="text-3xl font-semibold">{stop.petName} <span className="text-xl text-muted-foreground">the {stop.breed}</span></h2>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" /> {stop.address}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* 10-Min Arrival Alert Dispatchers */}
                <button
                  type="button"
                  onClick={() => handle10MinAlert("sms")}
                  disabled={sendingAlert}
                  className="flex items-center gap-1.5 rounded-xl border border-teal bg-teal-soft/40 px-3 py-2 text-xs font-bold text-teal hover:bg-teal hover:text-white transition"
                  title="Send Twilio SMS: 10 minutes away"
                >
                  <Bell className="h-3.5 w-3.5" /> SMS ETA (10 min)
                </button>
                <button
                  type="button"
                  onClick={() => handle10MinAlert("whatsapp")}
                  className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition"
                  title="Send WhatsApp ETA (100% Free)"
                >
                  💬 WhatsApp ETA
                </button>
                <a href={`tel:${stop.ownerPhone ?? ""}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-primary-foreground hover:opacity-90 transition"><Phone className="h-4 w-4" /></a>
                <a href={`sms:${stop.ownerPhone ?? ""}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-primary-foreground hover:opacity-90 transition"><MessageSquare className="h-4 w-4" /></a>
              </div>
            </div>

            {/* Notification Live Modal / Banner */}
            {notifyResult && (
              <div className={cn("mt-4 rounded-xl border p-4 text-xs", notifyResult.simulated ? "border-gold/50 bg-gold-soft/40" : "border-teal/40 bg-sage-soft/70")}>
                <div className="flex items-center justify-between font-bold text-teal">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={cn("h-4 w-4", notifyResult.simulated ? "text-gold" : "text-success")} />
                    {notifyResult.simulated
                      ? `${notifyResult.channel.toUpperCase()} not sent (${notifyResult.timestamp})`
                      : notifyResult.whatsappUrl
                        ? `WhatsApp message ready at ${notifyResult.timestamp}: tap Open Chat to send`
                        : `Sent via ${notifyResult.channel.toUpperCase()} at ${notifyResult.timestamp}`}
                  </span>
                  <button onClick={() => setNotifyResult(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-foreground font-mono bg-card/80 p-2.5 rounded-lg border border-border">
                  "{notifyResult.message}"
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{notifyResult.simulated ? "⚠️" : "💰"} {notifyResult.costEstimateCad}</span>
                  {notifyResult.whatsappUrl && (
                    <a
                      href={notifyResult.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-teal underline"
                    >
                      Open Chat in WhatsApp <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
                <div className="flex items-center justify-between">
                  <Pill tone="success"><ShieldCheck className="h-3.5 w-3.5" /> Latchkey Access Authorized</Pill>
                  <KeyRound className="h-5 w-5 text-gold" />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="font-mono text-4xl font-bold tracking-[0.4em] text-gold">{reveal ? stop.latchkeyCode ?? "—" : "••••"}</div>
                  <button onClick={() => setReveal(!reveal)} className="flex items-center gap-2 rounded-full bg-card/10 px-4 py-2 text-sm font-semibold hover:bg-card/20 transition-colors">
                    {reveal ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> Reveal code</>}
                  </button>
                </div>
                <p className="mt-4 text-sm opacity-80">{stop.notes ?? "No access notes for this stop."}</p>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-border bg-success-soft p-5">
                <FileSignature className="h-7 w-7 text-success" />
                <div className="mt-2 font-bold">{stop.waiver ?? "Booking terms accepted online"}</div>
                <Pill tone="success" className="mt-2 self-start"><Check className="h-3.5 w-3.5" /> Verified by owner</Pill>
              </div>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">60-Second Pooch Report Card</h3>
              <Pill tone="gold">{Object.keys(report).length}/5 checked</Pill>
            </div>
            <div className="mt-5 space-y-4">
              {REPORT.map((r) => (
                <div key={r.key} className="grid items-center gap-2 md:grid-cols-[120px_1fr]">
                  <div className="eyebrow text-muted-foreground">{r.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {r.opts.map((o) => <Chip key={o} size="lg" active={report[r.key] === o} onClick={() => setReport({ ...report, [r.key]: o })}>{o}</Chip>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {(["before", "after"] as const).map((k) => (
                <label key={k} className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-teal">
                  {photos[k] ? <img src={photos[k]} alt={k} className="absolute inset-0 h-full w-full object-cover" /> : <><Camera className="h-8 w-8 text-teal" /><span className="mt-2 text-sm font-bold capitalize">{k} photo</span><span className="text-xs text-muted-foreground">Tap to capture</span></>}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(k, e.target.files?.[0])} />
                </label>
              ))}
            </div>
            <textarea value={ownerNotes} onChange={(e) => setOwnerNotes(e.target.value)} placeholder="Quick notes for the owner…" rows={3} className="mt-4 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring" />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSendReport("whatsapp")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-3 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
              >
                💬 WhatsApp Report (Free)
              </button>
              <button
                type="button"
                onClick={() => handleSendReport("sms")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-teal py-3 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
              >
                📱 SMS Report
              </button>
              <button
                type="button"
                onClick={() => handleSendReport("email")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs font-bold text-foreground hover:bg-muted transition shadow-sm"
              >
                ✉️ Email Report
              </button>
            </div>

            <button onClick={completeStop} disabled={completing} className={cn("mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold transition-all", sent ? "bg-success text-primary-foreground" : "bg-gradient-gold text-ink shadow-lift hover:scale-[1.01]")}>
              {sent ? <><Check className="h-5 w-5" /> Stop completed • Report card sent</> : <><Rocket className="h-5 w-5" /> Complete Stop & Send Report Card</>}
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
