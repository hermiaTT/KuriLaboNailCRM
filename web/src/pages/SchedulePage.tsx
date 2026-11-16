import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api, ApiError } from '../lib/api';
import {
  addDays,
  calendarDays,
  formatSalonTime,
  longDateLabel,
  monthLabel,
  parseDateKey,
  salonDateKey,
  salonMinutes,
  todayInSalon,
} from '../lib/dates';
import type { AdminUser, Appointment, AvailabilityBlock, ServiceDefinition } from '../types';

type DialogType = 'appointment' | 'block' | null;
const COMPACT_START = 8 * 60;
const COMPACT_END = 20 * 60;

function endMinutes(startAt: string, endAt: string, selectedDate: string) {
  if (salonDateKey(endAt) !== selectedDate) return 1440;
  return salonMinutes(endAt);
}

function formatHour(hour: number) {
  if (hour === 24) return '12 AM';
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function addMinutesToTime(value: string, minutes: number) {
  const [hoursValue, minutesValue] = value.split(':').map(Number);
  const total = Math.min(1430, hoursValue * 60 + minutesValue + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(todayInSalon());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [fullDay, setFullDay] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [fullDayView, setFullDayView] = useState(false);

  const monthDays = useMemo(() => calendarDays(selectedDate), [selectedDate]);

  function loadCore() {
    return Promise.all([
      api<Appointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
      api<ServiceDefinition[]>('/api/v1/admin/services'),
    ]).then(([nextAppointments, nextUsers, nextServices]) => {
      setAppointments(nextAppointments);
      setClients(nextUsers.filter((user) => user.role === 'USER' && user.status === 'ACTIVE'));
      setServices(nextServices.filter((service) => service.active));
    });
  }

  function loadBlocks() {
    const from = monthDays[0].key;
    const to = monthDays[monthDays.length - 1].key;
    return api<AvailabilityBlock[]>(`/api/v1/admin/availability-blocks?from=${from}&to=${to}`).then(setBlocks);
  }

  useEffect(() => {
    loadCore().catch(() => setError('Unable to load the studio schedule.'));
  }, []);

  useEffect(() => {
    loadBlocks().catch(() => setError('Unable to load blocked times.'));
  }, [monthDays[0].key, monthDays[monthDays.length - 1].key]);

  useEffect(() => {
    if (searchParams.get('new') === 'appointment') {
      setDialog('appointment');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!serviceId && services[0]) {
      setServiceId(services[0].id);
      setEndTime(addMinutesToTime(startTime, services[0].durationMinutes));
    }
  }, [services, serviceId, startTime]);

  const selectedAppointments = appointments
    .filter((appointment) => salonDateKey(appointment.startAt) === selectedDate)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const selectedBlocks = blocks
    .filter((block) => salonDateKey(block.startAt) === selectedDate)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const fullDayBlocks = selectedBlocks.filter((block) =>
    salonMinutes(block.startAt) === 0
    && salonMinutes(block.endAt) === 0
    && salonDateKey(block.endAt) === addDays(selectedDate, 1)
  );
  const timedBlocks = selectedBlocks.filter((block) => !fullDayBlocks.some((fullDayBlock) => fullDayBlock.id === block.id));
  const viewStart = fullDayView ? 0 : COMPACT_START;
  const viewEnd = fullDayView ? 1440 : COMPACT_END;
  const pixelsPerMinute = fullDayView ? 0.65 : 0.86;
  const dayHeight = (viewEnd - viewStart) * pixelsPerMinute;
  const hourMarks = Array.from({ length: (viewEnd - viewStart) / 60 + 1 }, (_, index) => viewStart + index * 60);
  const halfHourMarks = Array.from({ length: (viewEnd - viewStart) / 60 }, (_, index) => viewStart + index * 60 + 30);
  const visibleAppointments = selectedAppointments.filter((appointment) => {
    const start = salonMinutes(appointment.startAt);
    const end = endMinutes(appointment.startAt, appointment.endAt, selectedDate);
    return start < viewEnd && end > viewStart;
  });
  const visibleBlocks = timedBlocks.filter((block) => {
    const start = salonMinutes(block.startAt);
    const end = endMinutes(block.startAt, block.endAt, selectedDate);
    return start < viewEnd && end > viewStart;
  });
  const outsideCount = (selectedAppointments.length - visibleAppointments.length) + (timedBlocks.length - visibleBlocks.length);
  const clientNames = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const appointmentDates = useMemo(() => new Set(appointments.map((item) => salonDateKey(item.startAt))), [appointments]);
  const blockDates = useMemo(() => new Set(blocks.map((item) => salonDateKey(item.startAt))), [blocks]);

  function moveMonth(amount: number) {
    const next = parseDateKey(selectedDate);
    next.setMonth(next.getMonth() + amount, 1);
    setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`);
  }

  function updateService(nextId: string) {
    setServiceId(nextId);
    const service = services.find((item) => item.id === nextId);
    if (service) setEndTime(addMinutesToTime(startTime, service.durationMinutes));
  }

  function updateStart(nextStart: string) {
    setStartTime(nextStart);
    const service = services.find((item) => item.id === serviceId);
    if (service) setEndTime(addMinutesToTime(nextStart, service.durationMinutes));
  }

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api('/api/v1/admin/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: data.get('customerId'),
          serviceId,
          customServiceName: null,
          date: selectedDate,
          startTime,
          endTime,
          note: data.get('note') || null,
        }),
      });
      await loadCore();
      setDialog(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create this appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function createBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api('/api/v1/admin/availability-blocks', {
        method: 'POST',
        body: JSON.stringify({
          date: selectedDate,
          fullDay,
          startTime: fullDay ? null : data.get('blockStart'),
          endTime: fullDay ? null : data.get('blockEnd'),
          reason: data.get('reason') || null,
        }),
      });
      await loadBlocks();
      setDialog(null);
      setFullDay(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to block this time.');
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(blockId: string) {
    if (deleteTarget !== blockId) {
      setDeleteTarget(blockId);
      return;
    }
    try {
      await api(`/api/v1/admin/availability-blocks/${blockId}`, { method: 'DELETE' });
      setBlocks((current) => current.filter((block) => block.id !== blockId));
      setDeleteTarget(null);
    } catch {
      setError('Unable to remove this blocked time.');
    }
  }

  return (
    <div className="page schedule-page">
      <PageHeading
        eyebrow="STUDIO CALENDAR · VANCOUVER TIME"
        title="Studio schedule"
        action={<div className="heading-actions"><button className="secondary-button" onClick={() => setDialog('block')}>Block time</button><button className="primary-button compact" onClick={() => setDialog('appointment')}>+ Book for client</button></div>}
      />
      {error && <div className="form-notice schedule-notice"><span>{error}</span><button onClick={() => setError(null)}>×</button></div>}

      <div className="schedule-layout">
        <aside className="calendar-panel">
          <PaperCard className="month-card">
            <div className="month-head"><button onClick={() => moveMonth(-1)} aria-label="Previous month">‹</button><h2>{monthLabel(selectedDate)}</h2><button onClick={() => moveMonth(1)} aria-label="Next month">›</button></div>
            <div className="weekday-row">{['S','M','T','W','T','F','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
            <div className="month-grid">
              {monthDays.map((day) => <button key={day.key} className={`${day.key === selectedDate ? 'selected' : ''} ${day.inMonth ? '' : 'outside'}`} onClick={() => setSelectedDate(day.key)}><span>{day.day}</span><i>{appointmentDates.has(day.key) && <b className="appt-dot" />}{blockDates.has(day.key) && <b className="block-dot" />}</i></button>)}
            </div>
            <button className="today-button" onClick={() => setSelectedDate(todayInSalon())}>Back to today</button>
          </PaperCard>
          <PaperCard className="calendar-legend"><h3>Calendar key</h3><p><i className="appt-dot" />Appointment</p><p><i className="block-dot" />Blocked time</p><p><i className="business-swatch" />Business hours · 9–6</p></PaperCard>
        </aside>

        <section className="day-panel">
          <div className="day-panel-head"><div><p className="eyebrow">DAILY VIEW</p><h2>{longDateLabel(selectedDate)}</h2></div><div className="day-head-right"><div className="day-summary"><span><strong>{selectedAppointments.length}</strong> appointments</span><span><strong>{selectedBlocks.length}</strong> blocks</span></div><button className={`view-toggle ${fullDayView ? 'active' : ''}`} onClick={() => setFullDayView((value) => !value)}>{fullDayView ? 'Workday view' : `Full day${outsideCount ? ` · ${outsideCount} outside` : ''}`}</button></div></div>
          {fullDayBlocks.map((block) => <div className="full-day-banner" key={block.id}><div><span>ALL DAY</span><strong>Studio unavailable</strong><small>{block.reason || 'Full-day block'}</small></div><button className={deleteTarget === block.id ? 'delete-ready' : ''} onClick={() => void removeBlock(block.id)}>{deleteTarget === block.id ? 'Confirm remove' : 'Remove block'}</button></div>)}
          <PaperCard className="timeline-shell">
            {visibleAppointments.length === 0 && visibleBlocks.length === 0 && <div className="timeline-empty"><EmptyState>{fullDayBlocks.length ? 'No appointments—this day is blocked for clients.' : 'A clear day. Add an appointment or block some studio time.'}</EmptyState></div>}
            <div className={`timeline-scroll ${fullDayView ? 'full-day' : 'workday'}`}>
              <div className="timeline" style={{ height: dayHeight }}>
                <div className="business-hours" style={{ top: (Math.max(540, viewStart) - viewStart) * pixelsPerMinute, height: Math.max(0, Math.min(1080, viewEnd) - Math.max(540, viewStart)) * pixelsPerMinute }}><span>business hours · 9–6</span></div>
                {halfHourMarks.map((minute) => <div className="half-hour-line" key={minute} style={{ top: (minute - viewStart) * pixelsPerMinute }} />)}
                {hourMarks.map((minute) => <div className="hour-line" key={minute} style={{ top: (minute - viewStart) * pixelsPerMinute }}><span>{formatHour(minute / 60)}</span></div>)}
                <div className="event-layer">
                  {visibleBlocks.map((block) => {
                    const start = Math.max(salonMinutes(block.startAt), viewStart);
                    const end = Math.min(endMinutes(block.startAt, block.endAt, selectedDate), viewEnd);
                    return <article className="timeline-event block-event" key={block.id} style={{ top: (start - viewStart) * pixelsPerMinute, height: Math.max(34, (end - start) * pixelsPerMinute) }}><div><strong>Blocked time</strong><span>{block.reason || 'Unavailable'} · {formatSalonTime(block.startAt)}–{formatSalonTime(block.endAt)}</span></div><button className={deleteTarget === block.id ? 'delete-ready' : ''} onClick={() => void removeBlock(block.id)}>{deleteTarget === block.id ? 'Confirm remove' : 'Remove'}</button></article>;
                  })}
                  {visibleAppointments.map((appointment) => {
                    const start = Math.max(salonMinutes(appointment.startAt), viewStart);
                    const end = Math.min(endMinutes(appointment.startAt, appointment.endAt, selectedDate), viewEnd);
                    return <article className={`timeline-event appointment-event event-${appointment.status.toLowerCase()}`} key={appointment.id} style={{ top: (start - viewStart) * pixelsPerMinute, height: Math.max(42, (end - start) * pixelsPerMinute) }}><div className="event-copy"><div><strong>{clientNames.get(appointment.customerId) ?? 'Client'}</strong><StatusBadge status={appointment.status} /></div><span>{appointment.serviceName} · {formatSalonTime(appointment.startAt)}–{formatSalonTime(appointment.endAt)}</span>{appointment.note && <small>{appointment.note}</small>}</div></article>;
                  })}
                </div>
              </div>
            </div>
          </PaperCard>
        </section>
      </div>

      {dialog && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><PaperCard className="schedule-modal" ><button className="modal-close" onClick={() => setDialog(null)} aria-label="Close">×</button>{dialog === 'appointment' ? <><p className="eyebrow">NEW APPOINTMENT</p><h2>Book for a client</h2><p className="modal-subtitle">{longDateLabel(selectedDate)} · confirmed immediately</p><form onSubmit={createAppointment}><label>Client<select name="customerId" required defaultValue=""><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.email}</option>)}</select></label><label>Service<select value={serviceId} onChange={(event) => updateService(event.target.value)} required>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.durationMinutes} min</option>)}</select></label><div className="form-pair"><label>Start time<input type="time" step="1800" value={startTime} onChange={(event) => updateStart(event.target.value)} required /></label><label>End time<input type="time" step="1800" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label></div><label>Appointment note<textarea name="note" placeholder="Shape, color or special request…" /></label>{clients.length === 0 && <div className="form-notice">Create an active customer account before booking.</div>}<button className="primary-button" disabled={saving || clients.length === 0}>{saving ? 'Saving…' : 'Confirm appointment'}</button></form></> : <><p className="eyebrow">AVAILABILITY</p><h2>Block studio time</h2><p className="modal-subtitle">{longDateLabel(selectedDate)}</p><form onSubmit={createBlock}><label className="check-label"><input type="checkbox" checked={fullDay} onChange={(event) => setFullDay(event.target.checked)} /><span><strong>Block the full day</strong><small>No user bookings will be available.</small></span></label>{!fullDay && <div className="form-pair"><label>Start time<input name="blockStart" type="time" step="1800" defaultValue="12:00" required /></label><label>End time<input name="blockEnd" type="time" step="1800" defaultValue="13:00" required /></label></div>}<label>Reason<textarea name="reason" placeholder="Lunch, holiday, personal time…" /></label><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Block this time'}</button></form></>}</PaperCard></div>}
    </div>
  );
}
