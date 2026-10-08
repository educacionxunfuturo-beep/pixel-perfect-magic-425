import { addDays, formatDate, routeForDate, serviceName, sortByTime, torontoToday, type Appointment } from "./appointments";
import { monthKpis, upcomingBookings, weekBars, zoneCoverage } from "./dashboard-stats";

/**
 * Plain-text summary of the business for the AI owner copilot.
 * Built in the browser from the appointment store and sent to /api/qimmiq/copilot (staff only).
 * It leaves out Latchkey codes, phone numbers and street addresses: those never go to the AI provider.
 */

const money = (n: number) => `$${n.toLocaleString("en-CA")}`;

function stopLine(a: Appointment): string {
  // Stop notes hold gate and lockbox codes, so only the report-card temperament goes out.
  const temperament = a.report?.temperament ? ` · temperament: ${a.report.temperament}` : "";
  return `  - ${a.time} ${a.petName} (${a.breed}, ${a.weightLbs} lbs) · ${serviceName(a.service)} · ${money(a.total)} · status ${a.status}${a.latchkeyCode ? " · Latchkey access" : ""}${temperament}`;
}

export function buildOpsSnapshot(appointments: Appointment[], today = torontoToday()): string {
  const route = routeForDate(today);
  const todays = sortByTime(appointments.filter((a) => a.date === today && a.status !== "cancelled" && a.status !== "requested"));
  const done = todays.filter((a) => a.status === "completed");
  const k = monthKpis(appointments, today);
  const pct = (p: number | null) => (p === null ? "no data for last month" : `${p >= 0 ? "+" : ""}${p}% vs same days last month`);
  const week = weekBars(appointments, today).map((d) => `${d.day} ${d.date}: ${d.grooms} grooms, ${money(d.revenue)}`).join("; ");
  const zones = zoneCoverage(appointments, today).map((z) => `${z.area} (${z.day}) ${z.bookings} bookings, ${z.fill}% full`).join("; ");
  const upcoming = sortByTime(upcomingBookings(appointments, today)).slice(0, 15);
  const requests = upcoming.filter((a) => a.status === "requested").length;
  const tomorrow = addDays(today, 1);
  const tomorrowStops = appointments.filter((a) => a.date === tomorrow && a.status !== "cancelled").length;

  return [
    `Today: ${formatDate(today)} (${today}), ${route.day} = ${route.area} route.`,
    `Today's stops (${todays.length}; ${done.length} completed, ${money(done.reduce((s, a) => s + a.total, 0))} collected):`,
    todays.length ? todays.map(stopLine).join("\n") : "  - none",
    `Tomorrow (${routeForDate(tomorrow).area} route): ${tomorrowStops} bookings.`,
    `Month to date (${k.monthLabel}): ${money(k.revenue)} revenue (${pct(k.revenueChange)}), ${k.grooms} completed grooms (${pct(k.groomsChange)}), average ticket ${k.grooms ? money(Math.round(k.revenue / k.grooms)) : "n/a"}.`,
    `This week: ${week}.`,
    `Route fill this month (6 stops per route day): ${zones}.`,
    `Upcoming bookings from the portal and website (${upcomingBookings(appointments, today).length}, ${requests} still awaiting confirmation):`,
    upcoming.length ? upcoming.map((a) => `  - ${formatDate(a.date)} ${a.timeWindow ?? a.time} ${a.petName} (${a.breed || "breed not given"}) · ${serviceName(a.service)} · ${money(a.total)} · ${a.status} · from ${a.source}`).join("\n") : "  - none",
    "Vaccine records: Barnaby (#FP-0428) Rabies valid to Nov 20 2026, DHPP valid to Jan 15 2027, Bordetella expires Oct 24 2026 (booster due). Other dogs have no certificates uploaded yet.",
    "Sample figures (not connected to live data yet): 54 VIP members, Google rating 4.9, Van #1 fuel 72%, water tank full, next service Dec 12.",
  ].join("\n");
}
