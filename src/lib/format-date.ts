/**
 * Deterministic date/time formatting — deliberately NOT `Intl`/
 * `toLocaleDateString`. Those delegate to the host's ICU data, which can
 * differ between Node's server-side ICU build and a browser's, producing
 * byte-different strings for the "same" locale + options (observed: "Mon 24
 * Aug" server vs "Mon, 24 Aug" client for en-GB) — a React hydration
 * mismatch on every load. Fixed lookup tables can't disagree with themselves.
 */

const WEEKDAYS = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
const MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatClockTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** "Astăzi" / "Mâine" / "Lun, 24 Aug" relative to `now` (defaults to the
 * moment called) — a departures list showing only clock time can't tell an
 * operator whether "04:30" is minutes away or a whole day out. */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diffDays === 0) return "Astăzi";
  if (diffDays === 1) return "Mâine";
  return formatWeekdayDate(date);
}
