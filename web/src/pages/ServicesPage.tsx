import { useEffect, useState, type FormEvent } from 'react';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api } from '../lib/api';
import type { ServiceDefinition } from '../types';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api<ServiceDefinition[]>('/api/v1/admin/services').then(setServices).catch(() => setError('Unable to load services.'));
  }
  useEffect(load, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api('/api/v1/admin/services', {
        method: 'POST',
        body: JSON.stringify({
          code: String(data.get('code')),
          name: String(data.get('name')),
          description: String(data.get('description') || ''),
          durationMinutes: Number(data.get('duration')),
          displayOrder: services.length + 1,
          active: true,
        }),
      });
      setShowForm(false);
      load();
    } catch {
      setError('Unable to create this service. Check that its code is unique and duration uses 30-minute increments.');
    }
  }

  return (
    <div className="page">
      <PageHeading eyebrow="SERVICE MENU" title="Treatments" action={<button className="primary-button compact" onClick={() => setShowForm((value) => !value)}>+ Add service</button>} />
      {error && <div className="form-notice">{error}</div>}
      {showForm && <PaperCard className="service-form"><form onSubmit={create}><label>Code<input name="code" placeholder="GEL_BASIC" required /></label><label>Name<input name="name" placeholder="Gel manicure" required /></label><label>Duration<select name="duration" defaultValue="120"><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">2 hours</option><option value="180">3 hours</option></select></label><label className="wide">Description<input name="description" placeholder="A short description for clients" /></label><button className="primary-button">Save service</button></form></PaperCard>}
      <div className="service-grid">
        {services.length === 0 ? <PaperCard><EmptyState>No services yet.</EmptyState></PaperCard> : services.map((service, index) => (
          <PaperCard className={`service-card tilt-${index % 2}`} key={service.id}>
            <div className="service-top"><span className="service-number">0{index + 1}</span><StatusBadge status={service.active ? 'active' : 'disabled'} /></div>
            <h2>{service.name}</h2><p>{service.description || 'A Kuri Labo studio service.'}</p>
            <div className="service-meta"><strong>{service.durationMinutes / 60 % 1 === 0 ? `${service.durationMinutes / 60} hr` : `${service.durationMinutes} min`}</strong><span>{service.code}</span></div>
          </PaperCard>
        ))}
      </div>
    </div>
  );
}
