import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { ClientAppointmentCard } from '../components/admin/ClientAppointmentCard';
import { ClientProfileSummary } from '../components/admin/ClientProfileSummary';
import { EmptyState, PageHeading, PaperCard } from '../components/UI';
import { api, ApiError } from '../lib/api';
import type { AdminAppointment, AdminUserDetail, NailSet } from '../types';

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<AdminUserDetail | null>(null);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api<AdminUserDetail>(`/api/v1/admin/users/${clientId}`),
      api<AdminAppointment[]>(`/api/v1/admin/appointments?customerId=${encodeURIComponent(clientId)}`),
      api<NailSet[]>(`/api/v1/admin/nail-sets?clientId=${encodeURIComponent(clientId)}`),
    ]).then(([profile, visits, sets]) => {
      setClient(profile);
      setAppointments(visits);
      setNailSets(sets);
    }).catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Unable to load this client profile.'))
      .finally(() => setLoading(false));
  }, [clientId]);

  const setsByAppointment = useMemo(() => new Map(nailSets.filter((set) => set.appointmentId).map((set) => [set.appointmentId!, set])), [nailSets]);
  const unlinkedSets = useMemo(() => nailSets.filter((set) => !set.appointmentId), [nailSets]);

  if (!clientId) return <Navigate to="/clients" replace />;

  return (
    <div className="page client-detail-page">
      <PageHeading eyebrow="CLIENT PROFILE" title={client?.name ?? 'Client details'} action={<div className="heading-actions"><Link className="secondary-button" to="/clients">← Client book</Link>{client && <Link className="primary-button compact" to="/clients" state={{ editClientId: client.id }}>Manage profile</Link>}</div>} />
      {error && <div className="form-notice">{error}</div>}
      {loading ? <div className="client-detail-loading"><span /><span /><span /></div> : client && <>
        <ClientProfileSummary client={client} />

        <section className="client-history-section">
          <div className="client-history-heading"><div><p className="eyebrow">COMPLETE TIMELINE</p><h2>Appointments</h2></div><span>{appointments.length} total</span></div>
          <div className="client-timeline-list">{appointments.length === 0 ? <PaperCard><EmptyState>No appointments for this client yet.</EmptyState></PaperCard> : appointments.map((appointment) => <ClientAppointmentCard key={appointment.id} appointment={appointment} nailSet={setsByAppointment.get(appointment.id)} />)}</div>
        </section>

        {unlinkedSets.length > 0 && <section className="client-unlinked-section"><div className="client-history-heading"><div><p className="eyebrow">ARCHIVE</p><h2>Unlinked history</h2></div><span>{unlinkedSets.length} set{unlinkedSets.length === 1 ? '' : 's'}</span></div><div className="client-unlinked-grid">{unlinkedSets.map((set) => <PaperCard className="client-unlinked-card" key={set.id}><div className="client-unlinked-images">{set.images.slice(0, 4).map((image) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id}><img src={image.url} alt={set.title} /></a>)}</div><h3>{set.title}</h3>{set.description && <p>{set.description}</p>}</PaperCard>)}</div></section>}
      </>}
    </div>
  );
}
