import { useEffect, useMemo, useState } from 'react';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api } from '../lib/api';
import type { AdminUser } from '../types';

export function ClientsPage() {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUser[]>('/api/v1/admin/users')
      .then((users) => setClients(users.filter((user) => user.role === 'USER')))
      .catch(() => setError('Unable to load clients.'));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) => `${client.name} ${client.email} ${client.phone ?? ''}`.toLowerCase().includes(needle));
  }, [clients, query]);

  return (
    <div className="page">
      <PageHeading eyebrow={`${clients.length} CLIENTS`} title="Your client book" />
      <div className="toolbar"><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone…" /></div>
      {error && <div className="form-notice">{error}</div>}
      <PaperCard className="table-card">
        {filtered.length === 0 ? <EmptyState>No matching clients.</EmptyState> : (
          <div className="data-table">
            <div className="table-head"><span>Client</span><span>Contact</span><span>Joined</span><span>Status</span></div>
            {filtered.map((client) => (
              <button className="table-row" key={client.id}>
                <span className="person-cell"><i className="mini-avatar">{client.name[0]?.toUpperCase()}</i><span><strong>{client.name}</strong><small>{client.email}</small></span></span>
                <span>{client.phone || 'No phone yet'}</span>
                <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(client.createdAt))}</span>
                <StatusBadge status={client.status} />
              </button>
            ))}
          </div>
        )}
      </PaperCard>
    </div>
  );
}
