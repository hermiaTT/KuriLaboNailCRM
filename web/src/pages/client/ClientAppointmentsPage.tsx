import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../../components/UI';
import { formatSalonTime } from '../../lib/dates';
import { api } from '../../lib/api';
import type { Appointment } from '../../types';

export function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Appointment[]>('/api/v1/appointments/me').then(setAppointments).finally(() => setLoading(false));
  }, []);

  return <div className="client-page"><PageHeading eyebrow="YOUR VISITS" title="My appointments" action={<Link className="primary-button compact" to="/client/book">+ Book</Link>} /><PaperCard className="client-appointment-list">{!loading && appointments.length === 0 ? <EmptyState>No appointments yet. Your first Kuri Labo visit can start here.</EmptyState> : appointments.map((appointment) => { const start = new Date(appointment.startAt); return <article key={appointment.id}><div className="date-block"><strong>{start.getDate()}</strong><small>{new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'America/Vancouver' }).format(start)}</small></div><div className="client-appt-copy"><div><h3>{appointment.serviceName}</h3><StatusBadge status={appointment.status} /></div><p>{formatSalonTime(start)} · {appointment.durationMinutes} minutes</p>{appointment.note && <small>{appointment.note}</small>}</div></article>; })}</PaperCard></div>;
}
