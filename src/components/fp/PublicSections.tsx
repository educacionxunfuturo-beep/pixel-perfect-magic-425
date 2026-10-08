import { useState } from "react";
import { SERVICES } from "@/lib/pricing";
import { Check, Star, ChevronDown, Newspaper, ShieldCheck, Leaf, Award, Phone, Mail, Clock, MapPin, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SectionTitle, BrandLogo } from "./primitives";
import { useLiveGroomCounter } from "@/lib/useLiveGroomCounter";

export type PackageId = "tidy" | "full" | "ultimate";
export const PACKAGES: { id: PackageId; name: string; price: string; from: number; best: string; includes: string[]; popular?: boolean }[] = [
  { id: "tidy", name: SERVICES.tidy.name, price: SERVICES.tidy.published, from: SERVICES.tidy.floor, best: "Short coats, routine hygiene, and between-haircut freshness.",
    includes: ["Double shampoo with 100% organic botanical washes", "Warm conditioning rinse", "Hand blow-dry (100% cage-free)", "Nail clipping & buffing", "Ear cleansing", "Pad trim & sanitary hygiene tidy"] },
  { id: "full", name: SERVICES.full.name, price: SERVICES.full.published, from: SERVICES.full.floor, popular: true, best: "Breeds requiring haircuts (Doodles, Maltese, Shih Tzus, Poodles).",
    includes: ["Everything in Bath & Tidy", "Full body precision styling (Teddy Bear, Puppy Cut, or breed standard)", "Facial fluffing", "Paw pad treatment", "Artisan cologne spritz"] },
  { id: "ultimate", name: SERVICES.ultimate.name, price: SERVICES.ultimate.published, from: SERVICES.ultimate.floor, best: "Double-coated or luxury pampering (Golden Retrievers, Huskies, Bernedoodles).",
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

// Public Google Maps reviews of The Fresh Pooch - Mobile Dog Grooming (checked Oct 2026), shortened names.
export const GOOGLE_RATING = { value: "4.8", reviews: 164 };
const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/search/?api=1&query=The+Fresh+Pooch+Mobile+Dog+Grooming+Toronto";
const REVIEWS = [
  { name: "Laura T.", dog: "Stuart, first groom", text: "Angelica was wonderful with Stuart! She did everything we discussed perfectly and Stuart seemed to really like her. It was his first groomer visit so I'm thrilled he had such a great groomer." },
  { name: "Jenner M.", dog: "Gibson, senior & blind", text: "This was our first time using The Fresh Pooch and we are happy. Our dog is older and blind and the whole experience for him (and us) was easy... and the cut looks good!" },
  { name: "Fung L.", dog: "Anxious pup", text: "Such a cute cut and great care. I have a very anxious dog and wish I found out about them sooner. Fast, good quality and convenient. Groomer Nicole was so lovely and my dog was under her spell." },
];

export function Reviews() {
  const { count } = useLiveGroomCounter(648);
  return (
    <div>
      <SectionTitle eyebrow="Toronto Client Love" title={`Rated ${GOOGLE_RATING.value} on Google`} sub={`${GOOGLE_RATING.reviews} Google reviews and over ${count}+ happy dogs pampered right at their doorstep across Toronto.`} />
      <div className="space-y-4">
        {REVIEWS.map((r) => (
          <div key={r.name} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber text-amber" />)}</div>
              <span className="text-xs font-semibold text-teal">Google review</span>
            </div>
            <p className="mt-3 font-serif text-lg leading-snug">“{r.text}”</p>
            <div className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">{r.name}</strong> • {r.dog}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-card px-5 py-2.5 text-sm font-semibold text-teal hover:border-teal hover:bg-teal/5 transition-colors"><Star className="h-4 w-4" /> Read all {GOOGLE_RATING.reviews} reviews on Google</a>
        <a href="https://instagram.com/thefreshpooch" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-card px-5 py-2.5 text-sm font-semibold text-teal hover:border-teal hover:bg-teal/5 transition-colors"><Instagram className="h-4 w-4" /> Real stories @thefreshpooch</a>
      </div>
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
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [subscribedDone, setSubscribedDone] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail.trim()) {
      setSubscribedDone(true);
      setTimeout(() => setSubscribedDone(false), 4000);
      setSubscribedEmail("");
    }
  };

  return (
    <footer className="border-t border-border bg-[#c89222]/10 md:bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 text-sm md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-foreground">Quick links</h4>
            <ul className="mt-4 space-y-2.5 text-muted-foreground text-sm">
              <li>
                <a href="#quote" className="hover:text-teal transition-colors">Contact Us / Book Now</a>
              </li>
              <li>
                <a href="#packages" className="hover:text-teal transition-colors">Who We Are</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-teal transition-colors">Cancellation Policy</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-teal transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#subscriptions" className="hover:text-teal transition-colors">VIP Club & Sitemap</a>
              </li>
            </ul>
          </div>

          {/* BOOK NOW Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold text-foreground">BOOK NOW</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">Phone: </span>
                <a href="tel:+16474511747" className="hover:text-teal transition-colors">647-451-1747</a>
              </li>
              <li>
                <span className="font-semibold text-foreground">Whatsapp: </span>
                <a
                  href="https://wa.me/16474511747"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal transition-colors"
                >
                  647-451-1747
                </a>
              </li>
              <li>
                <span className="font-semibold text-foreground">SMS: </span>
                <a href="sms:+16474511747" className="hover:text-teal transition-colors">647-451-1747</a>
              </li>
              <li>
                <span className="font-semibold text-foreground">Instagram: </span>
                <a
                  href="https://instagram.com/thefreshpooch"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-teal transition-colors"
                >
                  @thefreshpooch
                </a>
              </li>
              <li className="pt-2 text-xs">
                <span className="inline-block rounded-full bg-teal/10 text-teal px-2.5 py-1 font-semibold">
                  ✓ Mon – Sun: 8:30 AM – 6:00 PM (Open 7 Days)
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="lg:col-span-2">
            <h4 className="font-serif text-lg font-semibold text-foreground">Subscribe to The Fresh Pooch:</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Get secret promotional slots, seasonal Toronto paw care tips, and VIP member perks.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="email"
                required
                value={subscribedEmail}
                onChange={(e) => setSubscribedEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-1 focus:ring-teal"
              />
              <button
                type="submit"
                className="rounded-xl bg-ink px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-foreground transition hover:opacity-90"
              >
                {subscribedDone ? "✓ Subscribed!" : "SUBSCRIBE"}
              </button>
            </form>
            {subscribedDone && (
              <p className="mt-2 text-xs font-semibold text-success">
                🎉 Welcome to the pack! Check your inbox for a special welcome treat.
              </p>
            )}
            <div className="mt-5 text-xs text-muted-foreground">
              <strong className="text-foreground">Service Hub:</strong> East York, Etobicoke, North York, York, Midtown, Downtown, Annex, Rosedale, Leaside, plus Mississauga, Markham, Scarborough & Richmond Hill.
            </div>
          </div>
        </div>

        {/* Bottom Bar: Canadian Payment Badges & Social Media Icons */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row">
          {/* Payment Badges (Canada Most Recurring Methods) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            {/* Amex */}
            <span className="flex h-7 items-center rounded border border-border bg-white px-2 text-[10px] font-black tracking-tighter text-[#006fcf] shadow-2xs" title="American Express">
              AMEX
            </span>
            {/* Apple Pay */}
            <span className="flex h-7 items-center rounded border border-border bg-black px-2.5 text-[10px] font-semibold text-white shadow-2xs" title="Apple Pay">
               Pay
            </span>
            {/* Diners Club */}
            <span className="flex h-7 items-center rounded border border-border bg-white px-2 text-[10px] font-bold text-[#004a97] shadow-2xs" title="Diners Club">
              Diners
            </span>
            {/* Discover */}
            <span className="flex h-7 items-center rounded border border-border bg-white px-2 text-[10px] font-bold text-[#ff6600] shadow-2xs" title="Discover">
              DISCOVER
            </span>
            {/* Google Pay */}
            <span className="flex h-7 items-center rounded border border-border bg-white px-2 text-[10px] font-medium text-[#5f6368] shadow-2xs" title="Google Pay">
              <strong className="text-[#4285F4]">G</strong> Pay
            </span>
            {/* Mastercard */}
            <span className="flex h-7 items-center gap-0.5 rounded border border-border bg-white px-2 text-[10px] font-bold shadow-2xs" title="Mastercard">
              <span className="h-3 w-3 rounded-full bg-[#eb001b] inline-block -mr-1" />
              <span className="h-3 w-3 rounded-full bg-[#f79e1b] inline-block opacity-90" />
            </span>
            {/* Visa */}
            <span className="flex h-7 items-center rounded border border-border bg-white px-2 text-[11px] font-extrabold italic text-[#1a1f71] shadow-2xs" title="Visa">
              VISA
            </span>
            {/* Interac (Canadian Banking Standard) */}
            <span className="flex h-7 items-center rounded border border-border bg-[#ffd100] px-2 text-[10px] font-black text-black shadow-2xs" title="Interac e-Transfer Canada">
              Interac
            </span>
          </div>

          {/* Social Icons (Facebook & Instagram) */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com/thefreshpooch"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook The Fresh Pooch"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-teal hover:text-white transition shadow-sm"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/thefreshpooch"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram The Fresh Pooch"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-foreground hover:bg-teal hover:text-white transition shadow-sm"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
          © 2026, TorontoDogGrooming Powered by The Fresh Pooch Mobile Spa • All Rights Reserved
        </div>
      </div>

      {/* Floating WhatsApp Quick-Chat Action Button (Toronto: 647-451-1747) */}
      <a
        href="https://wa.me/16474511747?text=Hello%20The%20Fresh%20Pooch!%20I'd%20like%20to%20inquire%20about%20mobile%20grooming%20in%20Toronto."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift hover:scale-110 active:scale-95 transition-transform"
        title="Chat with us on WhatsApp (647-451-1747)"
      >
        <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </a>
    </footer>
  );
}
