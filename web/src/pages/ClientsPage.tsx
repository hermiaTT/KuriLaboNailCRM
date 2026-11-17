import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api, ApiError } from '../lib/api';
import type { AdminUser } from '../types';

export function ClientsPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<AdminUser[]>('/api/v1/admin/users')
      .then((users) => setClients(users.filter((user) => user.role === 'USER')))
      .catch(() => setError('Unable to load clients.'));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) => `${client.name} ${client.email ?? ''} ${client.phone ?? ''}`.toLowerCase().includes(needle));
  }, [clients, query]);

  async function createGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const created = await api<AdminUser>('/api/v1/admin/users/guests', {
        method: 'POST',
        body: JSON.stringify({ name: data.get('name'), phone: data.get('phone') }),
      });
      setClients((current) => [created, ...current]);
      setShowCreate(false);
      form.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to add this client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeading eyebrow={`${clients.length} CLIENTS`} title="Your client book" action={<button className="primary-button compact" onClick={() => setShowCreate(true)}>+ Add client</button>} />
      <div className="toolbar"><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" /></div>
      {error && <div className="form-notice">{error}</div>}
      <PaperCard className="table-card">
        {filtered.length === 0 ? <EmptyState>No matching clients.</EmptyState> : (
          <div className="data-table">
            <div className="table-head"><span>Client</span><span>Contact</span><span>Joined</span><span>Status</span></div>
            {filtered.map((client) => (
              <button className="table-row" key={client.id}>
                <span className="person-cell"><i className="mini-avatar">{client.name[0]?.toUpperCase()}</i><span><strong>{client.name} {client.accountType === 'GUEST' && <em className="guest-client-badge">Guest</em>}</strong><small>{client.email ?? 'Admin-created client'}</small></span></span>
                <span>{client.phone || 'No phone yet'}</span>
                <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(client.createdAt))}</span>
                <StatusBadge status={client.status} />
              </button>
            ))}
          </div>
        )}
      </PaperCard>
      {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
        <PaperCard className="schedule-modal client-create-modal">
          <button className="modal-close" onClick={() => setShowCreate(false)} aria-label="Close">×</button>
          <p className="eyebrow">NEW GUEST CLIENT</p>
          <h2>Add to your client book</h2>
          <p className="modal-subtitle">For clients who have not registered yet. Only admins can see and manage this profile.</p>
          <form onSubmit={createGuest}>
            <label>Name<input name="name" maxLength={120} autoComplete="off" placeholder="Client name" required /></label>
            <label>Phone number<input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="(604) 555-0123" required /></label>
            <div className="guest-client-note"><span>✦</span><p>This client can be booked and linked to nail sets, but cannot sign in. A future Merge action can move everything to their registered account.</p></div>
            <button className="primary-button" disabled={saving}>{saving ? 'Adding client…' : 'Add guest client'}</button>
          </form>
        </PaperCard>
      </div>}
    </div>
  );
}
