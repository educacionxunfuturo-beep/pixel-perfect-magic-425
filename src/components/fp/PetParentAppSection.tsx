import { useState } from "react";
import {
  Smartphone, ShieldCheck, Heart, Sparkles, Gift, Clock, Award,
  CheckCircle2, ArrowRight, Download, Star, QrCode, Lock, Zap, Camera, KeyRound
} from "lucide-react";
import { Pill, SectionTitle } from "./primitives";
import barnabyImg from "@/assets/barnaby.jpg";
import { useLiveGroomCounter } from "@/lib/useLiveGroomCounter";

export function PetParentAppSection({ onOpenPortal }: { onOpenPortal?: () => void }) {
  const [showQr, setShowQr] = useState(false);
  const { count } = useLiveGroomCounter(648);

  const perks = [
    {
      icon: Heart,
      title: "Digital Pet Passport (#FP-ID)",
      desc: "Stores your pup's favorite haircut style (Teddy Bear, Puppy Cut), weight history, coat sensitivity, and favorite groomer forever.",
      badge: "Zero Repeat Questions",
    },
    {
      icon: ShieldCheck,
      title: "Ontario Vaccine Vault & Auto-Alerts",
      desc: "Automated 30-day countdowns for Rabies, Bordetella (kennel cough), and DHPP vaccines so your pooch stays 100% compliant and healthy.",
      badge: "Veterinary Compliant",
    },
    {
      icon: KeyRound,
      title: "Encrypted Latchkey Access Manager",
      desc: "Grooming while you work: securely store lockbox or condo smart lock codes. Revealed to your bonded groomer only upon doorstep arrival.",
      badge: "100% Contactless",
    },
    {
      icon: Camera,
      title: "Digital Pooch Report Cards & HD Album",
      desc: "Receive digital transformation report cards after every visit with before/after photos, behavior scores, and coat condition notes.",
      badge: "Photo Memory Lane",
    },
    {
      icon: Gift,
      title: "Fresh Rewards: Paw Points Club",
      desc: "Earn 1 Paw Point per $1 CAD spent. Redeem for free organic blueberry facials, winter road salt balm massages, and VIP spa discounts.",
      badge: "Loyalty Treats",
    },
    {
      icon: Zap,
      title: "1-Tap Priority Rebooking (< 30s)",
      desc: "No re-entering addresses or cards. Rebook your regular 4, 6, or 8-week slot in seconds with Apple Pay, Google Pay, or Interac.",
      badge: "Fast & Effortless",
    },
  ];

  return (
    <section id="portal-benefits" className="border-t border-border bg-gradient-to-b from-secondary/40 via-card to-secondary/30 py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column: Story & Advantages */}
          <div>
            <Pill tone="gold" className="mb-4 inline-flex items-center gap-1.5 shadow-sm">
              <Smartphone className="h-3.5 w-3.5 text-gold" /> The Fresh Pooch Mobile App & Portal
            </Pill>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">
              Why <strong className="tabular-nums font-bold">{count}+</strong> Toronto Dog Parents <em className="text-teal font-normal">Keep Our App on Their Phone</em>
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg leading-relaxed">
              Never worry about forgetting vaccine renewals, rushing home from work, or explaining your dog's haircut twice. Your personal <strong>Fresh Pooch Passport</strong> puts stress-free mobile grooming on autopilot.
            </p>

            {/* Install PWA Callout */}
            <div className="mt-6 rounded-2xl border border-teal/30 bg-sage-soft/70 p-4.5 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white shadow-sm">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    📱 Install as a Native App on iOS & Android
                    <span className="rounded-full bg-gold/30 text-ink text-[10px] px-2 py-0.5 font-bold">+100 Bonus Pts</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    No App Store or Google Play download required. Simply open our site in Safari or Chrome, tap <strong>"Share" &gt; "Add to Home Screen"</strong>, and get real-time van arrival notifications!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenPortal}
                className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-ink-foreground shadow-lift hover:opacity-95 transition-transform hover:scale-[1.02]"
              >
                Access My Pet Passport <ArrowRight className="h-4 w-4 text-gold" />
              </button>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
              >
                <QrCode className="h-4 w-4 text-teal" /> {showQr ? "Hide QR" : "Scan on Mobile"}
              </button>
            </div>

            {showQr && (
              <div className="mt-4 p-4 max-w-xs rounded-2xl border border-border bg-card text-center shadow-lift animate-fade-up">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl bg-muted border border-border">
                  <div className="text-xs font-mono text-muted-foreground p-2">
                    📱 Scan with iPhone/Android Camera to open Mobile App instantly
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">URL: doggroomingtoronto.ca</p>
              </div>
            )}
          </div>

          {/* Right Column: Visual App Mockup & Passport Card */}
          <div className="relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-teal/20 via-gold/15 to-transparent blur-2xl -z-10" />

            <div className="card-surface p-6 sm:p-8 shadow-lift border border-border/80 rounded-3xl">
              {/* Pet Passport Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={barnabyImg}
                    alt="Barnaby"
                    className="h-14 w-14 rounded-2xl border-2 border-gold object-cover shadow-sm"
                  />
                  <div>
                    <div className="font-serif text-xl font-bold text-ink">Barnaby</div>
                    <div className="text-xs text-muted-foreground font-mono">Passport #FP-0428 • Goldendoodle</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Paw Points</div>
                  <div className="font-serif text-lg font-bold text-teal flex items-center gap-1 justify-end">
                    <Star className="h-4 w-4 fill-gold text-gold" /> 380 Pts
                  </div>
                </div>
              </div>

              {/* Core Feature Benefits List */}
              <div className="mt-5 space-y-3.5">
                {perks.slice(0, 4).map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border text-teal shadow-2xs">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground truncate">{p.title}</h4>
                          <span className="text-[10px] font-semibold text-teal shrink-0 bg-teal/10 px-2 py-0.5 rounded-full">{p.badge}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Indicator */}
              <div className="mt-5 rounded-2xl bg-ink p-4 text-ink-foreground flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gold font-semibold uppercase tracking-wider">Next Doorstep Spa</div>
                  <div className="text-xs font-bold text-white mt-0.5">Wednesday, Oct 18 • Midtown Route</div>
                </div>
                <span className="rounded-full bg-success/20 text-success text-[10px] font-bold px-2.5 py-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Slot Reserved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Grid Feature Cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="card-surface p-6 rounded-2xl border border-border shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-soft text-teal">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Pill tone="gold" className="text-[10px]">{p.badge}</Pill>
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
