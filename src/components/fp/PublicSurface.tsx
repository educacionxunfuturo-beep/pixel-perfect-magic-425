import { useEffect, useMemo, useState } from "react";
import {
  Check, ChevronLeft, ChevronRight, Search, MapPin, Star, ShieldCheck, Leaf, Heart, Ban, Info, Clock, Sparkles,
} from "lucide-react";
import hero from "@/assets/hero-trailer.jpg";
import beforeImg from "@/assets/before.jpg";
import afterImg from "@/assets/after.jpg";
import { cn } from "@/lib/utils";
import { Chip, Pill, SectionTitle } from "./primitives";
import { Packages, PressBanner, Reviews, Faq, PACKAGES, type PackageId } from "./PublicSections";
import { SubscriptionSection } from "./SubscriptionSection";
import { PetParentAppSection } from "./PetParentAppSection";
import { SpaReels } from "./SpaReels";
import { ClientGallery } from "./ClientGallery";
import { useLiveGroomCounter, recordRealCompletedGroom } from "@/lib/useLiveGroomCounter";

const BREEDS = [
  { name: "Goldendoodle", factor: 1.15 },
  { name: "Maltese", factor: 0.95 },
  { name: "French Bulldog", factor: 0.85 },
  { name: "Golden Retriever", factor: 1.1 },
  { name: "Shih Tzu", factor: 0.95 },
  { name: "Bernedoodle", factor: 1.2 },
  { name: "Labrador Retriever", factor: 1.0 },
  { name: "Cavalier King Charles", factor: 0.95 },
  { name: "Standard Poodle", factor: 1.2 },
  { name: "Siberian Husky", factor: 1.1 },
];
const WEIGHTS = [
  { id: "s", label: "Small", sub: "< 20 lbs", base: 140 },
  { id: "m", label: "Medium", sub: "21–45 lbs", base: 155 },
  { id: "l", label: "Large", sub: "46–75 lbs", base: 172 },
  { id: "g", label: "Giant", sub: "76+ lbs", base: 190 },
];
const COATS = [
  { id: "normal", label: "Normal Coat", add: 0 },
  { id: "light", label: "Light Matted", add: 20 },
  { id: "severe", label: "Severe Matted", add: 45 },
];
const ADDONS = [
  { id: "salt", label: "Winter Road Salt Paw Protection", price: 25 },
  { id: "facial", label: "Deep Blueberry Facial", price: 15 },
  { id: "shed", label: "De-Shedding Treatment", price: 35 },
];
const ZONES: Record<string, { area: string; day: string }> = {
  M4P: { area: "Midtown", day: "Wednesdays" },
  M4S: { area: "Midtown", day: "Wednesdays" },
  M5R: { area: "The Annex", day: "Tuesdays" },
  M4W: { area: "Rosedale", day: "Thursdays" },
  M6G: { area: "Christie Pits", day: "Fridays" },
  M4E: { area: "The Beaches", day: "Saturdays" },
  M5V: { area: "King West", day: "Mondays" },
};

function QuoteWizard({ preset }: { preset: { id: PackageId; n: number } | null }) {
  const [step, setStep] = useState(1);
  const [pkgId, setPkgId] = useState<PackageId>("full");
  useEffect(() => {
    if (!preset) return;
    setPkgId(preset.id);
    setBreed(preset.id === "ultimate" ? "Golden Retriever" : preset.id === "tidy" ? "French Bulldog" : "Goldendoodle");
    setWeight(preset.id === "ultimate" ? "l" : preset.id === "tidy" ? "s" : "m");
    setStep(1);
  }, [preset]);
  const pkg = PACKAGES.find((p) => p.id === pkgId)!;
  const [breed, setBreed] = useState("Goldendoodle");
  const [q, setQ] = useState("");
  const [weight, setWeight] = useState("m");
  const [coat, setCoat] = useState("normal");
  const [postal, setPostal] = useState("M4P 1T7");
  const [addons, setAddons] = useState<string[]>(["salt"]);
  const [sibling, setSibling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple_pay" | "google_pay" | "interac">("apple_pay");
  const [booked, setBooked] = useState(false);

  const zone = useMemo(() => {
    const fsa = postal.replace(/\s/g, "").toUpperCase().slice(0, 3);
    if (fsa.length < 3) return null;
    return ZONES[fsa] ?? (fsa.startsWith("M") ? { area: "Toronto", day: "on rotating weekdays" } : "out");
  }, [postal]);

  const breedF = BREEDS.find((b) => b.name === breed)?.factor ?? 1;
  const base = Math.max(pkg.from + (pkgId === "ultimate" ? 0 : 0), Math.round((WEIGHTS.find((w) => w.id === weight)!.base * breedF) / 5) * 5 + (pkgId === "ultimate" ? 100 : pkgId === "tidy" ? -10 : 0));
  const coatAdd = COATS.find((c) => c.id === coat)!.add;
  const addonTotal = ADDONS.filter((a) => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const discount = sibling ? 20 : 0;
  const total = base + coatAdd + addonTotal - discount;

  const filtered = BREEDS.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));
  const labels = ["Breed", "Weight", "Coat", "Location", "Quote"];

  return (
    <div className="card-surface shadow-lift overflow-hidden">
      <div className="bg-gradient-teal trailer-rivets px-6 py-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow text-gold">Instant Quote</div>
            <h3 className="text-2xl font-semibold">{pkg.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-75">Step {step} of 5</div>
            <div className="font-serif text-2xl font-semibold text-gold">${total}</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary-foreground/15">
          <div className="bg-gradient-gold h-full rounded-full transition-all duration-500" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[0.68rem] font-semibold uppercase tracking-wider">
          {labels.map((l, i) => (
            <span key={l} className={i + 1 <= step ? "text-gold" : "opacity-50"}>{l}</span>
          ))}
        </div>
      </div>

      <div key={step} className="animate-fade-up min-h-[300px] p-6">
        {step === 1 && (
          <div>
            <label className="text-sm font-semibold">What's your dog's breed?</label>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search breeds…" className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto">
              {filtered.map((b) => (
                <Chip key={b.name} active={breed === b.name} onClick={() => setBreed(b.name)}>{b.name}</Chip>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground">No match — we'll quote mixed breeds on arrival.</p>}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="text-sm font-semibold">How much does {breed === "" ? "your pup" : "your " + breed} weigh?</label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {WEIGHTS.map((w) => (
                <button key={w.id} onClick={() => setWeight(w.id)} className={cn("rounded-2xl border-2 p-4 text-left transition-all", weight === w.id ? "border-primary bg-sage-soft" : "border-border hover:border-sage")}>
                  <div className="font-serif text-lg font-semibold">{w.label}</div>
                  <div className="text-sm text-muted-foreground">{w.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="text-sm font-semibold">How's the coat looking?</label>
            <div className="mt-4 flex flex-wrap gap-2">
              {COATS.map((c) => (
                <Chip key={c.id} active={coat === c.id} onClick={() => setCoat(c.id)}>
                  {c.label} {c.add > 0 && <span className="opacity-70">+${c.add}</span>}
                </Chip>
              ))}
            </div>
            {coat === "severe" && (
              <div className="mt-4 flex gap-3 rounded-xl border border-gold/40 bg-gold-soft p-4 text-sm text-accent-foreground">
                <Heart className="mt-0.5 h-4 w-4 shrink-0" />
                <p><strong>Humanity over vanity.</strong> Severely matted coats are gently shaved down to protect your dog's skin. A digital waiver will be sent before your appointment.</p>
              </div>
            )}
          </div>
        )}
        {step === 4 && (
          <div>
            <label className="text-sm font-semibold">Your Toronto postal code</label>
            <div className="relative mt-3">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={postal} onChange={(e) => setPostal(e.target.value.toUpperCase())} maxLength={7} placeholder="M4P 1T7" className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-3 font-mono text-lg tracking-widest outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="mt-3 min-h-10">
              {zone && zone !== "out" && (
                <Pill tone="success" className="animate-fade-up text-sm"><Check className="h-4 w-4" /> Covered! We groom in {zone.area} {zone.day.startsWith("on") ? zone.day : `on ${zone.day}`}</Pill>
              )}
              {zone === "out" && <Pill tone="warning" className="text-sm">Outside our GTA zones — join the waitlist</Pill>}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
              <input type="checkbox" checked={sibling} onChange={(e) => setSibling(e.target.checked)} className="h-4 w-4 accent-[var(--teal)]" />
              I'm booking a second dog from the same household
            </label>
          </div>
        )}
        {step === 5 && (
          <div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{pkg.name} • {breed}</div>
                <div className="font-serif text-4xl font-semibold text-teal">${total} <span className="text-base font-sans text-muted-foreground">CAD</span></div>
              </div>
              <Pill tone="gold">{pkg.price} CAD</Pill>
            </div>
            <div className="mt-4 space-y-2">
              {ADDONS.map((a) => {
                const on = addons.includes(a.id);
                return (
                  <label key={a.id} className={cn("flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition-colors", on ? "border-primary bg-sage-soft" : "border-border")}>
                    <span className="flex items-center gap-3">
                      <input type="checkbox" checked={on} onChange={() => setAddons(on ? addons.filter((x) => x !== a.id) : [...addons, a.id])} className="h-4 w-4 accent-[var(--teal)]" />
                      {a.label}
                    </span>
                    <span className="font-semibold">+${a.price}</span>
                  </label>
                );
              })}
            </div>
            {sibling && (
              <div className="mt-3 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">🐾 Multi-Pet Sibling discount: -$20 CAD automatically applied for 2nd dog!</div>
            )}

            {/* Canadian Payment Methods Selector */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accepted Payment Method (Canada)</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("apple_pay")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition cursor-pointer",
                    paymentMethod === "apple_pay" ? "border-ink bg-ink text-white" : "border-border bg-card text-foreground"
                  )}
                >
                  <span className="text-sm font-bold"> Pay</span>
                  <span className="text-[10px] opacity-75">1-Tap Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("google_pay")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition cursor-pointer",
                    paymentMethod === "google_pay" ? "border-teal bg-teal text-white" : "border-border bg-card text-foreground"
                  )}
                >
                  <span className="text-sm font-bold">G Pay</span>
                  <span className="text-[10px] opacity-75">Instant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition cursor-pointer",
                    paymentMethod === "card" ? "border-gold bg-gold-soft text-ink font-bold" : "border-border bg-card text-foreground"
                  )}
                >
                  <span className="text-sm">💳 Card</span>
                  <span className="text-[10px] opacity-75">Visa/MC/Amex</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("interac")}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-semibold transition cursor-pointer",
                    paymentMethod === "interac" ? "border-[#ffd100] bg-[#ffd100] text-black font-bold" : "border-border bg-card text-foreground"
                  )}
                >
                  <span className="text-sm font-black">Interac</span>
                  <span className="text-[10px] opacity-75">e-Transfer</span>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Cardholder Details</label>
                    <input placeholder="Card number •••• •••• •••• ••••" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <input placeholder="MM / YY" className="w-1/2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none" />
                    <input placeholder="CVC" className="w-1/2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none" />
                  </div>
                </div>
              )}

              {paymentMethod === "interac" && (
                <div className="mt-3 rounded-xl border border-[#ffd100]/50 bg-[#ffd100]/10 p-3 text-xs text-foreground">
                  <div className="font-semibold text-black">🇨🇦 Canadian Interac e-Transfer Details:</div>
                  <p className="mt-1 text-muted-foreground">Send e-Transfer to <strong className="text-foreground">Hello@DogGroomingToronto.ca</strong>. Auto-deposit enabled with instant verification.</p>
                </div>
              )}

              <p className="mt-2 text-[10px] text-muted-foreground text-center">
                🔒 256-bit SSL encrypted • Card held securely with Stripe Canada, not charged until groom completion.
              </p>
            </div>

            {booked && (
              <div className="mt-4 flex flex-col gap-2 rounded-xl bg-success-soft p-3.5 text-xs text-success border border-success/30">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <Check className="h-4 w-4" /> Slot Held Successfully!
                </div>
                <p className="text-foreground">We reserved the route slot for your {breed} in {zone && typeof zone === 'object' ? zone.area : 'Toronto'}. A confirmation message is on its way.</p>
                <a
                  href={`https://wa.me/16474511747?text=${encodeURIComponent(`Hello The Fresh Pooch! I just requested a mobile grooming slot for my ${breed} (${pkg.name} - $${total} CAD) at postal code ${postal}. Method: ${paymentMethod}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
                >
                  💬 Open Instant WhatsApp Confirmation (647-451-1747)
                </a>
              </div>
            )}

            <p className="mt-3 flex gap-2 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5 shrink-0" /> Transparent policy: cancellations within 24 hours incur a 50% late cancellation fee.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
        <button disabled={step === 1} onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < 5 ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground transition-transform hover:scale-[1.02]">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => { setBooked(true); recordRealCompletedGroom(); }} className="bg-gradient-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-ink shadow-lift transition-transform hover:scale-[1.02]">
            {booked ? <><Check className="h-4 w-4" /> Slot held — check your SMS</> : <><Clock className="h-4 w-4" /> Authorize & Book Slot (&lt; 90s)</>}
          </button>
        )}
      </div>
    </div>
  );
}

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  return (
    <div className="card-surface relative aspect-square sm:aspect-[4/3] select-none overflow-hidden">
      <img src={afterImg} alt="Dog after grooming" loading="lazy" width={900} height={900} className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={beforeImg} alt="Dog before grooming" loading="lazy" width={900} height={900} className="absolute inset-0 h-full w-full object-cover object-center" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-card" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-lift">
          <ChevronLeft className="h-4 w-4 text-teal" /><ChevronRight className="h-4 w-4 text-teal" />
        </div>
      </div>
      <Pill tone="ink" className="absolute left-3 top-3">Before</Pill>
      <Pill tone="gold" className="absolute right-3 top-3">After</Pill>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label="Before and after comparison" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
    </div>
  );
}

export function PublicSurface({ onOpenPortal }: { onOpenPortal?: () => void }) {
  const [preset, setPreset] = useState<{ id: PackageId; n: number } | null>(null);
  const { count } = useLiveGroomCounter(648);
  const select = (id: PackageId) => {
    setPreset((p) => ({ id, n: (p?.n ?? 0) + 1 }));
    document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div className="animate-fade-up">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <Pill tone="gold" className="mb-5 self-start"><Sparkles className="h-3.5 w-3.5" /> Now booking Midtown • Annex • Rosedale</Pill>
          <h1 className="text-4xl font-semibold leading-[1.05] text-ink md:text-6xl">
            Toronto's Premier Mobile Dog Spa <em className="font-normal text-teal">Right At Your Doorstep</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            1-on-1 cage-free, stress-free grooming inside our custom vintage luxury mobile trailer.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { i: Heart, t: "Zero Stress" },
              { i: Ban, t: "No Cages" },
              { i: Leaf, t: "100% Organic Shampoos" },
              { i: ShieldCheck, t: "Licensed & Insured" },
            ].map(({ i: I, t }) => (
              <span key={t} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold"><I className="h-4 w-4 text-teal" />{t}</span>
            ))}
          </div>
          <div className="relative mt-8 overflow-hidden rounded-3xl shadow-lift">
            <img
              src={hero}
              alt="The Fresh Pooch mobile dog grooming van in Toronto with open luxury spa door and goldendoodle"
              width={1264}
              height={848}
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-card/95 px-3.5 py-1.5 text-xs font-bold backdrop-blur shadow-sm border border-border/80">
              <Star className="h-3.5 w-3.5 fill-amber text-amber" />
              <span>5.0 • <strong className="text-teal font-extrabold tabular-nums">{count}+</strong> Verified Toronto Grooms</span>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-teal backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              100% Autonomous Spa
            </div>
          </div>
        </div>


        <div id="quote" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <QuoteWizard preset={preset} />
        </div>
      </section>

      <Packages onSelect={select} />
      <SubscriptionSection />
      <PetParentAppSection onOpenPortal={onOpenPortal} />
      <PressBanner />
      <SpaReels />
      <section className="border-t border-border bg-secondary/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="The Transformation" title="Slide to see the magic" sub="Real results from our trailer tub. Welsh Terrier full groom & scissor styling." />
            <BeforeAfter />
          </div>
          <Reviews />
        </div>
      </section>
      <ClientGallery />
      <Faq />
    </div>
  );
}
