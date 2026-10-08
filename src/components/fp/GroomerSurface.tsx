import { useState } from "react";
import {
  Phone, MessageSquare, KeyRound, Eye, EyeOff, FileSignature, Camera, Rocket, MapPin, Check, ShieldCheck,
  Bell, Send, CheckCircle2, DollarSign, X, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, Pill } from "./primitives";
import { dispatchNotification, type DispatchResult, generateWhatsAppLink } from "@/lib/notifications";
import { DEMO_ROUTE_STOPS } from "@/lib/demo-route";

const STOPS = DEMO_ROUTE_STOPS;

const statusTone = { Completed: "success", "En Route": "gold", Next: "teal", Pending: "muted" } as const;

const REPORT: { key: string; label: string; opts: string[] }[] = [
  { key: "coat", label: "Coat", opts: ["Silky", "Light Tangling", "Shaved Down"] },
  { key: "skin", label: "Skin", opts: ["Healthy", "Dry/Flaky", "Hotspots Noted"] },
  { key: "ears", label: "Ears", opts: ["Clean & Fresh", "Light Wax Cleared"] },
  { key: "nails", label: "Nails", opts: ["Clipped & Buffed"] },
  { key: "temp", label: "Temperament", opts: ["Happy Angel ⭐", "A bit wiggly", "Nervous"] },
];

export function GroomerSurface() {
  const [active, setActive] = useState(2);
  const [reveal, setReveal] = useState(false);
  const [report, setReport] = useState<Record<string, string>>({ coat: "Silky", ears: "Clean & Fresh", nails: "Clipped & Buffed" });
  const [photos, setPhotos] = useState<{ before?: string; after?: string }>({});
  const [sent, setSent] = useState(false);
  const [notifyResult, setNotifyResult] = useState<DispatchResult | null>(null);
  const [sendingAlert, setSendingAlert] = useState(false);
  const stop = STOPS[active]!;

  const onPhoto = (k: "before" | "after", f?: File) => f && setPhotos((p) => ({ ...p, [k]: URL.createObjectURL(f) }));

  const handle10MinAlert = async (channel: "sms" | "whatsapp") => {
    setSendingAlert(true);
    const res = await dispatchNotification("10_min_alert", channel, {
      toPhone: stop.phone,
      clientName: stop.pet + "'s Family",
      dogName: stop.pet,
      address: stop.address,
    });
    setNotifyResult(res);
    setSendingAlert(false);
  };

  const handleSendReport = async (channel: "sms" | "whatsapp" | "email") => {
    setSent(true);
    const res = await dispatchNotification("report_card", channel, {
      toPhone: stop.phone,
      clientName: stop.pet + "'s Family",
      dogName: stop.pet,
      reportCardUrl: "https://educacionxunfuturo-beep-pixel-perfect-magic-425.valetdemo.workers.dev",
    });
    setNotifyResult(res);
  };

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="bg-gradient-teal trailer-rivets mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-6 py-5 text-primary-foreground">
        <div>
          <div className="eyebrow text-gold">Van #1 • Groomer Sarah</div>
          <h1 className="text-2xl font-semibold md:text-3xl">Today: Wednesday • Midtown Toronto • 5 Appointments</h1>
        </div>
        <div className="text-right text-sm"><div className="font-serif text-3xl text-gold">2 / 5</div>completed</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-2">
          {STOPS.map((s, i) => (
            <button key={s.pet} onClick={() => { setActive(i); setReveal(false); setSent(false); setNotifyResult(null); }} className={cn("flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all", i === active ? "border-teal bg-card shadow-lift" : "border-transparent bg-card/60 hover:bg-card")}>
              <div className="rounded-xl bg-ink px-3 py-2 text-center font-mono text-sm font-bold text-ink-foreground">{s.time}</div>
              <div className="flex-1">
                <div className="text-lg font-bold">{s.pet}</div>
                <div className="text-sm text-muted-foreground">{s.breed} • {s.svc}</div>
              </div>
              <Pill tone={statusTone[s.status]}>{s.status}</Pill>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-muted-foreground">Active Stop • {stop.time}</div>
                <h2 className="text-3xl font-semibold">{stop.pet} <span className="text-xl text-muted-foreground">the {stop.breed}</span></h2>
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
                <a href={`tel:${stop.phone}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-success text-primary-foreground hover:opacity-90 transition"><Phone className="h-4 w-4" /></a>
                <a href={`sms:${stop.phone}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-primary-foreground hover:opacity-90 transition"><MessageSquare className="h-4 w-4" /></a>
              </div>
            </div>

            {/* Notification Live Modal / Banner */}
            {notifyResult && (
              <div className="mt-4 rounded-xl border border-teal/40 bg-sage-soft/70 p-4 text-xs">
                <div className="flex items-center justify-between font-bold text-teal">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Notification Dispatched via {notifyResult.channel.toUpperCase()} at {notifyResult.timestamp}
                  </span>
                  <button onClick={() => setNotifyResult(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-foreground font-mono bg-card/80 p-2.5 rounded-lg border border-border">
                  "{notifyResult.message}"
                </p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>💰 {notifyResult.costEstimateCad}</span>
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
                  <div className="font-mono text-4xl font-bold tracking-[0.4em] text-gold">{reveal ? stop.code : "••••"}</div>
                  <button onClick={() => setReveal(!reveal)} className="flex items-center gap-2 rounded-full bg-card/10 px-4 py-2 text-sm font-semibold hover:bg-card/20 transition-colors">
                    {reveal ? <><EyeOff className="h-4 w-4" /> Hide</> : <><Eye className="h-4 w-4" /> Reveal code</>}
                  </button>
                </div>
                <p className="mt-4 text-sm opacity-80">{stop.notes}</p>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-border bg-success-soft p-5">
                <FileSignature className="h-7 w-7 text-success" />
                <div className="mt-2 font-bold">{stop.waiver}</div>
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
            <textarea placeholder="Quick notes for the owner…" rows={3} className="mt-4 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring" />

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
                📱 Twilio SMS ($0.01 CAD)
              </button>
              <button
                type="button"
                onClick={() => handleSendReport("email")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs font-bold text-foreground hover:bg-muted transition shadow-sm"
              >
                ✉️ Email Report (Free)
              </button>
            </div>

            <button onClick={() => handleSendReport("sms")} className={cn("mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold transition-all", sent ? "bg-success text-primary-foreground" : "bg-gradient-gold text-ink shadow-lift hover:scale-[1.01]")}>
              {sent ? <><Check className="h-5 w-5" /> Report Dispatched • Google Review Queued</> : <><Rocket className="h-5 w-5" /> Complete Stop & Send Report Card</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
