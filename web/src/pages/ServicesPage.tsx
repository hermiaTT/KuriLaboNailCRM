import { useEffect, useState, type FormEvent } from 'react';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api } from '../lib/api';
import type { ServiceDefinition } from '../types';

export function ServicesPage() {
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ServiceDefinition | null>(null);

  const durationOptions = Array.from({ length: 10 }, (_, index) => (index + 1) * 30);
  const durationLabel = (minutes: number) => minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`;

  function load() {
    api<ServiceDefinition[]>('/api/v1/admin/services').then(setServices).catch(() => setError('Unable to load services.'));
  }
  useEffect(load, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api(editing ? `/api/v1/admin/services/${editing.id}` : '/api/v1/admin/services', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: String(data.get('name')),
          description: String(data.get('description') || ''),
          durationMinutes: Number(data.get('duration')),
          price: Number(data.get('price')),
          displayOrder: editing?.displayOrder ?? services.length + 1,
          active: data.get('active') === 'on',
        }),
      });
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      setError('Unable to save this service. Duration must be 30 minutes to 5 hours.');
    }
  }

  return (
    <div className="page">
      <PageHeading eyebrow="SERVICE MENU" title="Treatments" action={<button className="primary-button compact" onClick={() => { setEditing(null); setShowForm((value) => !value); }}>+ Add service</button>} />
      {error && <div className="form-notice">{error}</div>}
      {showForm && <PaperCard className="service-form"><form key={editing?.id ?? 'new'} onSubmit={save}><label>Name<input name="name" defaultValue={editing?.name} placeholder="Gel manicure" maxLength={120} required /></label><label>Duration<select name="duration" defaultValue={editing?.durationMinutes ?? 60}>{durationOptions.map((minutes) => <option value={minutes} key={minutes}>{durationLabel(minutes)}</option>)}</select></label><label>Price (CAD)<input name="price" type="number" min="0" step="0.01" defaultValue={editing?.price ?? 0} required /></label><label className="wide">Description<input name="description" defaultValue={editing?.description ?? ''} placeholder="A short description for clients" /></label><label className="check-label"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} /><span><strong>Available to clients</strong><small>Inactive services remain in appointment history.</small></span></label><button className="primary-button">{editing ? 'Save changes' : 'Save service'}</button></form></PaperCard>}
      <div className="service-grid">
        {services.length === 0 ? <PaperCard><EmptyState>No services yet.</EmptyState></PaperCard> : services.map((service, index) => (
          <PaperCard className={`service-card tilt-${index % 2}`} key={service.id}>
            <div className="service-top"><span className="service-number">0{index + 1}</span><StatusBadge status={service.active ? 'active' : 'disabled'} /></div>
            <h2>{service.name}</h2><p>{service.description || 'A Kuri Labo studio service.'}</p>
            <div className="service-meta"><strong>{durationLabel(service.durationMinutes)}</strong><span>${Number(service.price).toFixed(2)}</span></div>
            <button className="manage-set-button" onClick={() => { setEditing(service); setShowForm(true); }}>Edit service</button>
          </PaperCard>
        ))}
      </div>
    </div>
  );
}
