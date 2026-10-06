import { useState } from "react";
import {
  TrendingUp, CalendarDays, DollarSign, Users, Truck, Star, ArrowUpRight, ArrowDownRight, MapPin, Fuel, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SectionTitle } from "./primitives";
import { AdminTools } from "./AdminTools";

const KPIS = [
  { label: "Revenue (Nov)", value: "$18,420", delta: "+12.4%", up: true, icon: DollarSign },
  { label: "Grooms Completed", value: "118", delta: "+9.2%", up: true, icon: CalendarDays },
  { label: "Active VIP Members", value: "46", delta: "+6 this month", up: true, icon: Users },
  { label: "Avg. Google Rating", value: "4.9", delta: "312 reviews", up: true, icon: Star },
];

const WEEK = [
  { day: "Mon", grooms: 4, rev: 620 },
  { day: "Tue", grooms: 5, rev: 780 },
  { day: "Wed", grooms: 5, rev: 815 },
  { day: "Thu", grooms: 3, rev: 470 },
  { day: "Fri", grooms: 6, rev: 940 },
  { day: "Sat", grooms: 6, rev: 990 },
  { day: "Sun", grooms: 0, rev: 0 },
];

const ZONES = [
  { area: "Midtown", day: "Wednesdays", bookings: 34, fill: 92 },
  { area: "The Annex", day: "Tuesdays", bookings: 27, fill: 84 },
  { area: "Rosedale", day: "Thursdays", bookings: 19, fill: 68 },
  { area: "Christie Pits", day: "Fridays", bookings: 22, fill: 76 },
  { area: "The Beaches", day: "Saturdays", bookings: 31, fill: 88 },
  { area: "King West", day: "Mondays", bookings: 15, fill: 54 },
];

const VAN = [
  { label: "Fuel level", value: "72%", icon: Fuel, note: "Next fill-up Friday" },
  { label: "Water tank", value: "Full", icon: Truck, note: "Refilled this morning" },
  { label: "Next service", value: "Dec 12", icon: Wrench, note: "Oil + generator check" },
];

export function AdminSurface() {
  const [range, setRange] = useState<"week" | "month">("week");
  const maxRev = Math.max(...WEEK.map((d) => d.rev));

  return (
    <div className="animate-fade-up mx-auto max-w-7xl px-4 py-8 md:px-6">
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Bookings & revenue</h2>
            <Pill tone="gold"><TrendingUp className="h-3.5 w-3.5" /> Best day: Saturday</Pill>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {WEEK.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all",
                      d.rev === 0 ? "bg-muted" : "bg-gradient-teal",
                    )}
                    style={{ height: d.rev === 0 ? "6px" : `${(d.rev / maxRev) * 100}%` }}
                    title={`$${d.rev}`}
                  />
                </div>
                <div className="text-xs font-bold">{d.day}</div>
                <div className="text-[0.65rem] text-muted-foreground">{d.grooms} grooms</div>
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
              <div className="mt-1 text-sm text-muted-foreground">{z.day} • {z.bookings} bookings</div>
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
