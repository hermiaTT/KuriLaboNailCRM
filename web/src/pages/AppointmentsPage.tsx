import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { addDays, formatSalonTime, todayInSalon } from '../lib/dates';
import { api, ApiError } from '../lib/api';
import type { AdminAppointment, AdminUser, Appointment, NailSet, ServiceDefinition } from '../types';

type Filter = 'ALL' | Appointment['status'];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
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
      .catch(() => setError('Unable to load appointments.'));
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
      setError(cause instanceof ApiError ? cause.message : 'Unable to record this past visit.');
    } finally {
      setSavingHistory(false);
    }
  }

  useEffect(load, []);
  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const visible = filter === 'ALL' ? appointments : appointments.filter((appointment) => appointment.status === filter);

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
      setError(`Unable to ${action} this appointment.`);
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
        body: JSON.stringify({ reason: action === 'approve' ? 'Approved from web workspace' : 'Cancellation request declined' }),
      });
      setAppointments((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch {
      setError(`Unable to ${action} this cancellation request.`);
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
      setError(cause instanceof ApiError ? cause.message : `Unable to ${action === 'complete' ? 'complete' : 'mark no-show for'} this appointment.`);
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
      setError(cause instanceof ApiError ? cause.message : 'Unable to save visit details.');
    } finally {
      setSavingDetails(false);
    }
  }

  const selectedSet = selected ? nailSets.find((item) => item.appointmentId === selected.id) : undefined;

  return (
    <div className="page">
      <PageHeading eyebrow="BOOKING DESK" title="Appointments" action={<div className="heading-actions"><button className="secondary-button" onClick={() => setShowHistory(true)}>Add past visit</button><Link className="primary-button compact" to="/schedule?new=appointment">+ Book for client</Link></div>} />
      <div className="chip-row">
        {(['ALL', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'COMPLETED'] as Filter[]).map((item) => (
          <button className={`chip ${filter === item ? 'active' : ''}`} onClick={() => setFilter(item)} key={item}>{item === 'ALL' ? 'all' : item.toLowerCase().replaceAll('_', ' ')}</button>
        ))}
      </div>
      {error && <div className="form-notice">{error}</div>}
      <PaperCard className="appointment-list">
        {visible.length === 0 ? <EmptyState>No appointments in this view.</EmptyState> : visible.map((appointment) => {
          const start = new Date(appointment.startAt);
          return (
            <article className="appointment-row" key={appointment.id}>
              <div className="date-block"><strong>{new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'America/Vancouver' }).format(start)}</strong><small>{new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'America/Vancouver' }).format(start)}</small></div>
              <div className="appointment-main">
                <div><h3>{names.get(appointment.customerId) ?? 'Client'}</h3><StatusBadge status={appointment.status} /></div>
                <p>{appointment.serviceName} · {formatSalonTime(start)} · {appointment.durationMinutes} min</p>
                {appointment.note && <small>“{appointment.note}”</small>}
              </div>
              <div className="appointment-admin-meta">
                {appointment.finalPrice != null && <span className="price-pill">${Number(appointment.finalPrice).toFixed(2)}</span>}
                <button className="details-button" onClick={() => openDetails(appointment)}>Visit details</button>
              </div>
              {appointment.status === 'PENDING_CONFIRMATION' && (
                <div className="row-actions">
                  <button disabled={busy === appointment.id} onClick={() => void review(appointment, 'reject')}>Reject</button>
                  <button className="confirm" disabled={busy === appointment.id} onClick={() => void review(appointment, 'confirm')}>Confirm</button>
                </div>
              )}
              {appointment.status === 'CANCELLATION_REQUESTED' && (
                <div className="row-actions cancellation-actions">
                  <button disabled={busy === appointment.id} onClick={() => void reviewCancellation(appointment, 'reject')}>Keep appointment</button>
                  <button className="confirm cancel-approve" disabled={busy === appointment.id} onClick={() => void reviewCancellation(appointment, 'approve')}>Approve cancellation</button>
                </div>
              )}
              {appointment.status === 'CONFIRMED' && new Date(appointment.startAt).getTime() <= Date.now() && (
                <div className="row-actions">
                  <button disabled={busy === appointment.id} onClick={() => void closeVisit(appointment, 'no-show')}>No show</button>
                  <button className="confirm" disabled={busy === appointment.id || new Date(appointment.endAt).getTime() > Date.now()} onClick={() => void closeVisit(appointment, 'complete')}>Complete</button>
                </div>
              )}
            </article>
          );
        })}
      </PaperCard>
      {showHistory && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHistory(false); }}>
        <PaperCard className="schedule-modal history-appointment-modal">
          <button className="modal-close" onClick={() => setShowHistory(false)} aria-label="Close">×</button>
          <p className="eyebrow">OFFLINE APPOINTMENT</p>
          <h2>Record a past visit</h2>
          <p className="modal-subtitle">This creates a completed client history record and does not block the schedule.</p>
          <form onSubmit={recordHistory}>
            <label>Client<select name="customerId" required defaultValue=""><option value="" disabled>Select a client</option>{clients.filter((client) => client.role === 'USER').map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone || 'No phone'}</option>)}</select></label>
            <label>Service<select value={historyServiceId} onChange={(event) => setHistoryServiceId(event.target.value)} required>{services.map((service) => <option key={service.id} value={service.id}>{service.name}{service.active ? '' : ' · archived'}</option>)}<option value="CUSTOM">Custom / legacy service</option></select></label>
            {historyServiceId === 'CUSTOM' && <label>Service name<input name="customServiceName" maxLength={120} placeholder="Legacy gel set" required /></label>}
            <label>Visit date<input name="date" type="date" defaultValue={addDays(todayInSalon(), -1)} max={todayInSalon()} required /></label>
            <div className="form-pair"><label>Start time<input name="startTime" type="time" step="1800" defaultValue="10:00" required /></label><label>End time<input name="endTime" type="time" step="1800" defaultValue="12:00" required /></label></div>
            <label>Final price (CAD) <span className="optional">optional</span><div className="money-input"><span>$</span><input name="finalPrice" type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" placeholder="0.00" /></div></label>
            <label>Internal service notes <span className="optional">admin only</span><textarea name="serviceNotes" maxLength={5000} placeholder="Products, colors, technique or anything to remember…" /></label>
            <div className="history-record-note">Saved as Completed · visible in the client's Past appointments · photos can be linked afterward</div>
            <button className="primary-button" disabled={savingHistory}>{savingHistory ? 'Saving record…' : 'Save past visit'}</button>
          </form>
        </PaperCard>
      </div>}
      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <PaperCard className="visit-details-modal">
          <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
          <p className="eyebrow">ADMIN ONLY</p>
          <h2>Visit details</h2>
          <p className="modal-subtitle">Private salon notes and pricing are never shown to the client.</p>
          <div className="visit-summary">
            <div><span>Client</span><strong>{names.get(selected.customerId) ?? 'Client'}</strong></div>
            <div><span>Service</span><strong>{selected.serviceName}</strong></div>
            <div><span>When</span><strong>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(selected.startAt))} · {formatSalonTime(new Date(selected.startAt))}</strong></div>
          </div>
          <form onSubmit={saveDetails}>
            <label>Final price (CAD)<div className="money-input"><span>$</span><input type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" /></div></label>
            <label>Internal service notes <span className="optional">admin only</span><textarea value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} maxLength={5000} placeholder="Products, colors, technique, adjustments…" /></label>
            <button className="primary-button" disabled={savingDetails}>{savingDetails ? 'Saving…' : 'Save visit details'}</button>
          </form>
          <div className="visit-photo-section">
            <div><p className="eyebrow">NAIL SET</p><h3>{selectedSet ? `${selectedSet.images.length} linked photo${selectedSet.images.length === 1 ? '' : 's'}` : 'No photos linked yet'}</h3></div>
            {selectedSet?.images[0] && <img src={selectedSet.images[0].url} alt={selectedSet.title} />}
            <Link className="details-button" to={`/inspiration?appointmentId=${selected.id}`}>{selectedSet ? 'Manage photos' : '+ Add photos'}</Link>
          </div>
        </PaperCard>
      </div>}
    </div>
  );
}
