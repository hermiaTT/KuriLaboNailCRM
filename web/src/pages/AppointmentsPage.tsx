import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api } from '../lib/api';
import type { AdminUser, Appointment } from '../types';

type Filter = 'ALL' | Appointment['status'];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    Promise.all([api<Appointment[]>('/api/v1/admin/appointments'), api<AdminUser[]>('/api/v1/admin/users')])
      .then(([nextAppointments, nextClients]) => {
        setAppointments(nextAppointments.sort((a, b) => b.startAt.localeCompare(a.startAt)));
        setClients(nextClients);
      })
      .catch(() => setError('Unable to load appointments.'));
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
      setAppointments((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch {
      setError(`Unable to ${action} this appointment.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page">
      <PageHeading eyebrow="BOOKING DESK" title="Appointments" action={<Link className="primary-button compact" to="/schedule?new=appointment">+ Book for client</Link>} />
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
              <div className="date-block"><strong>{start.getDate()}</strong><small>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start)}</small></div>
              <div className="appointment-main">
                <div><h3>{names.get(appointment.customerId) ?? 'Client'}</h3><StatusBadge status={appointment.status} /></div>
                <p>{appointment.serviceName} · {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(start)} · {appointment.durationMinutes} min</p>
                {appointment.note && <small>“{appointment.note}”</small>}
              </div>
              {appointment.status === 'PENDING_CONFIRMATION' && (
                <div className="row-actions">
                  <button disabled={busy === appointment.id} onClick={() => void review(appointment, 'reject')}>Reject</button>
                  <button className="confirm" disabled={busy === appointment.id} onClick={() => void review(appointment, 'confirm')}>Confirm</button>
                </div>
              )}
            </article>
          );
        })}
      </PaperCard>
    </div>
  );
}
