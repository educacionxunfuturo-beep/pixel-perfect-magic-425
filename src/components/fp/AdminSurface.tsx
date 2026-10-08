import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp, CalendarDays, DollarSign, Users, Truck, Star, ArrowUpRight, ArrowDownRight, MapPin, Fuel, Wrench,
  KeyRound, LogOut, ShieldCheck, Key, AlertCircle, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SectionTitle } from "./primitives";
import { AdminTools } from "./AdminTools";
import { GOOGLE_RATING } from "./PublicSections";
import { formatDate, serviceName, torontoToday, updateAppointment, useAppointments } from "@/lib/appointments";
import { monthKpis, upcomingBookings, weekBars, zoneCoverage } from "@/lib/dashboard-stats";
import { getStaffConfig, looksLikeStaffEmail, staffDemoLogin, staffLogin, staffLogout, type StaffConfig } from "@/lib/staff-session";

// Not tracked by the appointment store yet: sample figures for the demo.
const SAMPLE_VIP_MEMBERS = { value: "54", delta: "+8 this month" };

const money = (n: number) => `$${n.toLocaleString("en-CA")}`;
const changeLabel = (pct: number | null) => (pct === null ? "new" : `${pct >= 0 ? "+" : ""}${pct}% vs last month`);

const VAN = [
  { label: "Fuel level", value: "72%", icon: Fuel, note: "Next fill-up Friday" },
  { label: "Water tank", value: "Full", icon: Truck, note: "Refilled this morning" },
  { label: "Next service", value: "Dec 12", icon: Wrench, note: "Oil + generator check" },
];

export function AdminSurface({
  onClientLogin,
  onAuthChange,
  onViewGroomer,
  initialAuthenticated = true,
}: {
  onClientLogin?: () => void;
  onAuthChange?: (isAuth: boolean) => void;
  onViewGroomer?: () => void;
  initialAuthenticated?: boolean;
}) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<StaffConfig | null>(null);
  useEffect(() => {
    getStaffConfig().then(setConfig);
  }, []);

  // The password is checked by the server; a pet-parent email is sent to the Customer Portal instead.
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!looksLikeStaffEmail(email)) {
      if (email.includes("@") && onClientLogin) onClientLogin();
      else setError("This sign-in is for The Fresh Pooch staff. Pet parents sign in through the Customer Portal.");
      return;
    }
    setBusy(true);
    try {
      await staffLogin(email, password);
      setIsAuthenticated(true);
      onAuthChange?.(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemoLogin = async () => {
    setBusy(true);
    try {
      await staffDemoLogin();
      setIsAuthenticated(true);
      onAuthChange?.(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo access is not available.");
    } finally {
      setBusy(false);
    }
  };

  const { appointments } = useAppointments();
  const today = torontoToday();
  const kpi = useMemo(() => monthKpis(appointments, today), [appointments, today]);
  const WEEK = useMemo(() => weekBars(appointments, today), [appointments, today]);
  const ZONES = useMemo(() => zoneCoverage(appointments, today), [appointments, today]);
  const upcoming = useMemo(() => upcomingBookings(appointments, today), [appointments, today]);
  const KPIS = [
    { label: `Revenue (${kpi.monthLabel})`, value: money(kpi.revenue), delta: changeLabel(kpi.revenueChange), up: (kpi.revenueChange ?? 0) >= 0, icon: DollarSign },
    { label: "Grooms Completed", value: String(kpi.grooms), delta: changeLabel(kpi.groomsChange), up: (kpi.groomsChange ?? 0) >= 0, icon: CalendarDays },
    { label: "Active VIP Members", value: SAMPLE_VIP_MEMBERS.value, delta: SAMPLE_VIP_MEMBERS.delta, up: true, icon: Users },
    { label: "Avg. Google Rating", value: GOOGLE_RATING.value, delta: `${GOOGLE_RATING.reviews} reviews`, up: true, icon: Star },
  ];
  const maxRev = Math.max(1, ...WEEK.map((d) => d.revenue));
  const bestDay = WEEK.reduce((best, d) => (d.revenue > best.revenue ? d : best), WEEK[0]!);

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-up mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="card-surface overflow-hidden border border-border shadow-lift">
          <div className="bg-gradient-teal p-6 text-center text-primary-foreground trailer-rivets">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-card/20 backdrop-blur border border-card/30">
              <KeyRound className="h-7 w-7 text-gold" />
            </div>
            <h2 className="font-serif text-2xl font-bold">The Fresh Pooch Operations</h2>
            <p className="mt-1 text-xs text-primary-foreground/80">
              Staff & Fleet Management Console
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 p-6 sm:p-8">
            <div className="rounded-xl border border-gold/40 bg-gold-soft/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
              <Key className="h-4 w-4 shrink-0 text-gold mt-0.5" />
              <div>
                <strong className="text-foreground">Operations Sign-In:</strong>
                <p className="mt-0.5">Admin & dispatchers log in here to manage vans, routes, and bookings.</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@thefreshpooch.ca"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-1 focus:ring-teal"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Security Key / Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-teal focus:ring-1 focus:ring-teal"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-ink py-3 text-sm font-bold text-ink-foreground shadow-lift transition hover:opacity-95 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign In to Ops Console"}
            </button>

            {config?.demoAccess && (
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={busy}
              className="w-full rounded-xl border border-gold bg-gold-soft/40 py-2.5 text-xs font-bold text-ink transition hover:bg-gold/20 flex items-center justify-center gap-1.5"
            >
              <span>⚡ One-Click Demo Admin Access</span>
            </button>
            )}

            {onClientLogin && (
              <div className="pt-2 text-center border-t border-border">
                <button
                  type="button"
                  onClick={onClientLogin}
                  className="text-xs font-semibold text-teal hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <User className="h-3.5 w-3.5" /> Pet Parent? Sign in to your Customer Portal →
                </button>
              </div>
            )}

            {config?.demoHint && <div className="text-center text-[11px] text-muted-foreground">Demo: <span className="font-mono font-semibold text-foreground">{config.demoHint}</span></div>}
            {config && !config.signInEnabled && !config.demoAccess && (
              <div className="text-center text-[11px] text-destructive">Staff sign-in is not configured on this server yet.</div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Admin Session Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/20 bg-sage-soft/60 px-5 py-3">
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldCheck className="h-4 w-4 text-teal" />
          <span className="font-semibold text-foreground">Secure Admin Session:</span>
          <span className="text-muted-foreground">Logged in as Operations Director (<code className="font-mono">admin@thefreshpooch.ca</code>)</span>
          <Pill tone="success" className="ml-1 text-[10px]">Open 7 Days Active</Pill>
        </div>
        <div className="flex items-center gap-2">
          {onViewGroomer && (
            <button
              onClick={onViewGroomer}
              className="flex items-center gap-1.5 rounded-lg border border-teal/40 bg-card px-3 py-1.5 text-xs font-semibold text-teal hover:bg-teal hover:text-white transition shadow-sm"
              title="Supervise Groomer Sarah's Mobile Van Field App"
            >
              <Truck className="h-3.5 w-3.5" /> Van #1 Groomer Field App (Sarah)
            </button>
          )}
          <button
            onClick={async () => {
              await staffLogout();
              setIsAuthenticated(false);
              onAuthChange?.(false);
              if (onClientLogin) onClientLogin();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Lock / Sign Out
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow text-gold">Owner Dashboard</div>
          <h1 className="text-4xl font-semibold">Operations at a glance</h1>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-card p-1">
          {(["week", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-all",
                range === r ? "bg-ink text-ink-foreground" : "text-muted-foreground",
              )}
            >
              This {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => {
          const I = k.icon;
          return (
            <div key={k.label} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-soft text-teal">
                  <I className="h-5 w-5" />
                </div>
                <span className={cn("flex items-center gap-1 text-xs font-bold", k.up ? "text-success" : "text-destructive")}>
                  {k.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {k.delta}
                </span>
              </div>
              <div className="mt-4 font-serif text-3xl font-semibold">{k.value}</div>
              <div className="text-sm text-muted-foreground">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Bookings & revenue</h2>
            {bestDay.revenue > 0 && <Pill tone="gold"><TrendingUp className="h-3.5 w-3.5" /> Best day: {bestDay.day}</Pill>}
          </div>
          <div className="mt-6 flex h-48 items-stretch gap-3">
            {WEEK.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      d.revenue === 0 ? "bg-muted" : "bg-gradient-teal",
                    )}
                    style={{ height: d.revenue === 0 ? "6px" : `${(d.revenue / maxRev) * 100}%` }}
                    title={`$${d.revenue} CAD`}
                  />
                </div>
                <div className="text-xs font-bold">{d.day}</div>
                <div className="text-[0.65rem] text-muted-foreground">{d.grooms} {d.grooms === 1 ? "groom" : "grooms"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-2xl font-semibold">Van #1 health</h2>
          <div className="mt-4 space-y-3">
            {VAN.map((v) => {
              const I = v.icon;
              return (
                <div key={v.label} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-accent-foreground">
                    <I className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">{v.label}</div>
                    <div className="font-semibold">{v.value}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{v.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-surface mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold">Upcoming bookings</h2>
          <Pill tone="muted">From the portal, the online quote and Qimmiq · any device</Pill>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No new bookings yet. Bookings made in the Customer Portal or the instant quote appear here.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Dog</th><th>Service</th><th>Where</th><th className="text-right">Total</th><th className="text-right">Status</th></tr>
              </thead>
              <tbody>
                {upcoming.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-2.5 font-semibold">{formatDate(a.date)}<div className="text-xs font-normal text-muted-foreground">{a.timeWindow ?? a.time}</div></td>
                    <td>{a.petName}<div className="text-xs text-muted-foreground">{a.breed}</div></td>
                    <td>{serviceName(a.service)}</td>
                    <td className="max-w-[200px] truncate text-muted-foreground">{a.address}</td>
                    <td className="text-right font-semibold">${a.total}</td>
                    <td className="text-right">
                      {a.status === "requested" ? (
                        <span className="inline-flex gap-1.5">
                          <button onClick={() => updateAppointment(a.id, { status: "confirmed" })} className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink hover:opacity-90">Confirm</button>
                          <button onClick={() => updateAppointment(a.id, { status: "cancelled" })} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground">Decline</button>
                        </span>
                      ) : (
                        <Pill tone="success">Confirmed</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <SectionTitle eyebrow="Route Density" title="Zone coverage this month" sub="Where the trailer parks, and how full each route day is." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ZONES.map((z) => (
            <div key={z.area} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-teal" /> {z.area}
                </div>
                <Pill tone={z.fill >= 85 ? "success" : z.fill >= 65 ? "gold" : "muted"}>{z.fill}% full</Pill>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{z.day} • {z.bookings} {z.bookings === 1 ? "booking" : "bookings"}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="bg-gradient-gold h-full rounded-full" style={{ width: `${z.fill}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <AdminTools />
    </div>
  );
}
