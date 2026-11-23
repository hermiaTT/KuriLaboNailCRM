import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../components/UI';
import { api, ApiError } from '../lib/api';
import type { AdminUser, AdminUserDetail } from '../types';

export function ClientsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminUserDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  useEffect(() => {
    api<AdminUser[]>('/api/v1/admin/users')
      .then((users) => setClients(users.filter((user) => user.role === 'USER')))
      .catch(() => setError('Unable to load clients.'));
  }, []);

  useEffect(() => {
    const state = location.state as { editClientId?: string } | null;
    if (!state?.editClientId) return;
    void openClient(state.editClientId);
    navigate('/clients', { replace: true, state: null });
  }, [location.state, navigate]);

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
        body: JSON.stringify({ name: data.get('name'), phone: String(data.get('phone') || '').trim() || null }),
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

  async function openClient(clientId: string) {
    setLoadingDetails(true);
    setError(null);
    try {
      setEditing(await api<AdminUserDetail>(`/api/v1/admin/users/${clientId}`));
      setMergeTargetId('');
      setTemporaryPassword('');
      setAccountMessage(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load this client.');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function mergeGuest() {
    if (!editing || !mergeTargetId || !window.confirm(`Merge ${editing.name} into the selected registered client? All appointments and nail sets will move, and this guest profile will be removed.`)) return;
    setSaving(true); setError(null); setAccountMessage(null);
    try {
      const target = await api<AdminUserDetail>(`/api/v1/admin/users/${editing.id}/merge`, { method: 'POST', body: JSON.stringify({ targetUserId: mergeTargetId }) });
      setClients((current) => current.filter((client) => client.id !== editing.id).map((client) => client.id === target.id ? target : client));
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to merge this guest client.');
    } finally { setSaving(false); }
  }

  async function resetPassword() {
    if (!editing || temporaryPassword.length < 8) { setAccountMessage('Temporary password must be at least 8 characters.'); return; }
    setSaving(true); setAccountMessage(null);
    try {
      await api<void>(`/api/v1/admin/users/${editing.id}/password-reset`, { method: 'POST', body: JSON.stringify({ newPassword: temporaryPassword }) });
      setTemporaryPassword('');
      setAccountMessage('Temporary password saved. The client can use it immediately.');
    } catch (cause) {
      setAccountMessage(cause instanceof ApiError ? cause.message : 'Unable to reset the password.');
    } finally { setSaving(false); }
  }

  function editField(field: keyof AdminUserDetail, value: string | null) {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  }

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<AdminUserDetail>(`/api/v1/admin/users/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editing.name.trim(),
          phone: editing.phone?.trim() || null,
          birthday: editing.birthday || null,
          instagram: editing.instagram?.trim() || null,
          wechat: editing.wechat?.trim() || null,
          preferredNailStyle: editing.preferredNailStyle?.trim() || null,
          allergyNotes: editing.allergyNotes?.trim() || null,
          adminNotes: editing.adminNotes?.trim() || null,
          role: editing.role,
          status: editing.status,
        }),
      });
      setClients((current) => current.map((client) => client.id === updated.id ? updated : client));
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save this client.');
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
              <button className="table-row" key={client.id} onClick={() => navigate(`/clients/${client.id}`)} disabled={loadingDetails}>
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
            <label>Phone number <span className="optional">optional</span><input name="phone" type="tel" maxLength={40} autoComplete="tel" placeholder="(604) 555-0123" /></label>
            <div className="guest-client-note"><span>✦</span><p>This client can be booked and linked to nail sets, but cannot sign in. A future Merge action can move everything to their registered account.</p></div>
            <button className="primary-button" disabled={saving}>{saving ? 'Adding client…' : 'Add guest client'}</button>
          </form>
        </PaperCard>
      </div>}
      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
        <PaperCard className="manage-set-modal client-detail-modal">
          <button className="modal-close" onClick={() => setEditing(null)} aria-label="Close">×</button>
          <p className="eyebrow">CLIENT PROFILE · {editing.accountType}</p>
          <h2>Edit client details</h2>
          <p className="modal-subtitle">Guest phone numbers are optional. Registered clients need a phone number for sign-in.</p>
          <form onSubmit={saveClient}>
            <div className="form-pair"><label>Unique name<input value={editing.name} onChange={(event) => editField('name', event.target.value)} maxLength={120} required /></label><label>Phone {editing.accountType === 'GUEST' && <span className="optional">optional</span>}<input value={editing.phone ?? ''} onChange={(event) => editField('phone', event.target.value || null)} type="tel" maxLength={40} required={editing.accountType === 'REGISTERED'} /></label></div>
            <div className="form-pair"><label>Birthday <span className="optional">optional</span><input value={editing.birthday ?? ''} onChange={(event) => editField('birthday', event.target.value || null)} type="date" /></label><label>Status<select value={editing.status} onChange={(event) => editField('status', event.target.value)}><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></select></label></div>
            <div className="form-pair"><label>Instagram <span className="optional">optional</span><input value={editing.instagram ?? ''} onChange={(event) => editField('instagram', event.target.value || null)} maxLength={120} /></label><label>WeChat <span className="optional">optional</span><input value={editing.wechat ?? ''} onChange={(event) => editField('wechat', event.target.value || null)} maxLength={120} /></label></div>
            <label>Preferred nail style <span className="optional">optional</span><textarea value={editing.preferredNailStyle ?? ''} onChange={(event) => editField('preferredNailStyle', event.target.value || null)} maxLength={1000} /></label>
            <label>Allergy or sensitivity notes <span className="optional">optional</span><textarea value={editing.allergyNotes ?? ''} onChange={(event) => editField('allergyNotes', event.target.value || null)} maxLength={1000} /></label>
            <label>Private admin notes <span className="optional">admin only</span><textarea value={editing.adminNotes ?? ''} onChange={(event) => editField('adminNotes', event.target.value || null)} maxLength={5000} /></label>
            <button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save client profile'}</button>
          </form>
          {editing.accountType === 'GUEST' ? <section className="client-account-tool danger-soft">
            <p className="eyebrow">MERGE GUEST</p><h3>Connect to a registered account</h3>
            <p>Appointments, history, photos and saved inspiration will move to the selected client. The guest profile will then be removed.</p>
            <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
              <option value="">Choose registered client…</option>
              {clients.filter((client) => client.accountType === 'REGISTERED' && client.role === 'USER').map((client) => <option key={client.id} value={client.id}>{client.name} · {client.phone || client.email}</option>)}
            </select>
            <button type="button" className="secondary-button" disabled={!mergeTargetId || saving} onClick={() => void mergeGuest()}>Merge guest profile</button>
          </section> : <section className="client-account-tool">
            <p className="eyebrow">PASSWORD HELP</p><h3>Set a temporary password</h3>
            <p>Use this when a client cannot sign in. Their previous saved sessions will be signed out.</p>
            <div className="inline-account-action"><input type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} minLength={8} maxLength={100} placeholder="At least 8 characters" /><button type="button" className="secondary-button" disabled={saving || temporaryPassword.length < 8} onClick={() => void resetPassword()}>Set password</button></div>
            {accountMessage && <div className="account-message" role="status">{accountMessage}</div>}
          </section>}
        </PaperCard>
      </div>}
    </div>
  );
}
