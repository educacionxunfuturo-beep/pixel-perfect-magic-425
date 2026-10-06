import { useEffect, useState } from "react";
import { BadgeCheck, CalendarHeart, Crown, Upload, Truck, Check, Navigation, Bath, Sparkles, MapPin } from "lucide-react";
import barnaby from "@/assets/barnaby.jpg";
import { cn } from "@/lib/utils";
import { Chip, Pill } from "./primitives";

const STAGES = [
  { label: "En Route", sub: "14 min away", icon: Navigation },
  { label: "Arrived", sub: "Parked outside", icon: Truck },
  { label: "In Tub", sub: "Organic oatmeal bath", icon: Bath },
  { label: "Finished", sub: "Report card sent", icon: Sparkles },
];

function GroomTracker() {
  const [stage, setStage] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStage((s) => (s + 1) % 4), 3500);
    return () => clearInterval(t);
  }, [auto]);
  return (
    <div className="card-surface overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-sage-soft">
        <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <g stroke="var(--border)" strokeWidth="10" fill="none">
            <path d="M0 60 H400" /><path d="M0 130 H400" /><path d="M90 0 V180" /><path d="M260 0 V180" />
          </g>
          <path d="M30 130 H260 V60 H350" stroke="var(--teal)" strokeWidth="3" strokeDasharray="6 6" fill="none" />
        </svg>
        <div className="absolute right-[10%] top-[24%] flex h-9 w-9 items-center justify-center rounded-full bg-gold shadow-lift"><MapPin className="h-5 w-5 text-ink" /></div>
        <div className="absolute flex h-10 w-10 items-center justify-center rounded-xl bg-teal shadow-lift transition-all duration-1000" style={{ left: `${[6, 78, 80, 80][stage]}%`, top: `${[62, 22, 22, 22][stage]}%` }}>
          <Truck className="h-5 w-5 text-gold" />
        </div>
        <Pill tone="ink" className="absolute left-3 top-3">Live • Van #1 with Sarah</Pill>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Live Groom-Tracker</h3>
          <button onClick={() => setAuto(!auto)} className="text-xs font-semibold text-teal underline-offset-2 hover:underline">{auto ? "Pause demo" : "Resume demo"}</button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => {
            const I = s.icon;
            const done = i <= stage;
            return (
              <button key={s.label} onClick={() => { setAuto(false); setStage(i); }} className="text-center">
                <div className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all", i === stage ? "border-gold bg-gold text-ink scale-110" : done ? "border-teal bg-teal text-primary-foreground" : "border-border text-muted-foreground")}>
                  {done && i !== stage ? <Check className="h-4 w-4" /> : <I className="h-4 w-4" />}
                </div>
                <div className={cn("mt-2 text-xs font-bold", done ? "text-foreground" : "text-muted-foreground")}>{s.label}</div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-xl bg-muted p-3 text-sm"><strong>{STAGES[stage].label}:</strong> {STAGES[stage].sub}</div>
      </div>
    </div>
  );
}

export function PortalSurface() {
  const [cycle, setCycle] = useState<4 | 6 | 8>(4);
  const [rebooked, setRebooked] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const price = { 4: 129, 6: 139, 8: 149 }[cycle];

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <div className="eyebrow text-gold">Welcome back, Jordan</div>
        <h1 className="text-4xl font-semibold">Barnaby's Spa Passport</h1>
      </div>

      <div className={cn("mb-6 flex flex-col items-start gap-4 rounded-2xl p-5 md:flex-row md:items-center", rebooked ? "bg-success-soft" : "bg-gradient-teal text-primary-foreground")}>
        <CalendarHeart className={cn("h-8 w-8 shrink-0", rebooked ? "text-success" : "text-gold")} />
        <p className="flex-1 text-sm md:text-base">
          {rebooked ? <strong className="text-success">Booked! Saturday, Dec 6 with Sarah — confirmation sent by SMS.</strong> : <>Recommended next session: <strong>In 4 weeks (Saturday, Dec 6)</strong>. Book with your favorite groomer Sarah in 1 tap.</>}
        </p>
        {!rebooked && <button onClick={() => setRebooked(true)} className="bg-gradient-gold rounded-full px-5 py-2.5 text-sm font-bold text-ink">1-Tap Rebook</button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card-surface overflow-hidden">
          <div className="grid md:grid-cols-[220px_1fr]">
            <img src={barnaby} alt="Barnaby the mini goldendoodle" loading="lazy" width={816} height={816} className="h-full max-h-72 w-full bg-accent object-cover" />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow text-muted-foreground">Pooch ID • #FP-0428</div>
                  <h2 className="text-3xl font-semibold">Barnaby</h2>
                </div>
                <BadgeCheck className="h-7 w-7 text-teal" />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {[["Breed", "Mini Goldendoodle"], ["Weight", "26 lbs"], ["Favorite Cut", "Teddy Bear Cut"]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill tone="warning">Sensitive skin</Pill>
                <Pill tone="teal">Likes ear scratches</Pill>
                <Pill tone="gold">Nervous with blow dryer</Pill>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border bg-success-soft/60 p-5 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <ShieldIcon />
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Toronto 2027 Bylaw • Ontario Rabies Passport</div>
                <div className="font-semibold text-success">Rabies Vaccine: Verified & Active (Exp: Nov 2026)</div>
              </div>
            </div>
            <button onClick={() => setUploaded(true)} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
              {uploaded ? <><Check className="h-4 w-4 text-success" /> Certificate received</> : <><Upload className="h-4 w-4" /> Upload new certificate</>}
            </button>
          </div>
        </div>

        <GroomTracker />

        <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground shadow-lift lg:col-span-2">
          <div className="trailer-rivets absolute inset-0 opacity-40" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-gold"><Crown className="h-5 w-5" /><span className="eyebrow">Fresh Pooch VIP Club</span></div>
              <h3 className="mt-2 text-3xl font-semibold">Members get the best slots, always.</h3>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                {["15% off every groom", "Free Blueberry Facial", "Guaranteed priority calendar slots"].map((p) => (
                  <li key={p} className="flex items-center gap-2"><Check className="h-4 w-4 text-gold" />{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-card/10 p-5 text-center backdrop-blur">
              <div className="flex gap-1 rounded-full bg-card/10 p-1">
                {([4, 6, 8] as const).map((c) => (
                  <button key={c} onClick={() => setCycle(c)} className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-all", cycle === c ? "bg-gold text-ink" : "opacity-70")}>{c}-week</button>
                ))}
              </div>
              <div className="mt-4 font-serif text-4xl font-semibold text-gold">${price}<span className="font-sans text-sm text-ink-foreground/70"> / groom</span></div>
              <div className="mt-1 text-xs opacity-70">Billed every {cycle} weeks • cancel anytime</div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden"><Chip>x</Chip></div>
    </div>
  );
}

function ShieldIcon() {
  return <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-primary-foreground"><BadgeCheck className="h-5 w-5" /></div>;
}
