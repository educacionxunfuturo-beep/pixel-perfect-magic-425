import { DEMO_ROUTE_STOPS } from "./demo-route";

export const DEMO_CALENDAR_PATH = "/calendar/feed.ics";

const TZ = "America/Toronto";
const STOP_MINUTES = 75;

// Today's date in Toronto as YYYYMMDD.
function torontoDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parts["year"]}${parts["month"]}${parts["day"]}`;
}

// "1:30 PM" -> minutes since midnight
function toMinutes(time: string): number {
  const [, h, m, ampm] = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim()) ?? [];
  const hour = (Number(h) % 12) + (ampm?.toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(m);
}

function localStamp(date: string, minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${date}T${hh}${mm}00`;
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * iCal feed with today's Van #1 demo route. Latchkey codes, phone numbers and
 * private notes stay out of the feed: calendars get shared and synced to many devices.
 */
export function buildDemoCalendar(now = new Date()): string {
  const date = torontoDate(now);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const events = DEMO_ROUTE_STOPS.map((stop, i) => {
    const start = toMinutes(stop.time);
    return [
      "BEGIN:VEVENT",
      `UID:fp-demo-${date}-${i + 1}@thefreshpooch`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TZ}:${localStamp(date, start)}`,
      `DTEND;TZID=${TZ}:${localStamp(date, start + STOP_MINUTES)}`,
      `SUMMARY:${escapeText(`${stop.pet} (${stop.breed}) · ${stop.svc}`)}`,
      `LOCATION:${escapeText(stop.address)}`,
      `DESCRIPTION:${escapeText(`Van #1 · Groomer Sarah · ${stop.status}`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Fresh Pooch//Van Routes//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:The Fresh Pooch · Van #1",
    `X-WR-TIMEZONE:${TZ}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT5M",
    "X-PUBLISHED-TTL:PT5M",
    "BEGIN:VTIMEZONE",
    `TZID:${TZ}`,
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
