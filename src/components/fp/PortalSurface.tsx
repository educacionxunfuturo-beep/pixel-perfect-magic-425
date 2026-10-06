import { useState, useEffect } from "react";
import {
  CalendarHeart, Crown, Upload, Truck, Check, Navigation, Bath, Sparkles, MapPin,
  ShieldCheck, AlertTriangle, KeyRound, Eye, EyeOff, Clock, User, Phone, Mail,
  Calendar, FileText, Plus, ChevronRight, LogOut, CheckCircle2, Heart, Award
} from "lucide-react";
import barnaby from "@/assets/barnaby.jpg";
import { cn } from "@/lib/utils";
import { Chip, Pill, SectionTitle } from "./primitives";

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

const PAST_GROOMS = [
  {
    date: "Sep 12, 2026",
    package: "Premium Full Groom (Teddy Cut)",
    price: "$149 CAD",
    groomer: "Sarah M.",
    report: { coat: "Silky & Mat-Free", ears: "Cleansed & Plucked", nails: "Clipped & Buffed", mood: "Happy Angel ⭐" },
    notes: "Barnaby was a delight! Gentle conditioning treatment applied for sensitive skin.",
  },
  {
    date: "Aug 08, 2026",
    package: "Bath & Tidy + Blueberry Facial",
    price: "$135 CAD",
    groomer: "Sarah M.",
    report: { coat: "Fresh & Fluffed", ears: "Clean", nails: "Buffed Smooth", mood: "Calm & Relaxed" },
    notes: "Summer heat de-shedding and paw pad balm applied.",
  },
];

const STAGES = [
  { label: "En Route", sub: "14 min away", icon: Navigation },
  { label: "Arrived", sub: "Parked in visitor loop", icon: Truck },
  { label: "In Tub", sub: "Organic oatmeal bath", icon: Bath },
  { label: "Finished", sub: "Report card sent", icon: Sparkles },
];

export function PortalSurface() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [userEmail, setUserEmail] = useState("jordan.m@torontoparents.ca");
  const [userName, setUserName] = useState("Jordan Miller");
  const [userPhone, setUserPhone] = useState("(416) 555-0199");
  const [userAddress, setUserAddress] = useState("142 Roehampton Ave, Midtown Toronto M4P 1R4");

  const [activeTab, setActiveTab] = useState<"overview" | "book" | "vaccines" | "history" | "vip">("overview");
  const [pet, setPet] = useState<PetProfile>(DEFAULT_PET);
  const [stage, setStage] = useState(1);
  const [autoStage, setAutoStage] = useState(true);
  const [revealCode, setRevealCode] = useState(false);
  const [editingCode, setEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState(pet.latchkeyCode);

  // Native Booking state
  const [bookingDate, setBookingDate] = useState("2026-10-18");
  const [bookingSlot, setBookingSlot] = useState("Morning (8:30 AM – 11:00 AM)");
  const [bookingPackage, setBookingPackage] = useState("Premium Full Groom ($140 – $185 CAD)");
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
      <div className="animate-fade-up mx-auto max-w-md px-4 py-16">
        <div className="card-surface p-8 shadow-lift border border-border">
          <div className="text-center">
            <Pill tone="gold" className="mb-3">Toronto Pet Parent Portal</Pill>
            <h1 className="font-serif text-3xl font-semibold text-ink">
              {authMode === "login" ? "Sign In to Your Dashboard" : "Create Pet Parent Account"}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {authMode === "login"
                ? "Track live grooms, manage Latchkey access & vaccine reminders."
                : "Book 100% cage-free mobile grooming right to your Toronto doorstep."}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
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
                defaultValue="••••••••"
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

            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-teal py-3 text-sm font-bold text-white shadow-lift transition-transform hover:scale-[1.02]"
            >
              {authMode === "login" ? "Sign In" : "Create Account & Enter Portal"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center">
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

          <div className="mt-4 rounded-xl bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
            <span className="font-semibold text-ink">Demo One-Click Access:</span> Click "Sign In" with pre-filled credentials to explore Jordan & Barnaby's live portal!
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

      {/* Navigation Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {[
          { id: "overview", label: "My Dog & Live Tracker", icon: Heart },
          { id: "book", label: "Book Direct Appointment", icon: Calendar },
          { id: "vaccines", label: "Vaccine Reminders", icon: ShieldCheck, badge: "Action Needed" },
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
                Booking reference <strong>#FP-2026-B81</strong> has been locked into Van #1's route for <strong>{bookingDate}</strong> during the <strong>{bookingSlot}</strong> window.
              </p>
              <div className="rounded-2xl border border-border bg-secondary/50 p-4 text-xs max-w-sm mx-auto text-left space-y-2">
                <div><strong>Dog:</strong> {pet.name} ({pet.breed})</div>
                <div><strong>Package:</strong> {bookingPackage}</div>
                <div><strong>Location:</strong> {userAddress}</div>
                <div><strong>Latchkey Access:</strong> Authorized (Code {pet.latchkeyCode})</div>
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
              onSubmit={(e) => {
                e.preventDefault();
                setBookingConfirmed(true);
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
                    onChange={(e) => setBookingPackage(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    <option>Bath & Tidy (From $130 CAD)</option>
                    <option>Premium Full Groom ($140 – $185 CAD)</option>
                    <option>The Ultimate Spa Experience ($260 – $290 CAD)</option>
                  </select>
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
                    <option>Morning (8:30 AM – 11:00 AM)</option>
                    <option>Midday (11:30 AM – 2:00 PM)</option>
                    <option>Afternoon (2:30 PM – 5:30 PM)</option>
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
                Confirm Booking & Dispatch Van #1
              </button>
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
    </div>
  );
}
