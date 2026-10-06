import { useState } from "react";
import { Check, Star, ChevronDown, Newspaper, ShieldCheck, Leaf, Award, Phone, Mail, Clock, MapPin, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SectionTitle, BrandLogo } from "./primitives";

export type PackageId = "tidy" | "full" | "ultimate";
export const PACKAGES: { id: PackageId; name: string; price: string; from: number; best: string; includes: string[]; popular?: boolean }[] = [
  { id: "tidy", name: "Bath & Tidy", price: "From $130", from: 130, best: "Short coats, routine hygiene, and between-haircut freshness.",
    includes: ["Double shampoo with 100% organic botanical washes", "Warm conditioning rinse", "Hand blow-dry (100% cage-free)", "Nail clipping & buffing", "Ear cleansing", "Pad trim & sanitary hygiene tidy"] },
  { id: "full", name: "Premium Full Groom", price: "$140 – $250", from: 140, popular: true, best: "Breeds requiring haircuts (Doodles, Maltese, Shih Tzus, Poodles).",
    includes: ["Everything in Bath & Tidy", "Full body precision styling (Teddy Bear, Puppy Cut, or breed standard)", "Facial fluffing", "Paw pad treatment", "Artisan cologne spritz"] },
  { id: "ultimate", name: "The Ultimate Spa Experience", price: "$260 – $290+", from: 260, best: "Double-coated or luxury pampering (Golden Retrievers, Huskies, Bernedoodles).",
    includes: ["Full Groom", "Intensive De-Shedding & undercoat blowout", "Deep Organic Blueberry Facial", "Soothing paw balm massage", "Fresh enzymatic breath spray"] },
];

export function Packages({ onSelect }: { onSelect: (id: PackageId) => void }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <SectionTitle eyebrow="Signature Spa Packages" title="Choose your pup's pampering" sub="Transparent Toronto pricing in CAD. Every groom is 1-on-1 and cage-free." />
        <div className="grid gap-5 md:grid-cols-3">
          {PACKAGES.map((p) => (
            <div key={p.id} className={cn("card-surface relative flex flex-col p-6", p.popular && "ring-2 ring-gold shadow-lift md:-translate-y-2")}>
              {p.popular && <Pill tone="gold" className="absolute -top-3 left-6"><Star className="h-3 w-3 fill-current" /> Most Popular</Pill>}
              <h3 className="font-serif text-2xl font-semibold">{p.name}</h3>
              <div className="mt-2 font-serif text-3xl font-semibold text-teal">{p.price} <span className="font-sans text-sm text-muted-foreground">CAD</span></div>
              <p className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">Best for:</strong> {p.best}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.includes.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />{i}</li>)}
              </ul>
              <button onClick={() => onSelect(p.id)} className={cn("mt-6 rounded-full px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02]", p.popular ? "bg-gradient-gold text-ink shadow-lift" : "bg-ink text-ink-foreground")}>Select Package</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PressBanner() {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center md:px-6">
        <div className="eyebrow flex items-center gap-2 text-gold"><Newspaper className="h-4 w-4" /> Trusted by Toronto Pet Parents & Featured on BlogTO</div>
        <p className="max-w-3xl font-serif text-xl italic md:text-2xl">"The vintage spa trailer famously visited by Adam Sandler in Toronto for his bulldog Bagel's luxury groom."</p>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold">
          {[{ i: Award, t: "Fear-Free Certified Standards" }, { i: Leaf, t: "100% Self-Sufficient Eco-Van" }, { i: ShieldCheck, t: "Ontario Licensed & Insured" }].map(({ i: I, t }) => (
            <span key={t} className="flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5"><I className="h-3.5 w-3.5 text-gold" />{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { name: "Michelle K.", area: "Leaside", dog: "Mini Goldendoodle", text: "Our mini doodle Bentley gets terrible anxiety at traditional salons. Having the trailer pull up to our driveway in Leaside changed everything. Sarah was gentle and Bentley looks like an absolute teddy bear." },
  { name: "Dave R.", area: "Midtown", dog: "French Bulldog", text: "Living in a condo on Yonge & Eglinton, taking my dog to a groomer was a nightmare. The Fresh Pooch met me right at the visitor loop. 70 minutes later, spotless Frenchie with no stress." },
  { name: "Elena S.", area: "The Annex", dog: "Maltese", text: "The winter road salt protection and paw balm is essential in Toronto Januarys. Super transparent pricing and the digital report card photos made my day." },
];

export function Reviews() {
  return (
    <div>
      <SectionTitle eyebrow="Toronto Client Love" title="5.0 Star Experience" sub="Over 600+ happy dogs pampered right at their doorstep across Toronto." />
      <div className="space-y-4">
        {REVIEWS.map((r) => (
          <div key={r.name} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber text-amber" />)}</div>
              <span className="text-xs font-semibold text-teal">Verified Client</span>
            </div>
            <p className="mt-3 font-serif text-lg leading-snug">“{r.text}”</p>
            <div className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">{r.name}</strong> • {r.area} • {r.dog}</div>
          </div>
        ))}
      </div>
      <a href="https://instagram.com/thefreshpooch" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-card px-5 py-2.5 text-sm font-semibold text-teal hover:border-teal hover:bg-teal/5 transition-colors"><Instagram className="h-4 w-4" /> See More Real Stories @thefreshpooch</a>
    </div>
  );
}

const FAQS = [
  { q: "Do you need to plug into my home's water or electricity?", a: "Never! Our custom luxury trailer is 100% self-sufficient. We carry our own heated fresh water tanks and silent onboard power. We leave zero footprint." },
  { q: "I live in a Toronto high-rise or condo. Can I book?", a: "Yes! We frequently groom at condominiums across Midtown, Downtown, and Yorkville. We park in your building's visitor parking or street loading zone and meet you at the lobby." },
  { q: "How long does a mobile grooming session take?", a: "Typically 60 to 90 minutes from door-to-door, depending on your dog's size and coat. Because it is strictly 1-on-1 with no cages or wait times, your dog is back in your arms immediately." },
  { q: "What is your cancellation and weather policy?", a: "We provide 48h and 24h reminders. Cancellations with less than 24h notice incur a 50% fee. For Toronto severe winter storms, we proactively reschedule with zero penalty." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <SectionTitle eyebrow="Toronto FAQ" title="Questions from pet parents" />
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="card-surface overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold">
                {f.q}<ChevronDown className={cn("h-5 w-5 shrink-0 text-teal transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="animate-fade-up px-5 pb-5 text-muted-foreground">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" />
            <div className="font-serif text-xl font-semibold text-teal">The Fresh Pooch</div>
          </div>
          <p className="mt-2 text-muted-foreground">Toronto's vintage luxury mobile dog spa. Licensed & insured • Organic products only.</p>
          <a href="https://instagram.com/thefreshpooch" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold text-teal"><Instagram className="h-4 w-4" /> @thefreshpooch</a>
        </div>

        <div className="space-y-2">
          <div className="eyebrow text-gold">Contact</div>
          <a href="tel:+16474511747" className="flex items-center gap-2 hover:text-teal"><Phone className="h-4 w-4" /> (647) 451-1747</a>
          <a href="mailto:Hello@DogGroomingToronto.ca" className="flex items-center gap-2 hover:text-teal"><Mail className="h-4 w-4" /> Hello@DogGroomingToronto.ca</a>
        </div>
        <div className="space-y-2">
          <div className="eyebrow text-gold">Hours</div>
          <p className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0" /> Monday – Saturday: 8:30 AM – 6:00 PM</p>
          <p className="text-muted-foreground">Closed Sundays</p>
        </div>
        <div className="space-y-2">
          <div className="eyebrow text-gold">Service Hub</div>
          <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Toronto Midtown (M4P, M4S, M4N), Annex, Rosedale, Leaside, The Beaches & GTA.</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">© 2026 The Fresh Pooch Mobile Spa</div>
    </footer>
  );
}
