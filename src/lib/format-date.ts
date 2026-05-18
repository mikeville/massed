/**
 * Date formatting shared by SetTable's date headers and EditLedger's
 * saved-zone label. Centralized so both surfaces format past-day strings
 * identically — "2026-04-29" → "WED · APR 29".
 *
 * The string stays mixed-case here; CSS (text-transform: uppercase) is
 * responsible for the all-caps presentation. Keeping the formatting layer
 * string-only means the same helper can be used wherever the date label
 * appears, without coupling it to a particular CSS class.
 */
export function formatDateHeader(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${weekday} · ${monthDay}`;
}

/** Today's date as a YYYY-MM-DD string in the user's local timezone. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
