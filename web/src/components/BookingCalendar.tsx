import { useEffect, useMemo, useState } from 'react';

import { parseDateKey, toDateKey } from '../lib/dates';
import { PaperCard } from './UI';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildMonth(year: number, month: number) {
  const firstDay = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const cells: Array<number | null> = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookingCalendar({ value, minDate, onChange }: { value: string; minDate: string; onChange: (date: string) => void }) {
  const selected = parseDateKey(value);
  const minimum = parseDateKey(minDate);
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  useEffect(() => {
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [value]);

  const cells = useMemo(() => buildMonth(viewYear, viewMonth), [viewMonth, viewYear]);
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth, 1, 12));
  const previousDisabled = viewYear < minimum.getFullYear() || (viewYear === minimum.getFullYear() && viewMonth <= minimum.getMonth());

  function moveMonth(amount: number) {
    const next = new Date(viewYear, viewMonth + amount, 1, 12);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <PaperCard className="booking-calendar">
      <div className="booking-calendar-head">
        <button type="button" disabled={previousDisabled} onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button>
        <h3>{monthLabel.toLowerCase()}</h3>
        <button type="button" onClick={() => moveMonth(1)} aria-label="Next month">›</button>
      </div>
      <div className="booking-weekdays">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="booking-month-grid">
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-blank" key={`blank-${index}`} />;
          const key = toDateKey(new Date(viewYear, viewMonth, day, 12));
          const isSelected = key === value;
          const isToday = key === minDate;
          const disabled = key < minDate;
          return (
            <button type="button" key={key} disabled={disabled} className={`${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => onChange(key)}>
              <span>{day}</span>
            </button>
          );
        })}
      </div>
      <div className="booking-calendar-footer"><span><i className="selected-key" />selected</span><span><i className="today-key" />today</span></div>
    </PaperCard>
  );
}
