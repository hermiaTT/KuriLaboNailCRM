import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import type { AdminUser, Appointment } from '../types';
import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { Icon } from '../components/Icons';

function dayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Appointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
    ])
      .then(([nextAppointments, nextClients]) => {
        setAppointments(nextAppointments);
        setClients(nextClients.filter((client) => client.role === 'USER'));
      })
      .catch(() => setError('The dashboard could not load. Make sure the Spring Boot API is running.'));
  }, []);

  const today = dayKey(new Date());
  const todayAppointments = appointments
    .filter((appointment) => dayKey(new Date(appointment.startAt)) === today)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const pending = appointments.filter((appointment) => appointment.status === 'PENDING_CONFIRMATION').length;
  const confirmed = appointments.filter((appointment) => appointment.status === 'CONFIRMED').length;
  const clientNames = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);

  return (
    <div className="page dashboard-page">
      <PageHeading
        eyebrow={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
        title={`${dayGreeting()}, ${user?.name?.split(' ')[0] ?? 'Kuri'} ✨`}
        action={<Link className="primary-button compact" to="/appointments">View appointments</Link>}
      />
      {error && <div className="form-notice">{error}</div>}
      <section className="stat-grid">
        <PaperCard className="stat-card pink"><span className="stat-doodle">✿</span><strong>{todayAppointments.length}</strong><h3>today</h3><p>{pending} waiting to confirm</p></PaperCard>
        <PaperCard className="stat-card blue"><span className="stat-doodle">✦</span><strong>{confirmed}</strong><h3>confirmed</h3><p>upcoming visits</p></PaperCard>
        <PaperCard className="stat-card green"><span className="stat-doodle">☆</span><strong>{clients.length}</strong><h3>clients</h3><p>in your studio</p></PaperCard>
        <PaperCard className="stat-card yellow"><span className="stat-doodle">♡</span><strong>—</strong><h3>uploads</h3><p>coming in the media phase</p></PaperCard>
      </section>

      <div className="dashboard-grid">
        <section>
          <div className="section-title"><h2>Today's schedule</h2><Link to="/appointments">see all</Link></div>
          <PaperCard className="list-card">
            {todayAppointments.length === 0 ? <EmptyState>No appointments today—enjoy the breathing room.</EmptyState> : todayAppointments.slice(0, 5).map((appointment) => (
              <div className="list-row" key={appointment.id}>
                <div className="time-tile"><strong>{formatTime(appointment.startAt)}</strong><small>{appointment.durationMinutes} min</small></div>
                <div className="row-copy"><strong>{clientNames.get(appointment.customerId) ?? 'Client'}</strong><span>{appointment.serviceName}</span></div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </PaperCard>
        </section>

        <section>
          <div className="section-title"><h2>Recent clients</h2><Link to="/clients">view all</Link></div>
          <PaperCard className="list-card">
            {clients.length === 0 ? <EmptyState>No clients yet.</EmptyState> : clients.slice(0, 5).map((client) => (
              <Link className="list-row client-row" to="/clients" key={client.id}>
                <div className="mini-avatar">{client.name[0]?.toUpperCase()}</div>
                <div className="row-copy"><strong>{client.name}</strong><span>{client.phone || client.email}</span></div>
                <Icon name="arrow" />
              </Link>
            ))}
          </PaperCard>
        </section>
      </div>
    </div>
  );
}
