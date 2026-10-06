import { useState } from "react";
import { Phone, MessageSquare, KeyRound, Eye, EyeOff, FileSignature, Camera, Rocket, MapPin, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, Pill } from "./primitives";

const STOPS = [
  {
    time: "8:30 AM",
    pet: "Luna",
    breed: "Maltese",
    svc: "Full Spa",
    status: "Completed",
    code: "9142",
    address: "88 Broadway Ave, Unit 1402, Toronto M4P 1V6",
    phone: "416-555-0142",
    notes: "Concierge notified at front desk. Lockbox on bicycle rack in P1 parking (code 9142). Please ensure harness is snug.",
    waiver: "Signed digitally (Fear-Free Handling)",
  },
  {
    time: "10:00 AM",
    pet: "Bentley",
    breed: "Goldendoodle",
    svc: "Teddy Cut",
    status: "Completed",
    code: "4821",
    address: "142 Roehampton Ave, Toronto M4P 1R4",
    phone: "416-555-0199",
    notes: "Enter through side wooden gate (keypad 4821). Bentley will be in sunroom. Please make sure indoor cat Jasper does not slip out.",
    waiver: "Signed digitally (Matted Shavedown Waiver)",
  },
  {
    time: "11:45 AM",
    pet: "Oscar",
    breed: "French Bulldog",
    svc: "Bath & Tidy",
    status: "En Route",
    code: "3390",
    address: "180 University Ave (Shangri-La Residences), Toronto M5H 0A2",
    phone: "416-555-0211",
    notes: "Visitor loop parking authorized with security. Digital smart lock code is 3390#. Oscar loves head rubs before stepping into van.",
    waiver: "Signed digitally (Brachycephalic Care)",
  },
  {
    time: "1:30 PM",
    pet: "Maple",
    breed: "Golden Retriever",
    svc: "De-Shed Spa",
    status: "Next",
    code: "7105",
    address: "45 Roxborough St E, Rosedale M4W 1V5",
    phone: "416-555-0374",
    notes: "Garage keypad code 7105. Leash hanging on hook next to mudroom door. Blueberry facial authorized.",
    waiver: "Signed digitally (Full Spa Waiver)",
  },
  {
    time: "3:15 PM",
    pet: "Pip",
    breed: "Shih Tzu",
    svc: "Full Spa",
    status: "Pending",
    code: "1628",
    address: "320 Brunswick Ave, The Annex M5S 2M7",
    phone: "416-555-0455",
    notes: "Lockbox code 1628 on rear deck railing. Treats in kitchen bowl if Pip is shy when meeting groomer.",
    waiver: "Signed digitally (Senior Dog Care)",
  },
] as const;

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
  const stop = STOPS[active]!;

  const onPhoto = (k: "before" | "after", f?: File) => f && setPhotos((p) => ({ ...p, [k]: URL.createObjectURL(f) }));

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
            <button key={s.pet} onClick={() => { setActive(i); setReveal(false); setSent(false); }} className={cn("flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all", i === active ? "border-teal bg-card shadow-lift" : "border-transparent bg-card/60 hover:bg-card")}>
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
              <div className="flex gap-2">
                <a href={`tel:${stop.phone}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success text-primary-foreground hover:opacity-90"><Phone className="h-6 w-6" /></a>
                <a href={`sms:${stop.phone}`} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-primary-foreground hover:opacity-90"><MessageSquare className="h-6 w-6" /></a>
              </div>
            </div>

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
            <button onClick={() => setSent(true)} className={cn("mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold transition-all", sent ? "bg-success text-primary-foreground" : "bg-gradient-gold text-ink shadow-lift hover:scale-[1.01]")}>
              {sent ? <><Check className="h-5 w-5" /> Report sent • Review request queued</> : <><Rocket className="h-5 w-5" /> Send Report Card & Request Google Review</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
