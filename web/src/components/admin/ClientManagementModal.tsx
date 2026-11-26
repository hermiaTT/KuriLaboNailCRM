import { useEffect, useState, type FormEvent } from 'react';

import { t, useLanguage } from '../../lib/i18n';
import { api, ApiError } from '../../lib/api';
import { todayInSalon } from '../../lib/dates';
import type { AdminUser, AdminUserDetail } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { DatePicker } from '../DatePicker';
import { PaperCard } from '../UI';

type Confirmation = 'merge' | 'delete' | null;

type ClientManagementModalProps = {
  client: AdminUserDetail;
  onClose: () => void;
  onSaved: (client: AdminUserDetail) => void;
  onMerged: (target: AdminUserDetail) => void;
  onDeleted: (clientId: string) => void;
};

export function ClientManagementModal({ client, onClose, onSaved, onMerged, onDeleted }: ClientManagementModalProps) {
  useLanguage();
  const [draft, setDraft] = useState(client);
  const [registeredClients, setRegisteredClients] = useState<AdminUser[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  useEffect(() => {
    if (client.accountType !== 'GUEST') return;
    api<AdminUser[]>('/api/v1/admin/users')
      .then((items) => setRegisteredClients(items.filter((item) => item.accountType === 'REGISTERED' && item.role === 'USER')))
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Unable to load clients."));
  }, [client.accountType]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !confirmation) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmation, onClose]);

  function editField(field: keyof AdminUserDetail, value: string | null) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api<AdminUserDetail>(`/api/v1/admin/users/${draft.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: draft.name.trim(),
          phone: draft.phone?.trim() || null,
          birthday: draft.birthday || null,
          instagram: draft.instagram?.trim() || null,
          wechat: draft.wechat?.trim() || null,
          preferredNailStyle: draft.preferredNailStyle?.trim() || null,
          allergyNotes: draft.allergyNotes?.trim() || null,
          adminNotes: draft.adminNotes?.trim() || null,
        }),
      });
      onSaved(updated);
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save this client.");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  async function deleteGuest() {
    setSaving(true);
    setError(null);
    try {
      await api<void>(`/api/v1/admin/users/${draft.id}`, { method: 'DELETE' });
      onDeleted(draft.id);
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to delete this client.");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  async function mergeGuest() {
    if (!mergeTargetId) return;
    setSaving(true);
    setError(null);
    try {
      const target = await api<AdminUserDetail>(`/api/v1/admin/users/${draft.id}/merge`, {
        method: 'POST',
        body: JSON.stringify({ targetClientId: mergeTargetId }),
      });
      onMerged(target);
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to merge this guest client.");
    } finally {
      setSaving(false);
      setConfirmation(null);
    }
  }

  const confirmingDelete = confirmation === 'delete';

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !confirmation) onClose(); }}>
    <PaperCard className="manage-set-modal client-detail-modal" role="dialog" aria-modal="true" aria-labelledby="client-management-title">
      <button className="modal-close" onClick={onClose} aria-label={t("Close")}>×</button>
      <h2 id="client-management-title">{t("Edit client details")}</h2>
      {error && <div className="form-notice">{t(error)}</div>}
      <form onSubmit={saveClient}>
        <div className="form-pair"><label>{t("Internal name")}<span className="mandatory">{t("mandatory")}</span><input value={draft.name} onChange={(event) => editField('name', event.target.value)} maxLength={120} required /></label><label className={draft.accountType === 'REGISTERED' ? 'locked-client-field' : ''}>{t("Contact phone")}<span className="optional">{draft.accountType === 'REGISTERED' ? t("managed by client") : t("optional")}</span><input value={draft.phone ?? ''} onChange={(event) => editField('phone', event.target.value || null)} type="tel" maxLength={40} disabled={draft.accountType === 'REGISTERED'} /></label></div>
        {draft.accountType === 'REGISTERED' && <p className="modal-subtitle">{t("Customer name")}: {draft.clientName || '—'}</p>}
        <label>{t("Birthday")}<span className="optional">{t("optional")}</span><DatePicker value={draft.birthday ?? ''} onChange={(value) => editField('birthday', value || null)} maxDate={todayInSalon()} /></label>
        <div className="form-pair"><label>{t("Instagram")}<span className="optional">{t("optional")}</span><input value={draft.instagram ?? ''} onChange={(event) => editField('instagram', event.target.value || null)} maxLength={120} /></label><label>{t("WeChat")}<span className="optional">{t("optional")}</span><input value={draft.wechat ?? ''} onChange={(event) => editField('wechat', event.target.value || null)} maxLength={120} /></label></div>
        <label>{t("Preferred nail style")}<span className="optional">{t("optional")}</span><textarea value={draft.preferredNailStyle ?? ''} onChange={(event) => editField('preferredNailStyle', event.target.value || null)} maxLength={1000} /></label>
        <label>{t("Allergy or sensitivity notes")}<span className="optional">{t("optional")}</span><textarea value={draft.allergyNotes ?? ''} onChange={(event) => editField('allergyNotes', event.target.value || null)} maxLength={1000} /></label>
        <label>{t("Private admin notes")}<span className="optional">{t("admin only")}</span><textarea value={draft.adminNotes ?? ''} onChange={(event) => editField('adminNotes', event.target.value || null)} maxLength={5000} /></label>
        <button className="primary-button" disabled={saving}>{saving ? t("Saving…") : t("Save client profile")}</button>
      </form>
      {draft.accountType === 'GUEST' && <section className="client-account-tool danger-soft">
        <p className="eyebrow">{t("MERGE GUEST")}</p><h3>{t("Connect to a registered account")}</h3>
        <p>{t("Appointments, history, photos and saved inspiration will move to the selected client. The source profile remains archived in merge history.")}</p>
        <select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
          <option value="">{t("Choose registered client…")}</option>
          {registeredClients.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.phone || item.email}</option>)}
        </select>
        <button type="button" className="secondary-button" disabled={!mergeTargetId || saving} onClick={() => setConfirmation('merge')}>{t("Merge guest profile")}</button>
      </section>}
      {draft.accountType === 'GUEST' && <section className="client-account-tool delete-client-tool">
        <p className="eyebrow">{t("DELETE CLIENT")}</p><h3>{t("Remove from client book")}</h3>
        <p>{t("Only admin-created clients can be deleted. Existing appointments, photos and history will remain archived.")}</p>
        <button type="button" className="delete-client-button" disabled={saving} onClick={() => setConfirmation('delete')}>{t("Delete client")}</button>
      </section>}
      <ConfirmModal
        open={confirmation !== null}
        tone={confirmingDelete ? 'danger' : 'default'}
        title={confirmingDelete ? t("Delete client") : t("Merge guest client")}
        message={confirmingDelete
          ? t("Delete {name} from the client book? Appointments, photos and history will be preserved in the archive.", { name: draft.name })
          : t("Merge {name} into the selected registered client? All appointments and nail sets will move, and this guest profile will be removed.", { name: draft.name })}
        confirmLabel={confirmingDelete ? t("Delete client") : t("Merge client")}
        pending={saving}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void (confirmingDelete ? deleteGuest() : mergeGuest())}
      />
    </PaperCard>
  </div>;
}
