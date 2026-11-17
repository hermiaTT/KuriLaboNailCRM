export const SALON_TIME_ZONE = 'America/Vancouver';

const dateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALON_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeParts = new Intl.DateTimeFormat('en-US', {
  timeZone: SALON_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsToRecord(parts: Intl.DateTimeFormatPart[]) {
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export function salonDateKey(value: Date | string) {
  const record = partsToRecord(dateParts.formatToParts(new Date(value)));
  return `${record.year}-${record.month}-${record.day}`;
}

export function salonMinutes(value: Date | string) {
  const record = partsToRecord(timeParts.formatToParts(new Date(value)));
  return Number(record.hour) * 60 + Number(record.minute);
}

export function formatSalonTime(value: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: SALON_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function todayInSalon() {
  return salonDateKey(new Date());
}

export function parseDateKey(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function monthLabel(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(parseDateKey(dateKey));
}

export function longDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(parseDateKey(dateKey));
}

export function calendarDays(dateKey: string) {
  const focus = parseDateKey(dateKey);
  const start = new Date(focus.getFullYear(), focus.getMonth(), 1, 12);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      key: toDateKey(day),
      day: day.getDate(),
      inMonth: day.getMonth() === focus.getMonth(),
    };
  });
}
