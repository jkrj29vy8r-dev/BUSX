/**
 * Deterministic date/time formatting — deliberately NOT `Intl`/
 * `toLocaleDateString`. Those delegate to the host's ICU data, which can
 * differ between Node's server-side ICU build and a browser's, producing
 * byte-different strings for the "same" locale + options (observed: "Mon 24
 * Aug" server vs "Mon, 24 Aug" client for en-GB) — a React hydration
 * mismatch on every load. Fixed lookup tables can't disagree with themselves.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatClockTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
