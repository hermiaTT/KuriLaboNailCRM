import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/AuthContext';
import { PaperCard, StatusBadge } from '../../components/UI';
import { formatSalonTime } from '../../lib/dates';
import { api } from '../../lib/api';
import type { Appointment, ServiceDefinition } from '../../types';

export function ClientHomePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);

  useEffect(() => {
    Promise.all([
      api<Appointment[]>('/api/v1/appointments/me'),
      api<ServiceDefinition[]>('/api/v1/services'),
    ]).then(([nextAppointments, nextServices]) => {
      setAppointments(nextAppointments);
      setServices(nextServices);
    }).catch(() => undefined);
  }, []);

  const next = appointments
    .filter((appointment) => new Date(appointment.startAt).getTime() > Date.now() && !['CANCELLED', 'REJECTED'].includes(appointment.status))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))[0];

  return (
    <div className="client-page client-home">
      <section className="client-hero">
        <div><p className="eyebrow">YOUR KURI LABO</p><h1>Hi, {user?.name?.split(' ')[0]} ✨</h1><p>Ready for your next little work of art?</p><Link className="primary-button" to="/client/book">Book an appointment</Link></div>
        <div className="hero-art" aria-hidden="true"><span>✿</span><i /><b>♡</b></div>
      </section>

      <div className="client-home-grid">
        <section><div className="section-title"><h2>Coming up</h2><Link to="/client/appointments">view all</Link></div>{next ? <PaperCard className="next-visit-card"><div className="next-date"><strong>{new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(next.startAt))}</strong><span>{new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'America/Vancouver' }).format(new Date(next.startAt))}</span></div><div><StatusBadge status={next.status} /><h3>{next.serviceName}</h3><p>{formatSalonTime(next.startAt)} · {next.durationMinutes} minutes</p></div></PaperCard> : <PaperCard className="soft-empty"><span>♡</span><h3>No visit planned yet</h3><p>Pick a time whenever inspiration strikes.</p><Link to="/client/book">Find a time</Link></PaperCard>}</section>
        <section><div className="section-title"><h2>Our services</h2><Link to="/client/book">book</Link></div><div className="mini-service-grid">{services.map((service, index) => <PaperCard key={service.id} className={index % 2 ? 'mini-service blue' : 'mini-service pink'}><span>0{index + 1}</span><h3>{service.name}</h3><p>{service.durationMinutes / 60} hours</p></PaperCard>)}</div></section>
      </div>
    </div>
  );
}
