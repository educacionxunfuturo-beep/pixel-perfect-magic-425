import { useState } from "react";
import { Check, Crown, Gift, Shield, CalendarCheck, Heart, Zap, ArrowRight } from "lucide-react";
import { Pill, SectionTitle } from "./primitives";
import { cn } from "@/lib/utils";

interface Plan {
  id: "4-week" | "6-week" | "8-week";
  name: string;
  cadence: string;
  bestFor: string;
  price: number;
  originalPrice: number;
  savingsYear: number;
  popular?: boolean;
  perks: string[];
}

const PLANS: Plan[] = [
  {
    id: "4-week",
    name: "The Signature Routine",
    cadence: "Every 4 Weeks",
    bestFor: "Doodles, Poodles, Maltese & Shih Tzus (High maintenance coats)",
    price: 119,
    originalPrice: 140,
    savingsYear: 252,
    popular: true,
    perks: [
      "15% Lifetime Savings on every groom",
      "Guaranteed matting prevention & precision scissor styling",
      "Complimentary Organic Blueberry Facial ($15 value every visit)",
      "Priority lock on prime weekend & evening slots",
      "Same dedicated groomer for maximum trust & calm",
      "Free priority rescheduling with zero late penalty",
    ],
  },
  {
    id: "6-week",
    name: "The Balanced Glow",
    cadence: "Every 6 Weeks",
    bestFor: "Golden Retrievers, Huskies, Bernedoodles & Terriers",
    price: 135,
    originalPrice: 160,
    savingsYear: 200,
    perks: [
      "15% Lifetime Savings on every groom",
      "Intensive de-shedding undercoat blowout included",
      "Free Winter Road Salt Paw Wax massage ($25 value)",
      "Guaranteed holiday rush slots (Christmas, Spring thaw)",
      "Latchkey contactless access service included",
      "Automated SMS arrival tracking with live ETA",
    ],
  },
  {
    id: "8-week",
    name: "The Essential Hygiene",
    cadence: "Every 8 Weeks",
    bestFor: "Short coats, French Bulldogs, Pugs, Dachshunds & Bath & Tidies",
    price: 110,
    originalPrice: 130,
    savingsYear: 120,
    perks: [
      "15% Lifetime Savings on every groom",
      "Deep hydrobath soak & botanical conditioning",
      "Nail trim & buffing, ear cleansing & sanitary hygiene",
      "Fresh enzymatic breath spray included",
      "Zero travel or downtown parking surcharges",
      "Flexible schedule — pause or skip anytime in 1 tap",
    ],
  },
];

export function SubscriptionSection({ onJoin }: { onJoin?: (planId: string) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string>("4-week");

  return (
    <section id="subscriptions" className="border-t border-border bg-gradient-to-b from-card/40 to-secondary/30 py-16 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Pill tone="gold" className="mb-4 inline-flex items-center gap-1.5 shadow-sm">
            <Crown className="h-3.5 w-3.5 fill-current text-gold" /> The Fresh Pooch VIP Club
          </Pill>
          <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl md:text-5xl">
            Never Stress About Dog Grooming Again
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Consistent, cage-free mobile grooming delivered on your schedule. Save 15% on every visit, lock in peak calendar slots, and give your pup a familiar, loving groomer every time.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
          {[
            {
              icon: Zap,
              title: "Save 15% Forever",
              desc: "Save up to $250+ CAD every year compared to single retail bookings.",
            },
            {
              icon: CalendarCheck,
              title: "Guaranteed Slots",
              desc: "Never hear 'We are fully booked for 3 weeks'. Peak weekends reserved for members.",
            },
            {
              icon: Heart,
              title: "Same Trusted Groomer",
              desc: "Zero anxiety. Your dog builds a loving bond with the same gentle professional.",
            },
            {
              icon: Gift,
              title: "Free Luxury Perks",
              desc: "Complimentary Blueberry Facial and Toronto Winter Salt Paw Balm on every cycle.",
            },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-gold/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-base font-semibold text-ink">{b.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 3 Tiered Plans */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative flex flex-col rounded-3xl border-2 p-7 transition-all duration-300 cursor-pointer bg-card",
                  plan.popular
                    ? "border-gold shadow-lift md:-translate-y-2 ring-1 ring-gold/40"
                    : "border-border hover:border-teal/40",
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Pill tone="gold" className="shadow-md text-xs font-bold px-3 py-1">
                      <Crown className="h-3 w-3 fill-current" /> Most Popular Choice
                    </Pill>
                  </div>
                )}

                <div>
                  <span className="eyebrow text-teal">{plan.cadence}</span>
                  <h3 className="font-serif text-2xl font-semibold text-ink mt-1">{plan.name}</h3>
                  <p className="mt-2 text-xs text-muted-foreground min-h-[32px]">{plan.bestFor}</p>
                </div>

                <div className="mt-6 border-y border-border/80 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-4xl font-bold text-ink">${plan.price}</span>
                    <span className="text-sm font-semibold text-muted-foreground line-through">${plan.originalPrice}</span>
                    <span className="text-xs font-bold text-teal">CAD / groom</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-success">
                    <Check className="h-3.5 w-3.5" /> Saves ≈ ${plan.savingsYear} CAD / year
                  </div>
                </div>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.perks.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onJoin) onJoin(plan.id);
                  }}
                  className={cn(
                    "mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-all hover:scale-[1.02]",
                    plan.popular
                      ? "bg-gradient-gold text-ink shadow-lift"
                      : "bg-ink text-ink-foreground hover:bg-teal",
                  )}
                >
                  Join VIP Club • {plan.cadence} <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Cancel, pause or skip anytime • Zero lock-in
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
