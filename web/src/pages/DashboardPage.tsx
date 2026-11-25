import { t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import type { AdminUser, Appointment, NailSet } from '../types';
import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { Icon } from '../components/Icons';

function dayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t("Good morning");
  if (hour < 18) return t("Good afternoon");
  return t("Good evening");
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(getLocale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function DashboardPage() {
  useLanguage();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      api<Appointment[]>('/api/v1/admin/appointments'),
      api<AdminUser[]>('/api/v1/admin/users'),
      api<NailSet[]>('/api/v1/inspiration'),
    ])
      .then(([appointmentsResult, clientsResult, nailSetsResult]) => {
        if (appointmentsResult.status === 'fulfilled') setAppointments(appointmentsResult.value);
        if (clientsResult.status === 'fulfilled') {
          setClients(clientsResult.value.filter((client) => client.role === 'USER'));
        }
        if (nailSetsResult.status === 'fulfilled') setNailSets(nailSetsResult.value);

        const failedSections = [appointmentsResult, clientsResult, nailSetsResult]
          .filter((result) => result.status === 'rejected').length;
        setError(failedSections > 0
          ? "Some dashboard sections could not load. Please refresh the page."
          : null);
      });
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
        eyebrow={new Intl.DateTimeFormat(getLocale(), { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}
        title={`${dayGreeting()}, ${user?.name?.split(' ')[0] ?? 'Kuri'} ✨`}
        action={<Link className="primary-button compact" to="/appointments">{t("View appointments")}</Link>}
      />
      {error && <div className="form-notice">{t(error)}</div>}
      <section className="stat-grid">
        <PaperCard className="stat-card pink"><span className="stat-doodle">✿</span><strong>{todayAppointments.length}</strong><h3>{t("today")}</h3><p>{pending} {t("waiting to confirm")}</p></PaperCard>
        <PaperCard className="stat-card blue"><span className="stat-doodle">✦</span><strong>{confirmed}</strong><h3>{t("confirmed")}</h3><p>{t("upcoming visits")}</p></PaperCard>
        <PaperCard className="stat-card green"><span className="stat-doodle">☆</span><strong>{clients.length}</strong><h3>{t("clients")}</h3><p>{t("in your studio")}</p></PaperCard>
        <PaperCard className="stat-card yellow"><span className="stat-doodle">♡</span><strong>{nailSets.length}</strong><h3>{t("nail sets")}</h3><p>{nailSets.reduce((total, item) => total + item.images.length, 0)} {t("uploaded photos")}</p></PaperCard>
      </section>

      <div className="dashboard-grid">
        <section>
          <div className="section-title"><h2>{t("Today's schedule")}</h2><Link to="/appointments">{t("see all")}</Link></div>
          <PaperCard className="list-card">
            {todayAppointments.length === 0 ? <EmptyState>{t("No appointments today—enjoy the breathing room.")}</EmptyState> : todayAppointments.slice(0, 5).map((appointment) => (
              <div className="list-row" key={appointment.id}>
                <div className="time-tile"><strong>{formatTime(appointment.startAt)}</strong><small>{appointment.durationMinutes} {t("min")}</small></div>
                <div className="row-copy"><strong>{appointment.customerName ?? clientNames.get(appointment.customerId) ?? t("Client")}</strong><span>{appointment.serviceName}</span></div>
                <StatusBadge status={appointment.status} />
              </div>
            ))}
          </PaperCard>
        </section>

        <section>
          <div className="section-title"><h2>{t("Recent clients")}</h2><Link to="/clients">{t("view all")}</Link></div>
          <PaperCard className="list-card">
            {clients.length === 0 ? <EmptyState>{t("No clients yet.")}</EmptyState> : clients.slice(0, 5).map((client) => (
              <Link className="list-row client-row" to={`/clients/${client.id}`} key={client.id}>
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
