import { useState, useEffect } from "react";
import {
  CalendarHeart, Crown, Upload, Truck, Check, Navigation, Bath, MapPin,
  ShieldCheck, AlertTriangle, KeyRound, Eye, EyeOff, Clock, User, Phone, Mail,
  Calendar, FileText, Plus, ChevronRight, LogOut, CheckCircle2, Heart, Award,
  Gift, Star, Trophy, Smartphone, Download, Scissors, Share2, Copy, ExternalLink, HelpCircle, Camera, PawPrint
} from "lucide-react";
import barnaby from "@/assets/barnaby.jpg";
import { cn } from "@/lib/utils";
import { Chip, Pill, SectionTitle } from "./primitives";
import { dispatchNotification } from "@/lib/notifications";
import { useLiveGroomCounter } from "@/lib/useLiveGroomCounter";
import { looksLikeStaffEmail, staffLogin } from "@/lib/staff-session";
import { SERVICES, SERVICE_IDS, ADDONS, type ServiceId } from "@/lib/pricing";
import { TIME_WINDOWS, addDays, createAppointment, formatDate, priceFor, torontoToday } from "@/lib/appointments";

interface PetProfile {
  id: string;
  name: string;
  breed: string;
  weight: string;
  favoriteCut: string;
  coatType: string;
  photo: string;
  tags: string[];
  vaccines: {
    rabies: { exp: string; status: "valid" | "warning" | "expired" };
    bordetella: { exp: string; status: "valid" | "warning" | "expired" };
    dhpp: { exp: string; status: "valid" | "warning" | "expired" };
  };
  latchkeyCode: string;
  latchkeyNotes: string;
}

const DEFAULT_PET: PetProfile = {
  id: "FP-0428",
  name: "Barnaby",
  breed: "Mini Goldendoodle",
  weight: "26 lbs",
  favoriteCut: "Teddy Bear Precision Cut",
  coatType: "Wavy Fleece (Needs 4-6 week maintenance)",
  photo: barnaby,
  tags: ["Sensitive skin", "Likes ear scratches", "Gentle hand-blow dry"],
  vaccines: {
    rabies: { exp: "Nov 20, 2026", status: "valid" },
    bordetella: { exp: "Oct 24, 2026", status: "warning" },
    dhpp: { exp: "Jan 15, 2027", status: "valid" },
  },
  latchkeyCode: "4821",
  latchkeyNotes: "Enter through side wooden gate. Indoor cat Jasper inside sunroom.",
};

// Barnaby is a 26 lb Mini Goldendoodle; past and future prices come from the shared price list.
const PET_BREED = "Mini Goldendoodle";
const PET_WEIGHT_LBS = 26;
const FACIAL_PRICE = ADDONS.find((a) => a.id === "facial")!.price;

const PAST_GROOMS = [
  {
    date: "Sep 12, 2026",
    package: "Premium Full Groom (Teddy Cut)",
    price: `$${priceFor("full", PET_BREED, PET_WEIGHT_LBS)} CAD`,
    groomer: "Sarah M.",
    report: { coat: "Silky & Mat-Free", ears: "Cleansed & Plucked", nails: "Clipped & Buffed", mood: "Happy Angel ⭐" },
    notes: "Barnaby was a delight! Gentle conditioning treatment applied for sensitive skin.",
  },
  {
    date: "Aug 08, 2026",
    package: "Bath & Tidy + Blueberry Facial",
    price: `$${priceFor("tidy", PET_BREED, PET_WEIGHT_LBS) + FACIAL_PRICE} CAD`,
    groomer: "Sarah M.",
    report: { coat: "Fresh & Fluffed", ears: "Clean", nails: "Buffed Smooth", mood: "Calm & Relaxed" },
    notes: "Summer heat de-shedding and paw pad balm applied.",
  },
];

const STAGES = [
  { label: "En Route", sub: "14 min away", icon: Navigation },
  { label: "Arrived", sub: "Parked in visitor loop", icon: Truck },
  { label: "In Tub", sub: "Organic oatmeal bath", icon: Bath },
  { label: "Finished", sub: "Report card sent", icon: Camera },
];

export function PortalSurface({ onAdminLogin }: { onAdminLogin?: () => void }) {
  const { count } = useLiveGroomCounter(648);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [userEmail, setUserEmail] = useState("jordan.m@torontoparents.ca");
  const [userName, setUserName] = useState("Jordan Miller");
  const [userPhone, setUserPhone] = useState("(416) 555-0199");
  const [userAddress, setUserAddress] = useState("142 Roehampton Ave, Midtown Toronto M4P 1R4");
  // Demo pet-parent password is pre-filled; staff emails are checked by the server.
  const [loginPassword, setLoginPassword] = useState("demo-pass");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "book" | "vaccines" | "history" | "rewards" | "matting" | "vip">("overview");
  const [pet, setPet] = useState<PetProfile>(DEFAULT_PET);
  const [stage, setStage] = useState(1);
  const [autoStage, setAutoStage] = useState(true);
  const [revealCode, setRevealCode] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState(pet.latchkeyCode);

  // Loyalty Paw Points & Advisor States
  const [pawPoints, setPawPoints] = useState(380);
  const [redeemedReward, setRedeemedReward] = useState<string | null>(null);
  const [selectedCoatType, setSelectedCoatType] = useState("doodle");
  const [weeksSinceGroom, setWeeksSinceGroom] = useState(5);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // Native Booking state
  const [bookingDate, setBookingDate] = useState(() => addDays(torontoToday(), 1));
  const [bookingSlot, setBookingSlot] = useState(TIME_WINDOWS[0]!.label);
  const [bookingPackage, setBookingPackage] = useState<ServiceId>("full");
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const bookingPrice = priceFor(bookingPackage, PET_BREED, PET_WEIGHT_LBS);
  const [bookingPayment, setBookingPayment] = useState<"card" | "apple_pay" | "google_pay" | "interac">("apple_pay");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // VIP Subscription state
  const [vipCycle, setVipCycle] = useState<4 | 6 | 8>(4);
  const [vipActive, setVipActive] = useState(true);

  useEffect(() => {
    if (!autoStage) return;
    const t = setInterval(() => setStage((s) => (s + 1) % 4), 4000);
    return () => clearInterval(t);
  }, [autoStage]);

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-up mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12 items-stretch">
          {/* Left Column: Sign In / Sign Up Card */}
          <div className="card-surface p-6 sm:p-8 shadow-lift border border-border lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="text-center lg:text-left">
                <Pill tone="gold" className="mb-3">Toronto Pet Parent Portal</Pill>
                <h1 className="font-serif text-3xl font-semibold text-ink">
                  {authMode === "login" ? "Sign In to Your Dashboard" : "Create Pet Parent Account"}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  {authMode === "login"
                    ? "Track live grooms, manage Latchkey access & vaccine reminders."
                    : "Register your dog for 100% cage-free mobile grooming right to your Toronto doorstep."}
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginError(null);
                  if (looksLikeStaffEmail(userEmail)) {
                    setSigningIn(true);
                    try {
                      await staffLogin(userEmail, loginPassword);
                      onAdminLogin?.();
                    } catch (err) {
                      setLoginError(err instanceof Error ? err.message : "Sign-in failed.");
                    } finally {
                      setSigningIn(false);
                    }
                    return;
                  }
                  setIsAuthenticated(true);
                }}
                className="mt-6 space-y-4"
              >
                {authMode === "signup" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Jordan Miller"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-teal"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-teal"
                  />
                </div>
                {authMode === "signup" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Toronto Service Address</label>
                    <input
                      type="text"
                      required
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="e.g. 142 Roehampton Ave, Midtown M4P 1R4"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  </div>
                )}

                {loginError && <p className="text-xs font-semibold text-destructive">{loginError}</p>}
                <button
                  type="submit"
                  disabled={signingIn}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3 text-sm font-bold text-white shadow-lift transition-transform hover:scale-[1.02]"
                >
                  <PawPrint className="h-4 w-4" />
                  <span>{authMode === "login" ? "Sign In to Pet Parent Portal" : "Create Account & Enter Portal"}</span>
                </button>
              </form>

              <div className="mt-4 border-t border-border pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-xs font-semibold text-teal hover:underline"
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign up for free"
                    : "Already have an account? Sign in here"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Why Create an Account / Benefits Showcase */}
          <div className="rounded-3xl bg-gradient-to-br from-teal/10 via-card to-gold/10 p-6 sm:p-8 border border-border lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill tone="teal">Client Advantages</Pill>
                <span className="text-[11px] font-semibold text-muted-foreground">Why {count}+ Toronto pet parents register</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink">
                Your Dog's Personal Concierge on Autopilot
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Having an account keeps all your pooch's records organized so you never have to repeat styling instructions or miss a vaccine booster.
              </p>

              <div className="mt-6 space-y-3.5">
                {[
                  {
                    icon: Heart,
                    title: "Digital Pet Passport (#FP-ID)",
                    desc: "Saves coat type, preferred scissor cut, temperament notes, and favorite groomer forever.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Ontario Vaccine Expiry Vault",
                    desc: "Automated 30-day alerts for Rabies, Bordetella, and DHPP so you stay compliant with city bylaws.",
                  },
                  {
                    icon: KeyRound,
                    title: "Encrypted Latchkey Passcode",
                    desc: "Grooming while you work: lockbox or condo codes are revealed only to your certified groomer on day of service.",
                  },
                  {
                    icon: Camera,
                    title: "Digital Pooch Report Cards & HD Album",
                    desc: "Receive digital transformation report cards after every visit with before/after photos, behavior scores, and coat condition notes.",
                  },
                  {
                    icon: Gift,
                    title: "Fresh Rewards: Paw Points Club",
                    desc: "Earn points on every dollar spent. Redeem for free blueberry facials, winter salt balms, and birthday surprises.",
                  },
                  {
                    icon: Smartphone,
                    title: "1-Tap Booking (No MoeGo Needed)",
                    desc: "Direct van dispatch with Apple Pay, Google Pay, or Interac in under 30 seconds.",
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 rounded-xl bg-card/80 p-3 border border-border/70 shadow-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
              <span>🔒 256-bit Encrypted Client Data</span>
              <span>🇨🇦 Toronto, Midtown & GTA</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Pill tone="teal">Toronto Pet Parent Dashboard</Pill>
            {vipActive && (
              <Pill tone="gold"><Crown className="h-3 w-3 fill-current" /> VIP Pooch Member (15% Off)</Pill>
            )}
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl mt-1">
            Welcome back, {userName}
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-3.5 w-3.5 text-teal" /> {userAddress} • <Phone className="h-3.5 w-3.5 text-teal" /> {userPhone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("book")}
            className="flex items-center gap-1.5 rounded-full bg-gradient-gold px-4 py-2 text-xs font-bold text-ink shadow-lift transition-transform hover:scale-105"
          >
            <Calendar className="h-3.5 w-3.5" /> Book Appointment (No MoeGo needed)
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Log Out
          </button>
        </div>
      </div>

      {/* PWA Mobile App Download Prompt */}
      {showPwaBanner && (
        <div className="mb-6 rounded-2xl border border-teal/40 bg-gradient-to-r from-sage-soft/90 via-teal-soft/40 to-gold-soft/40 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white shadow-sm">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-ink">Install The Fresh Pooch Mobile App</span>
                <span className="rounded-full bg-gold/40 text-ink text-[10px] font-bold px-2 py-0.5">+100 Paw Points</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your iPhone (Safari &gt; Share &gt; Add to Home Screen) or Android (Chrome &gt; Install App) for 1-tap booking & live van arrival alerts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setPawPoints((p) => p + 100);
                alert("🎉 +100 Bonus Paw Points added! Your new balance is " + (pawPoints + 100) + " pts. App shortcut is ready.");
                setShowPwaBanner(false);
              }}
              className="rounded-full bg-teal px-4 py-2 text-xs font-bold text-white shadow-sm hover:scale-105 transition"
            >
              Claim +100 Pts
            </button>
            <button
              onClick={() => setShowPwaBanner(false)}
              className="rounded-full p-2 text-xs text-muted-foreground hover:bg-muted"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {[
          { id: "overview", label: "My Dog & Live Tracker", icon: Heart },
          { id: "book", label: "Book Direct Appointment", icon: Calendar },
          { id: "vaccines", label: "Vaccine Reminders", icon: ShieldCheck, badge: "Action Needed" },
          { id: "rewards", label: "Paw Points & Rewards", icon: Gift, badge: `${pawPoints} Pts` },
          { id: "matting", label: "Coat Care & Matting Risk", icon: Scissors },
          { id: "history", label: "Grooming History & Reports", icon: FileText },
          { id: "vip", label: "VIP Subscription", icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all",
                isActive
                  ? "bg-teal text-white shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-amber/20 text-amber text-[10px] px-1.5 py-0.2 font-semibold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & LIVE TRACKER */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Dog Card */}
            <div className="card-surface overflow-hidden">
              <div className="grid md:grid-cols-[200px_1fr]">
                <img
                  src={pet.photo}
                  alt={pet.name}
                  loading="lazy"
                  className="h-full max-h-72 w-full bg-accent object-cover"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="eyebrow text-teal">Passport • #{pet.id}</div>
                      <h2 className="font-serif text-3xl font-semibold text-ink">{pet.name}</h2>
                    </div>
                    <Pill tone="gold"><Award className="h-3.5 w-3.5" /> Registered Dog</Pill>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Breed</dt>
                      <dd className="font-semibold text-foreground">{pet.breed}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Weight</dt>
                      <dd className="font-semibold text-foreground">{pet.weight}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Signature Haircut</dt>
                      <dd className="font-semibold text-foreground">{pet.favoriteCut}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {pet.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Private Latchkey Code Management */}
              <div className="border-t border-border bg-secondary/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-ink">
                      <KeyRound className="h-4 w-4 text-gold" /> Private Latchkey Access Code
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Only revealed to your groomer on the day of your scheduled route.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingCode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={codeDraft}
                          maxLength={6}
                          onChange={(e) => setCodeDraft(e.target.value)}
                          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-center font-mono font-bold text-base"
                        />
                        <button
                          onClick={() => {
                            setPet({ ...pet, latchkeyCode: codeDraft });
                            setEditingCode(false);
                          }}
                          className="rounded-full bg-teal px-3 py-1 text-xs font-bold text-white"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-mono text-2xl font-bold tracking-widest text-teal">
                          {revealCode ? pet.latchkeyCode : "••••"}
                        </div>
                        <button
                          onClick={() => setRevealCode(!revealCode)}
                          className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold"
                        >
                          {revealCode ? "Hide" : "Reveal"}
                        </button>
                        <button
                          onClick={() => setEditingCode(true)}
                          className="text-xs font-semibold text-teal underline"
                        >
                          Change
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Groom Tracker */}
            <div className="card-surface overflow-hidden">
              <div className="relative h-44 overflow-hidden bg-sage-soft">
                <svg viewBox="0 0 400 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                  <g stroke="var(--border)" strokeWidth="10" fill="none">
                    <path d="M0 60 H400" /><path d="M0 130 H400" /><path d="M90 0 V180" /><path d="M260 0 V180" />
                  </g>
                  <path d="M30 130 H260 V60 H350" stroke="var(--teal)" strokeWidth="3" strokeDasharray="6 6" fill="none" />
                </svg>
                <div className="absolute right-[10%] top-[24%] flex h-9 w-9 items-center justify-center rounded-full bg-gold shadow-lift">
                  <MapPin className="h-5 w-5 text-ink" />
                </div>
                <div
                  className="absolute flex h-10 w-10 items-center justify-center rounded-xl bg-teal shadow-lift transition-all duration-1000"
                  style={{ left: `${[6, 78, 80, 80][stage]}%`, top: `${[62, 22, 22, 22][stage]}%` }}
                >
                  <Truck className="h-5 w-5 text-gold" />
                </div>
                <Pill tone="ink" className="absolute left-3 top-3">Live • Van #1 (Groomer Sarah)</Pill>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-semibold text-ink">Live Spa Progression</h3>
                  <button
                    onClick={() => setAutoStage(!autoStage)}
                    className="text-xs font-semibold text-teal hover:underline"
                  >
                    {autoStage ? "Pause simulation" : "Resume simulation"}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {STAGES.map((s, i) => {
                    const Icon = s.icon;
                    const done = i <= stage;
                    return (
                      <button
                        key={s.label}
                        onClick={() => { setAutoStage(false); setStage(i); }}
                        className="text-center"
                      >
                        <div
                          className={cn(
                            "mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                            i === stage
                              ? "border-gold bg-gold text-ink scale-110 shadow-md"
                              : done
                              ? "border-teal bg-teal text-white"
                              : "border-border text-muted-foreground",
                          )}
                        >
                          {done && i !== stage ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className={cn("mt-2 text-[11px] font-bold", done ? "text-foreground" : "text-muted-foreground")}>
                          {s.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl bg-muted p-3 text-xs">
                  <strong>{STAGES[stage]!.label}:</strong> {STAGES[stage]!.sub}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATIVE APPOINTMENT SCHEDULER (NO MOEGO NEEDED) */}
      {activeTab === "book" && (
        <div className="card-surface p-6 md:p-8 max-w-3xl mx-auto shadow-lift border border-border">
          <div className="border-b border-border pb-4 mb-6">
            <Pill tone="gold" className="mb-2">100% In-House Booking Engine</Pill>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">
              Schedule Your Next Mobile Spa Visit
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your date, route window, and package. Direct dispatch to our mobile grooming van with zero third-party software needed.
            </p>
          </div>

          {bookingConfirmed ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-ink">Appointment Confirmed!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Booking reference <strong>#{bookingRef}</strong> has been locked into Van #1's route for <strong>{formatDate(bookingDate)}</strong> during the <strong>{bookingSlot}</strong> window.
              </p>
              <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs max-w-sm mx-auto text-left space-y-2">
                <div><strong>Dog:</strong> {pet.name} ({pet.breed})</div>
                <div><strong>Package:</strong> {SERVICES[bookingPackage].name} • ${bookingPrice} CAD</div>
                <div><strong>Location:</strong> {userAddress}</div>
                <div><strong>Payment Method:</strong> <span className="uppercase font-bold text-teal">{bookingPayment}</span> (CAD)</div>
                <div><strong>Latchkey Access:</strong> Authorized (Code {pet.latchkeyCode})</div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/16474511747?text=${encodeURIComponent(`Hello The Fresh Pooch! I just confirmed appointment #${bookingRef} for ${pet.name} (${SERVICES[bookingPackage].name}) on ${bookingDate} (${bookingSlot}) at ${userAddress}. Payment: ${bookingPayment}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
                >
                  💬 Open WhatsApp Dispatch Receipt (647-451-1747)
                </a>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => setBookingConfirmed(false)}
                  className="rounded-full border border-border bg-card px-5 py-2 text-xs font-semibold"
                >
                  Book Another Session
                </button>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="rounded-full bg-teal px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBookingError(null);
                try {
                  const appt = await createAppointment({
                    petName: pet.name,
                    breed: PET_BREED,
                    weightLbs: PET_WEIGHT_LBS,
                    service: bookingPackage,
                    date: bookingDate,
                    time: TIME_WINDOWS.find((w) => w.label === bookingSlot)?.start ?? "8:30 AM",
                    timeWindow: bookingSlot,
                    address: userAddress,
                    ownerName: userName,
                    ownerPhone: userPhone,
                    ...(pet.latchkeyCode ? { latchkeyCode: pet.latchkeyCode } : {}),
                    notes: pet.latchkeyNotes,
                    paymentMethod: bookingPayment,
                    source: "portal",
                  });
                  setBookingRef(appt.reference);
                  setBookingConfirmed(true);
                  await dispatchNotification("booking_confirmed", "whatsapp", {
                    toPhone: userPhone,
                    clientName: userName,
                    dogName: pet.name,
                    appointmentTime: `${formatDate(bookingDate)} (${bookingSlot})`,
                    address: userAddress,
                  });
                } catch (err) {
                  setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
                }
              }}
              className="space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Select Pet</label>
                  <select className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm">
                    <option>{pet.name} ({pet.breed} • {pet.weight})</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Select Spa Package</label>
                  <select
                    value={bookingPackage}
                    onChange={(e) => setBookingPackage(e.target.value as ServiceId)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    {SERVICE_IDS.map((id) => (
                      <option key={id} value={id}>
                        {SERVICES[id].name} ({SERVICES[id].published} CAD)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] font-semibold text-teal">Price for {pet.name}: ${bookingPrice} CAD</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground">Preferred Date (Open 7 Days)</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  />
                  <p className="text-[11px] text-teal mt-1">✓ Operating Mon – Sun (Sundays included)</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Route Window</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    {TIME_WINDOWS.map((w) => (
                      <option key={w.label}>{w.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Service Address (Toronto & GTA)</label>
                <input
                  type="text"
                  required
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                />
              </div>

              {/* Canadian Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-2">Accepted Payment Method (Canada)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingPayment("apple_pay")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer",
                      bookingPayment === "apple_pay" ? "border-ink bg-ink text-white" : "border-border bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold"> Pay</span>
                    <span className="text-[10px] opacity-75">1-Tap Fast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingPayment("google_pay")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer",
                      bookingPayment === "google_pay" ? "border-teal bg-teal text-white" : "border-border bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm font-bold">G Pay</span>
                    <span className="text-[10px] opacity-75">Instant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingPayment("card")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer",
                      bookingPayment === "card" ? "border-gold bg-gold-soft text-ink font-bold" : "border-border bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm">💳 Card</span>
                    <span className="text-[10px] opacity-75">Visa/MC/Amex</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingPayment("interac")}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer",
                      bookingPayment === "interac" ? "border-[#ffd100] bg-[#ffd100] text-black font-bold" : "border-border bg-card text-foreground"
                    )}
                  >
                    <span className="text-sm font-black">Interac</span>
                    <span className="text-[10px] opacity-75">e-Transfer</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-ink">Latchkey Service Code</span>
                  <span className="text-[11px] text-teal font-semibold">Optional Contactless Access</span>
                </div>
                <input
                  type="text"
                  value={pet.latchkeyCode}
                  onChange={(e) => setPet({ ...pet, latchkeyCode: e.target.value })}
                  placeholder="Lockbox or door code (e.g. 4821)"
                  className="w-full rounded-lg border border-border bg-background p-2 text-sm font-mono"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Our groomer will safely enter, collect your dog, groom them in the van, and return them home while you work.
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-gradient-gold py-3 text-sm font-bold text-ink shadow-lift transition-transform hover:scale-[1.01]"
              >
                Confirm Booking & Dispatch Van #1 • ${bookingPrice} CAD
              </button>
              {bookingError && <p className="text-center text-xs font-semibold text-destructive">{bookingError}</p>}
            </form>
          )}
        </div>
      )}

      {/* TAB 3: VACCINE REMINDER CENTER */}
      {activeTab === "vaccines" && (
        <div className="card-surface p-6 md:p-8 max-w-4xl mx-auto shadow-lift border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4 mb-6">
            <div>
              <Pill tone="teal">Toronto Pet Health Passport</Pill>
              <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
                Vaccination & Preventive Care Tracker
              </h2>
              <p className="text-xs text-muted-foreground">
                Automatic expiry alerts complying with City of Toronto & Ontario municipal bylaws.
              </p>
            </div>
            <button className="flex items-center gap-1.5 rounded-full border border-teal/40 bg-card px-4 py-2 text-xs font-bold text-teal hover:bg-teal hover:text-white transition-colors">
              <Upload className="h-3.5 w-3.5" /> Upload Vet Certificate
            </button>
          </div>

          <div className="space-y-4">
            {/* Rabies */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success-soft/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Rabies Vaccine</div>
                  <div className="text-xs text-muted-foreground">Mandatory in Ontario • Valid until {pet.vaccines.rabies.exp}</div>
                </div>
              </div>
              <Pill tone="success">Verified Active</Pill>
            </div>

            {/* Bordetella with reminder alert */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber/40 bg-amber-soft/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-ink">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Bordetella (Kennel Cough)</div>
                  <div className="text-xs text-amber-700 font-semibold">
                    Booster due soon: {pet.vaccines.bordetella.exp} (18 days remaining)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="gold">Booster Due</Pill>
                <button
                  onClick={() => alert("Reminder active! We will send an SMS and email notification 7 days prior.")}
                  className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
                >
                  Set SMS Alert
                </button>
              </div>
            </div>

            {/* DHPP */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">DHPP (Core Canine Vaccine)</div>
                  <div className="text-xs text-muted-foreground">Distemper, Hepatitis, Parvovirus • Valid until {pet.vaccines.dhpp.exp}</div>
                </div>
              </div>
              <Pill tone="teal">Up To Date</Pill>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GROOMING HISTORY & REPORTS */}
      {activeTab === "history" && (
        <div className="card-surface p-6 md:p-8 max-w-4xl mx-auto shadow-lift border border-border">
          <div className="border-b border-border pb-4 mb-6">
            <Pill tone="teal">Complete Service Records</Pill>
            <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
              {pet.name}'s Digital Grooming History
            </h2>
            <p className="text-xs text-muted-foreground">
              Review groomer notes, styling report cards, and receipts from every visit.
            </p>
          </div>

          <div className="space-y-4">
            {PAST_GROOMS.map((g, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                  <div>
                    <span className="text-xs font-bold text-teal">{g.date}</span>
                    <h3 className="font-serif text-lg font-semibold text-ink">{g.package}</h3>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">{g.price}</span>
                    <div className="text-xs text-muted-foreground">Groomer: {g.groomer}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <div className="text-muted-foreground">Coat condition:</div>
                    <div className="font-semibold">{g.report.coat}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <div className="text-muted-foreground">Ears:</div>
                    <div className="font-semibold">{g.report.ears}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <div className="text-muted-foreground">Nails:</div>
                    <div className="font-semibold">{g.report.nails}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <div className="text-muted-foreground">Temperament:</div>
                    <div className="font-semibold text-teal">{g.report.mood}</div>
                  </div>
                </div>

                <p className="mt-3 text-xs italic text-muted-foreground">"{g.notes}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: VIP SUBSCRIPTION MANAGEMENT */}
      {activeTab === "vip" && (
        <div className="card-surface p-6 md:p-8 max-w-3xl mx-auto shadow-lift border border-border">
          <div className="border-b border-border pb-4 mb-6">
            <Pill tone="gold"><Crown className="h-3 w-3 fill-current" /> Active VIP Membership</Pill>
            <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
              The Fresh Pooch VIP Club Status
            </h2>
            <p className="text-xs text-muted-foreground">
              Enjoy 15% off every single groom, locked weekend slots, and free seasonal spa treatments.
            </p>
          </div>

          <div className="rounded-2xl bg-ink p-6 text-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="eyebrow text-gold">Current Cadence</span>
                <h3 className="font-serif text-2xl font-bold">Every {vipCycle} Weeks</h3>
              </div>
              <div className="text-right">
                <span className="font-serif text-3xl font-bold text-gold">
                  ${vipCycle === 4 ? 119 : vipCycle === 6 ? 135 : 110} CAD
                </span>
                <span className="text-xs text-white/70"> / groom</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {([4, 6, 8] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setVipCycle(c)}
                  className={cn(
                    "flex-1 rounded-xl py-2 text-xs font-bold transition-all",
                    vipCycle === c ? "bg-gold text-ink" : "bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {c}-Week Cycle
                </button>
              ))}
            </div>

            <ul className="space-y-1.5 text-xs text-white/90 pt-2 border-t border-white/15">
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" /> 15% Lifetime Discount applied automatically</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" /> Free Organic Blueberry Facial included</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" /> Free Winter Road Salt Paw Wax massage</li>
              <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" /> Same dedicated master groomer (Sarah)</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Next scheduled refill: <strong>Nov 08, 2026</strong></span>
            <button
              onClick={() => alert("Subscription paused for 2 weeks. You can resume anytime!")}
              className="font-semibold text-muted-foreground hover:text-destructive underline"
            >
              Pause or Skip Next Cycle
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: PAW POINTS & LOYALTY REWARDS */}
      {activeTab === "rewards" && (
        <div className="card-surface p-6 md:p-8 max-w-4xl mx-auto shadow-lift border border-border space-y-8 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <Pill tone="gold" className="mb-2"><Gift className="h-3.5 w-3.5 fill-current" /> Fresh Pooch Loyalty Club</Pill>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">
                {pet.name}'s Paw Points Balance
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Earn 1 Point per $1 CAD spent. Redeem for organic treats, luxury facials, and grooming credits.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-teal p-4 text-white text-right shadow-sm trailer-rivets">
              <div className="text-[10px] uppercase font-bold text-gold tracking-wide">Available Balance</div>
              <div className="font-serif text-3xl font-bold flex items-center justify-end gap-1.5">
                <Star className="h-5 w-5 fill-gold text-gold" /> {pawPoints} Pts
              </div>
              <div className="text-[11px] text-white/80 mt-0.5">Silver Pup Tier (1.25x Multiplier)</div>
            </div>
          </div>

          {redeemedReward && (
            <div className="rounded-xl border border-success/40 bg-success-soft/60 p-4 text-xs font-semibold text-success flex items-center justify-between animate-fade-up">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>🎉 Redeemed: <strong>{redeemedReward}</strong>! This perk will be automatically applied on your next scheduled visit.</span>
              </div>
              <button onClick={() => setRedeemedReward(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {/* Reward Catalog */}
          <div>
            <h3 className="font-serif text-lg font-bold text-ink mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" /> Redeemable Rewards Catalog
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  id: "facial",
                  title: "Organic Blueberry Facial",
                  cost: 150,
                  val: "$15 CAD value",
                  desc: "Gently eliminates tear stains & conditions beard whiskers with antioxidants.",
                },
                {
                  id: "salt",
                  title: "Winter Road Salt Paw Balm & Nose Butter",
                  cost: 250,
                  val: "$25 CAD value",
                  desc: "Essential for Toronto winters. Shields delicate paw pads from toxic sidewalk de-icers.",
                },
                {
                  id: "addon",
                  title: "50% Off Any Add-On Spa Treatment",
                  cost: 400,
                  val: "$40 CAD value",
                  desc: "Valid on de-shedding treatments, nail filing buff, or ear flush spa therapy.",
                },
                {
                  id: "free_groom",
                  title: "100% Free Full Spa Groom Visit",
                  cost: 750,
                  val: `$${priceFor("full", PET_BREED, PET_WEIGHT_LBS)} CAD value`,
                  desc: "Complete head-to-paw luxury grooming package in our heated mobile van.",
                },
              ].map((r) => {
                const canRedeem = pawPoints >= r.cost;
                return (
                  <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{r.title}</span>
                        <span className="rounded-full bg-gold/20 text-ink text-xs font-bold px-2 py-0.5">{r.cost} Pts</span>
                      </div>
                      <div className="text-[11px] font-semibold text-teal mt-0.5">{r.val}</div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.desc}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (canRedeem) {
                          setPawPoints((p) => p - r.cost);
                          setRedeemedReward(r.title);
                        } else {
                          alert(`You need ${r.cost - pawPoints} more Paw Points to unlock this perk! Keep grooming with us to earn.`);
                        }
                      }}
                      disabled={!canRedeem}
                      className={cn(
                        "mt-4 w-full rounded-xl py-2 text-xs font-bold transition",
                        canRedeem
                          ? "bg-teal text-white hover:bg-teal/90 shadow-sm"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      )}
                    >
                      {canRedeem ? "Redeem for " + r.cost + " Pts" : "Unlock at " + r.cost + " Pts"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral & Birthday Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-teal" />
                <h4 className="font-bold text-sm text-ink">Give $20 CAD, Get 200 Pts</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Share your personal code with Toronto pet owners. They get $20 off their first groom, and you get 200 bonus Paw Points!
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="BARNABY20"
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono font-bold text-ink text-center"
                />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText("BARNABY20");
                    alert("Referral code BARNABY20 copied to clipboard!");
                  }}
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-gold" />
                <h4 className="font-bold text-sm text-ink">{pet.name}'s Birthday Club</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Registered Gotcha Day: <strong>May 14</strong>. We celebrate every year with a complimentary organic pupcake and celebratory silk bandana!
              </p>
              <div className="rounded-xl bg-card p-2.5 text-[11px] text-teal font-semibold border border-teal/20 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Birthday Month Perk: Automatic VIP Gift Box Included
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COAT CARE & MATTING RISK ADVISOR */}
      {activeTab === "matting" && (
        <div className="card-surface p-6 md:p-8 max-w-4xl mx-auto shadow-lift border border-border space-y-8 animate-fade-up">
          <div className="border-b border-border pb-4">
            <Pill tone="teal" className="mb-2"><Scissors className="h-3.5 w-3.5" /> Interactive Health Tool</Pill>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-ink">
              Toronto Canine Coat Care & Matting Advisor
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Toronto's winter road slush and summer humidity can cause tight matting close to delicate skin. Check your pup's current risk level.
            </p>
          </div>

          {/* Coat Selector & Timeline */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">1. Select Your Dog's Coat Type</label>
              <div className="space-y-2">
                {[
                  { id: "doodle", label: "Doodle / Poodle Fleece & Wool", riskBase: "high", desc: "Highest friction risk; curls trap shed undercoat." },
                  { id: "double", label: "Double Coat (Husky, Shepherd, Golden)", riskBase: "med", desc: "Thick undercoat requires seasonal blowout." },
                  { id: "silky", label: "Drop / Silky Coat (Yorkie, Maltese)", riskBase: "med", desc: "Fine hairs tangle easily behind ears and harness." },
                  { id: "smooth", label: "Smooth Coat (Frenchie, Pug, Boxer)", riskBase: "low", desc: "Low matting risk; primary focus is skin folds & bath." },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCoatType(c.id)}
                    className={cn(
                      "w-full text-left rounded-xl p-3 border text-xs transition",
                      selectedCoatType === c.id
                        ? "border-teal bg-teal/10 font-bold text-ink"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <div className="font-semibold text-foreground">{c.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                2. Weeks Since Last Professional Groom: <span className="text-teal font-extrabold text-sm">{weeksSinceGroom} Weeks</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={weeksSinceGroom}
                onChange={(e) => setWeeksSinceGroom(Number(e.target.value))}
                className="w-full accent-teal h-2 bg-secondary rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                <span>1 wk</span>
                <span>4 wks (Ideal)</span>
                <span>8 wks</span>
                <span>12 wks</span>
              </div>

              {/* Dynamic Risk Display Card */}
              {(() => {
                const isHighRiskCoat = selectedCoatType === "doodle" || selectedCoatType === "silky";
                const isShortCoat = selectedCoatType === "smooth";

                let riskLevel: "low" | "moderate" | "high" | "critical" = "low";
                if (isShortCoat) {
                  riskLevel = "low";
                } else if (isHighRiskCoat) {
                  if (weeksSinceGroom <= 3) riskLevel = "low";
                  else if (weeksSinceGroom <= 5) riskLevel = "moderate";
                  else if (weeksSinceGroom <= 7) riskLevel = "high";
                  else riskLevel = "critical";
                } else {
                  if (weeksSinceGroom <= 4) riskLevel = "low";
                  else if (weeksSinceGroom <= 7) riskLevel = "moderate";
                  else riskLevel = "high";
                }

                return (
                  <div className={cn(
                    "mt-6 rounded-2xl p-5 border text-xs space-y-3",
                    riskLevel === "low" && "border-success/40 bg-success-soft/50 text-success-800",
                    riskLevel === "moderate" && "border-amber/40 bg-amber-soft/50 text-amber-900",
                    riskLevel === "high" && "border-orange-500/40 bg-orange-50 text-orange-950",
                    riskLevel === "critical" && "border-destructive/40 bg-destructive/10 text-destructive",
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="uppercase text-[10px] font-bold tracking-wider">Calculated Coat Status</span>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold",
                        riskLevel === "low" && "bg-success text-white",
                        riskLevel === "moderate" && "bg-amber text-ink",
                        riskLevel === "high" && "bg-orange-500 text-white",
                        riskLevel === "critical" && "bg-destructive text-white",
                      )}>
                        {riskLevel === "low" && "🟢 Low Risk (Maintain With Daily Combing)"}
                        {riskLevel === "moderate" && "🟡 Moderate Risk (Tangles Forming At Friction Points)"}
                        {riskLevel === "high" && "🟠 High Risk (Dense Mats Close To Skin)"}
                        {riskLevel === "critical" && "🔴 Critical Matting Hazard (Pelted Coat Risk)"}
                      </span>
                    </div>

                    <p className="leading-relaxed text-xs">
                      {riskLevel === "low" && `At ${weeksSinceGroom} weeks, ${pet.name}'s coat is in prime condition. Continue daily line-brushing with a long-pin slicker brush.`}
                      {riskLevel === "moderate" && `Friction zones (behind ears, armpits, and under collar) are likely tangling. Use a metal greyhound comb down to the skin level.`}
                      {riskLevel === "high" && `Mats are likely tightening near the skin surface, pulling on nerve endings. We recommend booking a gentle de-matting treatment within the next 7 days.`}
                      {riskLevel === "critical" && `Dense pelting can trap moisture, yeast, and sidewalk salt against the skin. For ${pet.name}'s comfort and welfare, our groomer may recommend a smooth reset cut.`}
                    </p>

                    <div className="pt-2 border-t border-current/15 flex items-center justify-between">
                      <span className="text-[11px] font-semibold">Recommended action:</span>
                      <button
                        onClick={() => setActiveTab("book")}
                        className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:scale-105 transition"
                      >
                        Book Mobile Visit Now →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Expert Toronto Groomer Rules */}
          <div className="rounded-2xl bg-secondary/50 p-5 border border-border">
            <h4 className="font-bold text-sm text-ink mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal" /> Sarah's Golden Rules for Toronto Winter Coat Care
            </h4>
            <div className="grid sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div className="space-y-1">
                <strong className="text-foreground block">⚠️ Never Bathe a Matted Dog</strong>
                <p>Water acts like glue on tangled undercoat, shrinking knots tighter like a boiled wool sweater. Always brush out first!</p>
              </div>
              <div className="space-y-1">
                <strong className="text-foreground block">🪮 Practice Line-Brushing</strong>
                <p>Part the hair with one hand and brush small sections from the skin outward with a slicker brush, followed by a steel comb.</p>
              </div>
              <div className="space-y-1">
                <strong className="text-foreground block">🧂 Rinse Toronto Road Salt</strong>
                <p>Calcium chloride sidewalk melt dries out pads and gets licked off by dogs. Always wipe paws or request our organic paw balm.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
