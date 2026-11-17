import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageHeading, PaperCard, StatusBadge } from '../components/UI';
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
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 42;

function endMinutes(startAt: string, endAt: string, selectedDate: string) {
  if (salonDateKey(endAt) !== selectedDate) return 1440;
  return salonMinutes(endAt);
}

function addMinutesToTime(value: string, minutes: number) {
  const [hoursValue, minutesValue] = value.split(':').map(Number);
  const total = Math.min(1430, hoursValue * 60 + minutesValue + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function formatSlotTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [addingClient, setAddingClient] = useState(false);

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
  const viewStart = COMPACT_START;
  const viewEnd = COMPACT_END;
  const pixelsPerMinute = SLOT_HEIGHT / SLOT_MINUTES;
  const dayHeight = (viewEnd - viewStart) * pixelsPerMinute;
  const hourMarks = Array.from({ length: (viewEnd - viewStart) / 60 + 1 }, (_, index) => viewStart + index * 60);
  const timeSlots = Array.from({ length: (viewEnd - viewStart) / SLOT_MINUTES }, (_, index) => viewStart + index * SLOT_MINUTES);
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
  const clientNames = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const appointmentCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    appointments
      .filter((item) => !['CANCELLED', 'REJECTED'].includes(item.status))
      .forEach((item) => {
        const key = salonDateKey(item.startAt);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    return counts;
  }, [appointments]);
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

  function openAppointmentAt(minute: number) {
    const nextStart = minutesToTime(minute);
    setStartTime(nextStart);
    const service = services.find((item) => item.id === serviceId) ?? services[0];
    setEndTime(addMinutesToTime(nextStart, service?.durationMinutes ?? 120));
    setDialog('appointment');
  }

  function slotIsOccupied(minute: number) {
    const slotEnd = minute + SLOT_MINUTES;
    const hasAppointment = selectedAppointments.some((appointment) => {
      if (['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(appointment.status)) return false;
      const start = salonMinutes(appointment.startAt);
      const end = endMinutes(appointment.startAt, appointment.endAt, selectedDate);
      return start < slotEnd && end > minute;
    });
    const hasBlock = selectedBlocks.some((block) => {
      if (fullDayBlocks.some((fullDayBlock) => fullDayBlock.id === block.id)) return true;
      const start = salonMinutes(block.startAt);
      const end = endMinutes(block.startAt, block.endAt, selectedDate);
      return start < slotEnd && end > minute;
    });
    return hasAppointment || hasBlock;
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
          customerId: selectedCustomerId,
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

  async function addQuickClient() {
    if (!quickClientName.trim() || !quickClientPhone.trim()) {
      setError('Enter the new client’s name and phone number.');
      return;
    }
    setAddingClient(true);
    setError(null);
    try {
      const created = await api<AdminUser>('/api/v1/admin/users/guests', {
        method: 'POST',
        body: JSON.stringify({ name: quickClientName.trim(), phone: quickClientPhone.trim() }),
      });
      setClients((current) => [created, ...current]);
      setSelectedCustomerId(created.id);
      setQuickClientName('');
      setQuickClientPhone('');
      setShowQuickClient(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to add this client.');
    } finally {
      setAddingClient(false);
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
              {monthDays.map((day) => {
                const appointmentCount = appointmentCountByDate.get(day.key) ?? 0;
                return <button key={day.key} className={`${day.key === selectedDate ? 'selected' : ''} ${day.inMonth ? '' : 'outside'}`} onClick={() => setSelectedDate(day.key)}><span>{day.day}</span><small>{appointmentCount ? `${appointmentCount} appt${appointmentCount === 1 ? '' : 's'}` : '\u00a0'}</small><i>{blockDates.has(day.key) && <b className="block-dot" />}</i></button>;
              })}
            </div>
            <button className="today-button" onClick={() => setSelectedDate(todayInSalon())}>Back to today</button>
          </PaperCard>
          <PaperCard className="calendar-legend"><h3>Calendar key</h3><p><i className="appt-dot" />Appointment count appears below each date</p><p><i className="block-dot" />Blocked time</p><p><i className="business-swatch" />Business hours · 9–6</p></PaperCard>
        </aside>

        <section className="day-panel">
          <div className="day-panel-head"><div><p className="eyebrow">DAILY VIEW · 8:00 AM–8:00 PM</p><h2>{longDateLabel(selectedDate)}</h2><p className="slot-grid-note">Click any open 30-minute slot to start a booking.</p></div><div className="day-head-right"><div className="day-summary"><span><strong>{selectedAppointments.length}</strong> appointments</span><span><strong>{selectedBlocks.length}</strong> blocks</span></div></div></div>
          {fullDayBlocks.map((block) => <div className="full-day-banner" key={block.id}><div><span>ALL DAY</span><strong>Studio unavailable</strong><small>{block.reason || 'Full-day block'}</small></div><button className={deleteTarget === block.id ? 'delete-ready' : ''} onClick={() => void removeBlock(block.id)}>{deleteTarget === block.id ? 'Confirm remove' : 'Remove block'}</button></div>)}
          <PaperCard className="timeline-shell">
            <div className="timeline-scroll workday">
              <div className="timeline" style={{ height: dayHeight }}>
                <div className="business-hours" style={{ top: (Math.max(540, viewStart) - viewStart) * pixelsPerMinute, height: Math.max(0, Math.min(1080, viewEnd) - Math.max(540, viewStart)) * pixelsPerMinute }}><span>business hours · 9–6</span></div>
                <div className="time-slot-layer">
                  {timeSlots.map((minute) => {
                    const occupied = slotIsOccupied(minute);
                    return <button type="button" key={minute} className="time-slot" style={{ top: (minute - viewStart) * pixelsPerMinute, height: SLOT_HEIGHT }} disabled={occupied} onClick={() => openAppointmentAt(minute)} aria-label={`${formatSlotTime(minute)} ${occupied ? 'occupied' : 'open — book appointment'}`}><span>{formatSlotTime(minute)}</span><small>{occupied ? 'occupied' : '+ book'}</small></button>;
                  })}
                </div>
                {hourMarks.map((minute) => <div className={`hour-line ${minute === viewEnd ? 'end-hour-line' : ''}`} key={minute} style={{ top: (minute - viewStart) * pixelsPerMinute - (minute === viewEnd ? 1 : 0) }}>{minute === viewEnd && <span>{formatSlotTime(minute)}</span>}</div>)}
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

      {dialog && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><PaperCard className="schedule-modal" ><button className="modal-close" onClick={() => setDialog(null)} aria-label="Close">×</button>{dialog === 'appointment' ? <><p className="eyebrow">NEW APPOINTMENT</p><h2>Book for a client</h2><p className="modal-subtitle">{longDateLabel(selectedDate)} · confirmed immediately</p><form onSubmit={createAppointment}><div className="booking-client-field"><div className="inline-field-head"><span>Client</span><button type="button" onClick={() => setShowQuickClient((value) => !value)}>{showQuickClient ? 'Cancel' : '+ Add client'}</button></div>{showQuickClient && <div className="quick-client-panel"><div className="form-pair"><label>Name<input value={quickClientName} onChange={(event) => setQuickClientName(event.target.value)} maxLength={120} placeholder="Client name" /></label><label>Phone<input value={quickClientPhone} onChange={(event) => setQuickClientPhone(event.target.value)} type="tel" maxLength={40} placeholder="778-555-1234" /></label></div><button className="quick-client-save" type="button" disabled={addingClient} onClick={() => void addQuickClient()}>{addingClient ? 'Adding…' : 'Add and select client'}</button></div>}<select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} required><option value="" disabled>Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone || client.email || 'Guest client'}</option>)}</select></div><label>Service<select value={serviceId} onChange={(event) => updateService(event.target.value)} required>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.durationMinutes} min</option>)}</select></label><div className="form-pair"><label>Start time<input type="time" step="1800" value={startTime} onChange={(event) => updateStart(event.target.value)} required /></label><label>End time<input type="time" step="1800" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label></div><label>Appointment note<textarea name="note" placeholder="Shape, color or special request…" /></label>{clients.length === 0 && !showQuickClient && <div className="form-notice">Add a registered or guest client before booking.</div>}<button className="primary-button" disabled={saving || !selectedCustomerId}>{saving ? 'Saving…' : 'Confirm appointment'}</button></form></> : <><p className="eyebrow">AVAILABILITY</p><h2>Block studio time</h2><p className="modal-subtitle">{longDateLabel(selectedDate)}</p><form onSubmit={createBlock}><label className="check-label"><input type="checkbox" checked={fullDay} onChange={(event) => setFullDay(event.target.checked)} /><span><strong>Block the full day</strong><small>No user bookings will be available.</small></span></label>{!fullDay && <div className="form-pair"><label>Start time<input name="blockStart" type="time" step="1800" defaultValue="12:00" required /></label><label>End time<input name="blockEnd" type="time" step="1800" defaultValue="13:00" required /></label></div>}<label>Reason<textarea name="reason" placeholder="Lunch, holiday, personal time…" /></label><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Block this time'}</button></form></>}</PaperCard></div>}
    </div>
  );
}
