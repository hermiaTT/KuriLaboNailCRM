import { t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ClientManagementModal } from '../components/admin/ClientManagementModal';
import { EmptyState, PageHeading, PaperCard } from '../components/UI';
import { api, ApiError } from '../lib/api';
import type { AdminUser, AdminUserDetail } from '../types';

export function ClientsPage() {
  useLanguage();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [managedClient, setManagedClient] = useState<AdminUserDetail | null>(null);
  const [loadingClientId, setLoadingClientId] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUser[]>('/api/v1/admin/users')
      .then((users) => setClients(users.filter((user) => user.role === 'USER')))
      .catch(() => setError("Unable to load clients."));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) => `${client.adminDisplayName} ${client.clientName ?? ''} ${client.email ?? ''} ${client.phone ?? ''} ${client.loginPhone ?? ''}`.toLowerCase().includes(needle));
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
        body: JSON.stringify({ name: data.get('name'), phone: String(data.get('phone') || '').trim() || null }),
      });
      setClients((current) => [created, ...current]);
      setShowCreate(false);
      form.reset();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to add this client.");
    } finally {
      setSaving(false);
    }
  }

  async function openManage(clientId: string) {
    setLoadingClientId(clientId);
    setError(null);
    try {
      setManagedClient(await api<AdminUserDetail>(`/api/v1/admin/users/${clientId}`));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to load this client profile.");
    } finally {
      setLoadingClientId(null);
    }
  }

  function applyClientUpdate(updated: AdminUserDetail) {
    setClients((current) => current.map((client) => client.id === updated.id ? {
      ...client,
      accountId: updated.accountId,
      email: updated.email,
      accountType: updated.accountType,
      name: updated.name,
      clientName: updated.clientName,
      adminDisplayName: updated.adminDisplayName,
      phone: updated.phone,
      loginPhone: updated.loginPhone,
    } : client));
    setManagedClient(updated);
  }

  return (
    <div className="page">
      <PageHeading eyebrow={t("{count} CLIENTS", { count: clients.length })} title={t("Your client book")} action={<button className="primary-button compact" onClick={() => setShowCreate(true)}>{t("+ Add client")}</button>} />
      <div className="toolbar"><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search name, email or phone…")} /></div>
      {error && <div className="form-notice">{t(error)}</div>}
      <PaperCard className="table-card">
        {filtered.length === 0 ? <EmptyState>{t("No matching clients.")}</EmptyState> : (
          <div className="data-table">
            <div className="table-head"><span>{t("Client")}</span><span>{t("Contact")}</span><span>{t("Next appointment")}</span><span>{t("Manage")}</span></div>
            {filtered.map((client) => (
              <div className="table-row" key={client.id}>
                <button type="button" className="client-row-link person-cell" onClick={() => navigate(`/clients/${client.id}`)}><i className="mini-avatar">{client.name[0]?.toUpperCase()}</i><span><strong>{client.adminDisplayName} {client.accountType === 'GUEST' && <em className="guest-client-badge">{t("Guest")}</em>}</strong><small>{client.clientName || client.email || t("Admin-created client")}</small></span></button>
                <span>{client.phone || client.loginPhone || t("No phone yet")}</span>
                <span>{client.nextAppointmentAt ? new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(client.nextAppointmentAt)) : t("None scheduled")}</span>
                <button type="button" className="secondary-button client-manage-button" disabled={loadingClientId === client.id} onClick={() => void openManage(client.id)}>{loadingClientId === client.id ? t("Loading…") : t("Manage")}</button>
              </div>
            ))}
          </div>
        )}
      </PaperCard>
      {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
        <PaperCard className="schedule-modal client-create-modal">
          <button className="modal-close" onClick={() => setShowCreate(false)} aria-label={t("Close")}>×</button>
          <p className="eyebrow">{t("NEW GUEST CLIENT")}</p>
          <h2>{t("Add to your client book")}</h2>
          <p className="modal-subtitle">{t("For clients who have not registered yet. Only admins can see and manage this profile.")}</p>
          <form onSubmit={createGuest}>
            <label>{t("Internal name")}<input name="name" maxLength={120} autoComplete="off" placeholder={t("Unique admin-only name")} required /></label>
            <label>{t("Phone number")}<span className="optional">{t("optional")}</span><input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="(604) 555-0123" /></label>
            <div className="guest-client-note"><span>✦</span><p>{t("This client can be booked and linked to nail sets, but cannot sign in. A future Merge action can move everything to their registered account.")}</p></div>
            <button className="primary-button" disabled={saving}>{saving ? t("Adding client…") : t("Add guest client")}</button>
          </form>
        </PaperCard>
      </div>}
      {managedClient && <ClientManagementModal
        client={managedClient}
        onClose={() => setManagedClient(null)}
        onSaved={applyClientUpdate}
        onMerged={(target) => {
          setClients((current) => current.filter((client) => client.id !== managedClient.id));
          applyClientUpdate(target);
        }}
        onDeleted={(clientId) => {
          setClients((current) => current.filter((client) => client.id !== clientId));
          setManagedClient(null);
        }}
      />}
    </div>
  );
}
