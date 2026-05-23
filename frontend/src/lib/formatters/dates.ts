/**
 * Timezone-safe date helpers.
 *
 * Why this exists:
 *   `new Date().toISOString().slice(0, 10)` and
 *   `new Date(year, 0, 1).toISOString().slice(0, 10)` look correct but
 *   silently shift the date back by a day for any user in a positive UTC
 *   offset (Cairo, Riyadh, Dubai = UTC+3 / +4). January 1st at 00:00 local
 *   is December 31st at 21:00 UTC, and ISOString slices the UTC date.
 *
 *   This is why the Trial Balance / GL / Balance Sheet filter defaults
 *   were showing "from 2025-12-31" instead of "from 2026-01-01" for our
 *   Egyptian users. Everything still queried correctly, but the visible
 *   date in the filter UI was off by a day.
 *
 * Always use these helpers in place of `toISOString().slice(0, 10)` when
 * the value is meant to be a *local-calendar* date (a Frappe `Date` field,
 * a form input, a report filter, etc.).
 */

/** `YYYY-MM-DD` for the given local date (defaults to today, local time). */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** First day of the calendar year as `YYYY-01-01`. */
export function localYearStart(year: number = new Date().getFullYear()): string {
  return `${year}-01-01`;
}

/** Last day of the calendar year as `YYYY-12-31`. */
export function localYearEnd(year: number = new Date().getFullYear()): string {
  return `${year}-12-31`;
}

/** N days before `from` (defaults to today), as a local `YYYY-MM-DD`. */
export function localDaysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return localDate(d);
}
