import { ROUTE_DAYS, STOPS_PER_ROUTE_DAY, addDays, routeForDate, torontoToday, weekdayIndex, type Appointment } from "./appointments";

/** Owner-dashboard figures, all derived from the appointment store. */

const isBooked = (a: Appointment) => a.status !== "cancelled";
const isDone = (a: Appointment) => a.status === "completed";

function monthStart(date: string): string {
  return `${date.slice(0, 8)}01`;
}

function previousMonthSameDay(date: string): { start: string; end: string } {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const lastDay = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
  const start = prev.toISOString().slice(0, 10);
  const end = `${start.slice(0, 8)}${String(Math.min(d, lastDay)).padStart(2, "0")}`;
  return { start, end };
}

function percentChange(now: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

export interface MonthKpis {
  monthLabel: string;
  revenue: number;
  revenueChange: number | null;
  grooms: number;
  groomsChange: number | null;
}

/** Completed grooms and revenue this month so far, compared with the same days last month. */
export function monthKpis(list: Appointment[], today = torontoToday()): MonthKpis {
  const start = monthStart(today);
  const prev = previousMonthSameDay(today);
  const thisMonth = list.filter((a) => isDone(a) && a.date >= start && a.date <= today);
  const lastMonth = list.filter((a) => isDone(a) && a.date >= prev.start && a.date <= prev.end);
  const revenue = thisMonth.reduce((s, a) => s + a.total, 0);
  const lastRevenue = lastMonth.reduce((s, a) => s + a.total, 0);
  return {
    monthLabel: new Date(`${today}T12:00:00Z`).toLocaleDateString("en-CA", { timeZone: "UTC", month: "short" }),
    revenue,
    revenueChange: percentChange(revenue, lastRevenue),
    grooms: thisMonth.length,
    groomsChange: percentChange(thisMonth.length, lastMonth.length),
  };
}

export interface DayBar {
  day: string;
  date: string;
  grooms: number;
  revenue: number;
}

/** Monday-to-Sunday bars for the current week (completed and booked appointments). */
export function weekBars(list: Appointment[], today = torontoToday()): DayBar[] {
  const monday = addDays(today, -((weekdayIndex(today) + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const day = list.filter((a) => isBooked(a) && a.date === date);
    return {
      day: new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { timeZone: "UTC", weekday: "short" }),
      date,
      grooms: day.length,
      revenue: day.reduce((s, a) => s + a.total, 0),
    };
  });
}

export interface ZoneFill {
  area: string;
  day: string;
  bookings: number;
  fill: number;
}

/** Bookings per route neighbourhood this month, and how full its route days were. */
export function zoneCoverage(list: Appointment[], today = torontoToday()): ZoneFill[] {
  const start = monthStart(today);
  const monthEnd = addDays(`${addDays(start, 32).slice(0, 8)}01`, -1);
  return ROUTE_DAYS.map(({ day, area }, weekday) => {
    let routeDays = 0;
    for (let d = start; d <= monthEnd; d = addDays(d, 1)) if (weekdayIndex(d) === weekday) routeDays++;
    const bookings = list.filter((a) => isBooked(a) && a.date >= start && a.date <= monthEnd && routeForDate(a.date).area === area).length;
    return { area, day: `${day}s`, bookings, fill: Math.min(100, Math.round((bookings / (routeDays * STOPS_PER_ROUTE_DAY)) * 100)) };
  }).sort((a, b) => b.fill - a.fill);
}

/** Bookings made from the portal or the public quote that are still ahead. */
export function upcomingBookings(list: Appointment[], today = torontoToday()): Appointment[] {
  return list.filter((a) => (a.source === "portal" || a.source === "web") && a.date >= today && a.status !== "completed" && a.status !== "cancelled");
}
