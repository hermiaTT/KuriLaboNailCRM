import { supabase } from '../lib/supabase';

export type AvailabilityStatus = 'available' | 'booked' | 'blocked';

type BlockedTimeRow = { id: string; is_full_day: boolean; start_time: string | null; end_time: string | null };
type AppointmentRow = { start_time: string; end_time: string };

export type DayAvailability = {
  blockedTimes: BlockedTimeRow[];
  appointments: AppointmentRow[];
};

function toMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

/** True if ["HH:MM"|"HH:MM:SS"] window [aStart,aEnd) overlaps [bStart,bEnd). */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** One fetch of everything needed to resolve availability for a given date. */
export async function getDayAvailability(date: string): Promise<DayAvailability> {
  const [blockedRes, apptRes] = await Promise.all([
    supabase.from('blocked_times').select('id, is_full_day, start_time, end_time').eq('date', date),
    supabase.from('appointments').select('start_time, end_time').eq('date', date).neq('status', 'cancelled'),
  ]);
  if (blockedRes.error) console.error('[availability] blocked_times fetch error:', blockedRes.error);
  if (apptRes.error) console.error('[availability] appointments fetch error:', apptRes.error);

  return {
    blockedTimes: (blockedRes.data ?? []) as BlockedTimeRow[],
    appointments: (apptRes.data ?? []) as AppointmentRow[],
  };
}

/** Same data as getDayAvailability, but for every date in [monthStart, monthEnd] in 2 queries. */
export async function getMonthAvailability(
  monthStart: string,
  monthEnd: string,
): Promise<Record<string, DayAvailability>> {
  const [blockedRes, apptRes] = await Promise.all([
    supabase.from('blocked_times').select('id, date, is_full_day, start_time, end_time')
      .gte('date', monthStart).lte('date', monthEnd),
    supabase.from('appointments').select('date, start_time, end_time')
      .gte('date', monthStart).lte('date', monthEnd).neq('status', 'cancelled'),
  ]);
  if (blockedRes.error) console.error('[availability] month blocked_times fetch error:', blockedRes.error);
  if (apptRes.error) console.error('[availability] month appointments fetch error:', apptRes.error);

  const grouped: Record<string, DayAvailability> = {};
  for (const row of (blockedRes.data ?? []) as (BlockedTimeRow & { date: string })[]) {
    grouped[row.date] = grouped[row.date] ?? { blockedTimes: [], appointments: [] };
    grouped[row.date].blockedTimes.push({
      id: row.id, is_full_day: row.is_full_day, start_time: row.start_time, end_time: row.end_time,
    });
  }
  for (const row of (apptRes.data ?? []) as (AppointmentRow & { date: string })[]) {
    grouped[row.date] = grouped[row.date] ?? { blockedTimes: [], appointments: [] };
    grouped[row.date].appointments.push({ start_time: row.start_time, end_time: row.end_time });
  }
  return grouped;
}

/** Blocked (full-day or overlapping partial block) beats booked (overlapping appointment) beats available. */
export function getWindowStatus(start: string, end: string, day: DayAvailability): AvailabilityStatus {
  const isBlocked = day.blockedTimes.some(
    (b) => b.is_full_day || (b.start_time && b.end_time && overlaps(start, end, b.start_time, b.end_time)),
  );
  if (isBlocked) return 'blocked';

  const isBooked = day.appointments.some((a) => overlaps(start, end, a.start_time, a.end_time));
  if (isBooked) return 'booked';

  return 'available';
}
