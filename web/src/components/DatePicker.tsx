import { useEffect, useMemo, useRef, useState } from 'react';

import { parseDateKey, toDateKey, todayInSalon } from '../lib/dates';
import { getLocale, t, useLanguage, weekDayLabels } from '../lib/i18n';

type DatePickerProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

function buildMonth(year: number, month: number) {
  const firstDay = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
  const cells: Array<number | null> = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function monthKey(year: number, month: number) {
  return year * 12 + month;
}

export function DatePicker({
  value,
  defaultValue = '',
  onChange,
  name,
  minDate,
  maxDate,
  required = false,
  disabled = false,
  placeholder,
}: DatePickerProps) {
  const language = useLanguage();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value === undefined ? internalValue : value;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const initialDate = useMemo(() => {
    const today = todayInSalon();
    let key = selectedValue || today;
    if (minDate && key < minDate) key = minDate;
    if (maxDate && key > maxDate) key = maxDate;
    return parseDateKey(key);
  }, [maxDate, minDate, selectedValue]);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (open) return;
    setViewYear(initialDate.getFullYear());
    setViewMonth(initialDate.getMonth());
  }, [initialDate, open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const cells = useMemo(() => buildMonth(viewYear, viewMonth), [viewMonth, viewYear]);
  const today = todayInSalon();
  const minimumMonth = minDate ? parseDateKey(minDate) : null;
  const maximumMonth = maxDate ? parseDateKey(maxDate) : null;
  const previousDisabled = minimumMonth != null && monthKey(viewYear, viewMonth) <= monthKey(minimumMonth.getFullYear(), minimumMonth.getMonth());
  const nextDisabled = maximumMonth != null && monthKey(viewYear, viewMonth) >= monthKey(maximumMonth.getFullYear(), maximumMonth.getMonth());
  const minYear = minimumMonth?.getFullYear() ?? 1900;
  const maxYear = maximumMonth?.getFullYear() ?? new Date().getFullYear() + 10;
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index), [maxYear, minYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: new Intl.DateTimeFormat(getLocale(), { month: 'long' }).format(new Date(2020, month, 1, 12)),
  })), [language]);

  function commit(next: string) {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  }

  function moveMonth(amount: number) {
    const next = new Date(viewYear, viewMonth + amount, 1, 12);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function changeYear(nextYear: number) {
    let nextMonth = viewMonth;
    if (minimumMonth && nextYear === minimumMonth.getFullYear()) nextMonth = Math.max(nextMonth, minimumMonth.getMonth());
    if (maximumMonth && nextYear === maximumMonth.getFullYear()) nextMonth = Math.min(nextMonth, maximumMonth.getMonth());
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  }

  const displayValue = selectedValue
    ? new Intl.DateTimeFormat(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' }).format(parseDateKey(selectedValue))
    : placeholder || t('Choose a date');

  return <div className={`date-picker ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={rootRef}>
    {name && <input type="hidden" name={name} value={selectedValue} />}
    <button type="button" className="date-picker-trigger" disabled={disabled} onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open} aria-required={required}>
      <span>{displayValue}</span><i aria-hidden="true">▾</i>
    </button>
    {open && <div className="date-picker-popover" role="dialog" aria-label={t('Choose a date')}>
      <div className="date-picker-head">
        <button type="button" disabled={previousDisabled} onClick={() => moveMonth(-1)} aria-label={t('Previous month')}>‹</button>
        <div className="date-picker-month-year">
          <select aria-label={t('Month')} value={viewMonth} onChange={(event) => setViewMonth(Number(event.target.value))}>
            {months.map((month) => {
              const key = monthKey(viewYear, month.value);
              const below = minimumMonth && key < monthKey(minimumMonth.getFullYear(), minimumMonth.getMonth());
              const above = maximumMonth && key > monthKey(maximumMonth.getFullYear(), maximumMonth.getMonth());
              return <option key={month.value} value={month.value} disabled={Boolean(below || above)}>{month.label}</option>;
            })}
          </select>
          <select aria-label={t('Year')} value={viewYear} onChange={(event) => changeYear(Number(event.target.value))}>
            {years.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </div>
        <button type="button" disabled={nextDisabled} onClick={() => moveMonth(1)} aria-label={t('Next month')}>›</button>
      </div>
      <div className="date-picker-weekdays">{weekDayLabels(true).map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="date-picker-grid">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} />;
          const key = toDateKey(new Date(viewYear, viewMonth, day, 12));
          const outOfRange = Boolean((minDate && key < minDate) || (maxDate && key > maxDate));
          return <button type="button" key={key} disabled={outOfRange} className={`${key === selectedValue ? 'selected' : ''} ${key === today ? 'today' : ''}`} onClick={() => { commit(key); setOpen(false); }}>{day}</button>;
        })}
      </div>
      <div className="date-picker-footer">
        <span><i className="selected-key" />{t('selected')}</span><span><i className="today-key" />{t('today')}</span>
        {!required && selectedValue && <button type="button" onClick={() => { commit(''); setOpen(false); }}>{t('Clear')}</button>}
      </div>
    </div>}
  </div>;
}
