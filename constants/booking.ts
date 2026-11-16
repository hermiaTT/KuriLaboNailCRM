/**
 * Booking constants — pure frontend values, no DB-backed slot resource.
 * Shared by (user)/book.tsx and (admin)/slots.tsx so both screens agree on
 * exactly what a "slot" or "custom time" means.
 */

export const DEFAULT_SLOTS = [
  { label: 'Morning', start: '10:00', end: '13:00' },
  { label: 'Afternoon', start: '13:00', end: '16:00' },
  { label: 'Evening', start: '16:00', end: '19:00' },
];

/** Custom time: any 30-min-aligned start between 8:00 AM and 5:00 PM, always a fixed 3-hour visit. */
export const CUSTOM_TIME_RANGE = { earliest: '08:00', latest: '17:00', durationMin: 180 };

export function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function addMinutes(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 12 || 12;
  return `${hour}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}
