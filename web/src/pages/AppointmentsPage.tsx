import { statusLabel, t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { addDays, calendarDays, formatSalonTime, longDateLabel, monthLabel, parseDateKey, salonDateKey, todayInSalon } from '../lib/dates';
import { api, ApiError } from '../lib/api';
import type { AdminAppointment, AdminUser, Appointment, NailSet, ServiceDefinition } from '../types';

type Filter = 'ALL' | Appointment['status'];
type ViewMode = 'LIST' | 'CALENDAR';

export function AppointmentsPage() {
  useLanguage();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [calendarDate, setCalendarDate] = useState(todayInSalon());
  const [selectedDate, setSelectedDate] = useState(todayInSalon());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [price, setPrice] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyServiceId, setHistoryServiceId] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  function load() {
    Promise.all([
      api<AdminAppointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
      api<NailSet[]>('/api/v1/inspiration'),
      api<ServiceDefinition[]>('/api/v1/admin/services'),
    ])
      .then(([nextAppointments, nextClients, nextNailSets, nextServices]) => {
        setAppointments(nextAppointments.sort((a, b) => b.startAt.localeCompare(a.startAt)));
        setClients(nextClients);
        setNailSets(nextNailSets);
        setServices(nextServices);
        setHistoryServiceId((current) => current || nextServices[0]?.id || 'CUSTOM');
      })
      .catch(() => setError("Unable to load appointments."));
  }

  async function recordHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSavingHistory(true);
    setError(null);
    try {
      const created = await api<AdminAppointment>('/api/v1/admin/appointments/history', {
        method: 'POST',
        body: JSON.stringify({
          customerId: data.get('customerId'),
          serviceId: historyServiceId === 'CUSTOM' ? null : historyServiceId,
          customServiceName: historyServiceId === 'CUSTOM' ? data.get('customServiceName') : null,
          date: data.get('date'),
          startTime: data.get('startTime'),
          endTime: data.get('endTime'),
          finalPrice: String(data.get('finalPrice') || '').trim() === '' ? null : Number(data.get('finalPrice')),
          serviceNotes: data.get('serviceNotes') || null,
        }),
      });
      setAppointments((current) => [created, ...current].sort((a, b) => b.startAt.localeCompare(a.startAt)));
      setShowHistory(false);
      setFilter('COMPLETED');
      form.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to record this past visit.");
    } finally {
      setSavingHistory(false);
    }
  }

  useEffect(load, []);
  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const visible = filter === 'ALL' ? appointments : appointments.filter((appointment) => appointment.status === filter);
  const monthDays = useMemo(() => calendarDays(calendarDate), [calendarDate]);
  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, AdminAppointment[]>();
    visible.forEach((appointment) => {
      const key = salonDateKey(appointment.startAt);
      grouped.set(key, [...(grouped.get(key) ?? []), appointment]);
    });
    grouped.forEach((items) => items.sort((a, b) => a.startAt.localeCompare(b.startAt)));
    return grouped;
  }, [visible]);
  const selectedDayAppointments = appointmentsByDate.get(selectedDate) ?? [];

  function moveCalendarMonth(amount: number) {
    const next = parseDateKey(calendarDate);
    next.setMonth(next.getMonth() + amount, 1);
    const key = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
    setCalendarDate(key);
    setSelectedDate(key);
  }

  async function review(appointment: Appointment, action: 'confirm' | 'reject') {
    setBusy(appointment.id);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${appointment.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: action === 'reject' ? 'Rejected from web workspace' : null }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch {
      setError("Unable to update this appointment.");
    } finally {
      setBusy(null);
    }
  }

  async function reviewCancellation(appointment: Appointment, action: 'approve' | 'reject') {
    setBusy(appointment.id);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${appointment.id}/cancellation-requests/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: action === 'approve' ? 'Approved from web workspace' : t("Cancellation request declined") }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch {
      setError("Unable to update this cancellation request.");
    } finally {
      setBusy(null);
    }
  }

  async function closeVisit(appointment: Appointment, action: 'complete' | 'no-show') {
    setBusy(appointment.id);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${appointment.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: action === 'complete' ? 'Completed from web workspace' : 'Marked no-show from web workspace' }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to update this appointment.");
    } finally {
      setBusy(null);
    }
  }

  function openDetails(appointment: AdminAppointment) {
    setSelected(appointment);
    setPrice(appointment.finalPrice == null ? '' : Number(appointment.finalPrice).toFixed(2));
    setServiceNotes(appointment.serviceNotes ?? '');
    setError(null);
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSavingDetails(true);
    setError(null);
    try {
      const updated = await api<AdminAppointment>(`/api/v1/admin/appointments/${selected.id}/visit-details`, {
        method: 'PUT',
        body: JSON.stringify({
          finalPrice: price.trim() === '' ? null : Number(price),
          serviceNotes: serviceNotes.trim() || null,
        }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save visit details.");
    } finally {
      setSavingDetails(false);
    }
  }

  const selectedSet = selected ? nailSets.find((item) => item.appointmentId === selected.id) : undefined;

  function appointmentRow(appointment: AdminAppointment, compact = false) {
    const start = new Date(appointment.startAt);
    return (
      <article className={`appointment-row ${compact ? 'calendar-agenda-row' : ''}`} key={appointment.id}>
        {!compact && <div className="date-block"><strong>{new Intl.DateTimeFormat(getLocale(), { day: 'numeric', timeZone: 'America/Vancouver' }).format(start)}</strong><small>{new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'America/Vancouver' }).format(start)}</small></div>}
        <div className="appointment-time-block"><strong>{formatSalonTime(start)}</strong><small>{appointment.durationMinutes} {t("min")}</small></div>
        <div className="appointment-main">
          <div><h3>{appointment.customerName ?? names.get(appointment.customerId) ?? t("Client")}</h3><StatusBadge status={appointment.status} /></div>
          <p>{appointment.serviceName}</p>
          {appointment.note && <small>{t("Client: “")}{appointment.note}”</small>}
          {appointment.serviceNotes && <small className="admin-note-preview">{t("Admin note:")}{appointment.serviceNotes}</small>}
          {appointment.referenceImages.length > 0 && <div className="appointment-reference-strip">{appointment.referenceImages.map((image) => <span key={image.id}><img src={image.url} alt={t("Client reference")} /><a href={`${image.url}?download=true`} download aria-label={t("Download reference photo")}>🐾</a></span>)}</div>}
        </div>
        <div className="appointment-admin-meta">
          {appointment.finalPrice != null && <span className="price-pill">${Number(appointment.finalPrice).toFixed(2)}</span>}
          <button className="details-button" onClick={() => openDetails(appointment)}>{t("Visit details")}</button>
        </div>
        {appointment.status === 'PENDING_CONFIRMATION' && <div className="row-actions"><button disabled={busy === appointment.id} onClick={() => void review(appointment, 'reject')}>{t("Reject")}</button><button className="confirm" disabled={busy === appointment.id} onClick={() => void review(appointment, 'confirm')}>{t("Confirm")}</button></div>}
        {appointment.status === 'CANCELLATION_REQUESTED' && <div className="row-actions cancellation-actions"><button disabled={busy === appointment.id} onClick={() => void reviewCancellation(appointment, 'reject')}>{t("Keep appointment")}</button><button className="confirm cancel-approve" disabled={busy === appointment.id} onClick={() => void reviewCancellation(appointment, 'approve')}>{t("Approve cancellation")}</button></div>}
        {appointment.status === 'CONFIRMED' && new Date(appointment.startAt).getTime() <= Date.now() && <div className="row-actions"><button disabled={busy === appointment.id} onClick={() => void closeVisit(appointment, 'no-show')}>{t("No show")}</button><button className="confirm" disabled={busy === appointment.id || new Date(appointment.endAt).getTime() > Date.now()} onClick={() => void closeVisit(appointment, 'complete')}>{t("Complete")}</button></div>}
      </article>
    );
  }

  return (
    <div className="page">
      <PageHeading eyebrow={t("BOOKING DESK")} title={t("Appointments")} action={<div className="heading-actions"><button className="secondary-button" onClick={() => setShowHistory(true)}>{t("Add past visit")}</button><button className="primary-button compact" onClick={() => setViewMode((current) => current === 'LIST' ? 'CALENDAR' : 'LIST')}>{viewMode === 'LIST' ? t("Switch to calendar view") : t("Switch to list view")}</button></div>} />
      <div className="chip-row">
        {(['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'COMPLETED'] as Filter[]).map((item) => (
          <button className={`chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} key={item}>{statusLabel(item)}</button>
        ))}
      </div>
      {error && <div className="form-notice">{t(error)}</div>}
      {viewMode === 'LIST' ? <PaperCard className="appointment-list">
        {visible.length === 0 ? <EmptyState>{t("No appointments in this view.")}</EmptyState> : visible.map((appointment) => appointmentRow(appointment))}
      </PaperCard> : <div className="appointment-calendar-view">
        <PaperCard className="appointment-month-calendar">
          <div className="appointment-calendar-head"><button onClick={() => moveCalendarMonth(-1)} aria-label={t("Previous month")}>‹</button><div><p>{monthLabel(calendarDate)}</p><small>{visible.length} {t("appointments in current filter")}</small></div><button onClick={() => moveCalendarMonth(1)} aria-label={t("Next month")}>›</button></div>
          <div className="appointment-weekdays">{[t("Sun"),t("Mon"),t("Tue"),t("Wed"),t("Thu"),t("Fri"),t("Sat")].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="appointment-calendar-grid">{monthDays.map((day) => {
            const dayItems = appointmentsByDate.get(day.key) ?? [];
            return <div key={day.key} role="button" tabIndex={0} aria-label={t("View {date} schedule", { date: day.key })} className={`calendar-day-cell ${day.inMonth ? '' : 'outside'} ${day.key === selectedDate ? 'selected' : ''} ${day.key === todayInSalon() ? 'today' : ''}`} onClick={() => setSelectedDate(day.key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedDate(day.key); }}><span className="calendar-day-number">{day.day}</span><div className="calendar-day-events">{dayItems.slice(0, 3).map((appointment) => { const customerName = appointment.customerName ?? names.get(appointment.customerId) ?? t("Client"); return <button type="button" className={`calendar-mini-event status-${appointment.status.toLowerCase()}`} key={appointment.id} title={t("Open {name} visit details", { name: customerName })} onClick={(event) => { event.stopPropagation(); setSelectedDate(day.key); openDetails(appointment); }}><strong>{formatSalonTime(appointment.startAt)}</strong><span>{customerName}</span></button>; })}{dayItems.length > 3 && <small>+{dayItems.length - 3} {t("more")}</small>}</div></div>;
          })}</div>
        </PaperCard>
        <section className="calendar-day-agenda"><div className="calendar-agenda-head"><div><p className="eyebrow">{t("DAY SCHEDULE")}</p><h2>{longDateLabel(selectedDate)}</h2></div><span>{selectedDayAppointments.length} {t("appointment")}{getLocale() === 'en-US' && selectedDayAppointments.length !== 1 ? 's' : ''}</span></div><PaperCard className="appointment-list calendar-agenda-list">{selectedDayAppointments.length === 0 ? <EmptyState>{t("A clear day — no appointments.")}</EmptyState> : selectedDayAppointments.map((appointment) => appointmentRow(appointment, true))}</PaperCard></section>
      </div>}
      {showHistory && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHistory(false); }}>
        <PaperCard className="schedule-modal history-appointment-modal">
          <button className="modal-close" onClick={() => setShowHistory(false)} aria-label={t("Close")}>×</button>
          <p className="eyebrow">{t("OFFLINE APPOINTMENT")}</p>
          <h2>{t("Record a past visit")}</h2>
          <p className="modal-subtitle">{t("This creates a completed client history record and does not block the schedule.")}</p>
          <form onSubmit={recordHistory}>
            <label>{t("Client")}<select name="customerId" required defaultValue=""><option value="" disabled>{t("Select a client")}</option>{clients.filter((client) => client.role === 'USER').map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone || t("No phone")}</option>)}</select></label>
            <label>{t("Service")}<select value={historyServiceId} onChange={(event) => setHistoryServiceId(event.target.value)} required>{services.map((service) => <option key={service.id} value={service.id}>{service.name}{service.active ? '' : t(" · archived")}</option>)}<option value="CUSTOM">{t("Custom / legacy service")}</option></select></label>
            {historyServiceId === 'CUSTOM' && <label>{t("Service name")}<input name="customServiceName" maxLength={120} placeholder="Legacy gel set" required /></label>}
            <label>{t("Visit date")}<input name="date" type="date" defaultValue={addDays(todayInSalon(), -1)} max={todayInSalon()} required /></label>
            <div className="form-pair"><label>{t("Start time")}<input name="startTime" type="time" step="300" defaultValue="10:00" required /></label><label>{t("End time")}<input name="endTime" type="time" step="300" defaultValue="12:00" required /></label></div>
            <label>{t("Final price (CAD)")}<span className="optional">{t("optional")}</span><div className="money-input"><span>$</span><input name="finalPrice" type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" placeholder="0.00" /></div></label>
            <label>{t("Internal service notes")}<span className="optional">{t("admin only")}</span><textarea name="serviceNotes" maxLength={5000} placeholder={t("Products, colors, technique or anything to remember…")} /></label>
            <div className="history-record-note">{t("Saved as Completed · visible in the client's Past appointments · photos can be linked afterward")}</div>
            <button className="primary-button" disabled={savingHistory}>{savingHistory ? t("Saving record…") : t("Save past visit")}</button>
          </form>
        </PaperCard>
      </div>}
      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <PaperCard className="visit-details-modal">
          <button className="modal-close" onClick={() => setSelected(null)} aria-label={t("Close")}>×</button>
          <p className="eyebrow">{t("ADMIN ONLY")}</p>
          <h2>{t("Visit details")}</h2>
          <p className="modal-subtitle">{t("Private salon notes and pricing are never shown to the client.")}</p>
          <div className="visit-summary">
            <div><span>{t("Client")}</span><strong>{names.get(selected.customerId) ?? t("Client")}</strong></div>
            <div><span>{t("Service")}</span><strong>{selected.serviceName}</strong></div>
            <div><span>{t("When")}</span><strong>{new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(selected.startAt))} · {formatSalonTime(new Date(selected.startAt))}</strong></div>
          </div>
          <form onSubmit={saveDetails}>
            <label>{t("Final price (CAD)")}<div className="money-input"><span>$</span><input type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" /></div></label>
            <label>{t("Internal service notes")}<span className="optional">{t("admin only")}</span><textarea value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} maxLength={5000} placeholder={t("Products, colors, technique, adjustments…")} /></label>
            <button className="primary-button" disabled={savingDetails}>{savingDetails ? t("Saving…") : t("Save visit details")}</button>
          </form>
          {selected.referenceImages.length > 0 && <div className="visit-reference-section"><p className="eyebrow">{t("CLIENT REFERENCES")}</p><div className="appointment-reference-strip large">{selected.referenceImages.map((image) => <span key={image.id}><img src={image.url} alt={t("Client reference")} /><a href={`${image.url}?download=true`} download aria-label={t("Download reference photo")}>🐾</a></span>)}</div></div>}
          <div className="visit-photo-section">
            <div><p className="eyebrow">{t("NAIL SET")}</p><h3>{selectedSet ? t("{count} linked photos", { count: selectedSet.images.length }) : t("No photos linked yet")}</h3></div>
            {selectedSet?.images[0] && <img src={selectedSet.images[0].url} alt={selectedSet.title} />}
            <Link className="details-button" to={`/inspiration?appointmentId=${selected.id}`}>{selectedSet ? t("Manage photos") : t("+ Add photos")}</Link>
          </div>
        </PaperCard>
      </div>}
    </div>
  );
}
