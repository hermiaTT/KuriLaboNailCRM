import { t, getLocale, useLanguage } from '../lib/i18n';
import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { NailSetGallery } from '../components/NailSetGallery';
import { PageHeading, PaperCard } from '../components/UI';
import { api, ApiError } from '../lib/api';
import { formatSalonTime } from '../lib/dates';
import type { AdminUser, Appointment, NailSet } from '../types';

export function InspirationPage() {
  useLanguage();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<NailSet[]>([]);
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [clientId, setClientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manageItem, setManageItem] = useState<NailSet | null>(null);
  const [editClientId, setEditClientId] = useState('');
  const [editAppointmentId, setEditAppointmentId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<NailSet[]>('/api/v1/inspiration'),
      api<AdminUser[]>('/api/v1/admin/users'),
      api<Appointment[]>('/api/v1/admin/appointments'),
    ])
      .then(([nextItems, users, nextAppointments]) => {
        setItems(nextItems);
        setClients(users.filter((user) => user.role === 'USER'));
        setAppointments(nextAppointments);
        const requestedAppointment = searchParams.get('appointmentId');
        if (requestedAppointment && nextAppointments.some((appointment) => appointment.id === requestedAppointment)) {
          setAppointmentId(requestedAppointment);
        }
      })
      .catch(() => setError("Unable to load the inspiration studio."));
  }, [searchParams]);

  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function chooseAppointment(value: string) {
    setAppointmentId(value);
    if (value) setClientId('');
  }

  function addFiles(nextFiles: FileList | File[]) {
    const images = Array.from(nextFiles).filter((file) => file.type.startsWith('image/'));
    setFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      const additions = images.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return [...current, ...additions].slice(0, 12);
    });
  }

  function dropFiles(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDraggingFiles(false);
    addFiles(event.dataTransfer.files);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Choose at least one image for this set.");
      return;
    }
    const body = new FormData();
    files.forEach((file) => body.append('files', file));
    if (title.trim()) body.append('title', title.trim());
    if (description.trim()) body.append('description', description.trim());
    if (appointmentId) body.append('appointmentId', appointmentId);
    else if (clientId) body.append('clientId', clientId);
    setUploading(true);
    setError(null);
    try {
      const created = await api<NailSet>('/api/v1/admin/nail-sets', { method: 'POST', body });
      setItems((current) => [created, ...current]);
      setFiles([]);
      setClientId('');
      setAppointmentId('');
      setTitle('');
      setDescription('');
      setFileInputKey((current) => current + 1);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to upload this nail set.");
    } finally {
      setUploading(false);
    }
  }

  function openManage(item: NailSet) {
    setManageItem(item);
    setEditClientId(item.clientId ?? '');
    setEditAppointmentId(item.appointmentId ?? '');
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
    setError(null);
  }

  function chooseEditAppointment(value: string) {
    setEditAppointmentId(value);
    if (value) setEditClientId('');
  }

  async function saveManagement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageItem) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<NailSet>(`/api/v1/admin/nail-sets/${manageItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          clientId: editAppointmentId ? null : editClientId || null,
          appointmentId: editAppointmentId || null,
        }),
      });
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setManageItem(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to update this nail set.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page inspiration-page">
      <PageHeading eyebrow={t("{count} NAIL SETS", { count: items.length })} title={t("Inspiration studio")} />
      {error && <div className="form-notice">{t(error)}</div>}
      <PaperCard className="upload-studio-card">
        <div className="upload-studio-intro"><p className="eyebrow">{t("NEW NAIL SET")}</p><h2>{t("Upload a little gallery")}</h2><p>{t("Add up to 12 photos. Linking a client or appointment is optional—unlinked archive photos still appear in Inspiration.")}</p></div>
        <form onSubmit={upload}>
          <label
            className={`upload-dropzone${draggingFiles ? ' is-dragging' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setDraggingFiles(true); }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingFiles(false); }}
            onDrop={dropFiles}
          >
            <input key={fileInputKey} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => addFiles(event.target.files ?? [])} />
            <span>{draggingFiles ? '↓' : '＋'}</span><strong>{draggingFiles ? t("Drop photos here") : t("Drag photos here or click to choose")}</strong><small>{t("JPEG, PNG, WebP or GIF · up to 12")}</small>
          </label>
          {previews.length > 0 && <div className="upload-preview-strip">{previews.map((preview, index) => <div key={`${preview.file.name}-${index}`}><img src={preview.url} alt="" /><span>{index === 0 ? 'cover' : index + 1}</span></div>)}</div>}
          <div className="form-pair"><label>{t("Set title")}<span className="optional">{t("optional")}</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} placeholder={t("Soft chrome garden")} /></label><label>{t("Client")}<span className="optional">{t("optional")}</span><select value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={Boolean(appointmentId)}><option value="">{t("No client")}</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label></div>
          <label>{t("Appointment")}<span className="optional">{t("optional")}</span><select value={appointmentId} onChange={(event) => chooseAppointment(event.target.value)}><option value="">{t("No appointment")}</option>{appointments.map((appointment) => { const start = new Date(appointment.startAt); return <option value={appointment.id} key={appointment.id}>{appointment.customerName ?? names.get(appointment.customerId) ?? t("Client")} · {appointment.serviceName} · {new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(start)} {formatSalonTime(start)}</option>; })}</select></label>
          <label>{t("Description")}<span className="optional">{t("optional")}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("Colors, finish, technique or a sweet little note…")} /></label>
          <button className="primary-button upload-submit" disabled={uploading}>{uploading ? t("Uploading set…") : t("Publish {count} photos", { count: files.length })}</button>
        </form>
      </PaperCard>
      <div className="inspiration-section-heading"><div><p className="eyebrow">{t("THE LIBRARY")}</p><h2>{t("Published sets")}</h2></div><span>{t("Click any cover to browse the full set")}</span></div>
      <NailSetGallery items={items} onManage={openManage} />
      {manageItem && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setManageItem(null); }}><PaperCard className="manage-set-modal"><button className="modal-close" onClick={() => setManageItem(null)} aria-label={t("Close")}>×</button><p className="eyebrow">{t("MANAGE NAIL SET")}</p><h2>{t("Edit details and history link")}</h2><p className="modal-subtitle">{t("Link archive photos to a client at any time. An appointment is optional.")}</p><form onSubmit={saveManagement}><label>{t("Set title")}<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} maxLength={200} required /></label><label>{t("Description")}<span className="optional">{t("optional")}</span><textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={5000} /></label><div className="form-pair"><label>{t("Client")}<span className="optional">{t("optional")}</span><select value={editClientId} onChange={(event) => setEditClientId(event.target.value)} disabled={Boolean(editAppointmentId)}><option value="">{t("No client")}</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label>{t("Appointment")}<span className="optional">{t("optional")}</span><select value={editAppointmentId} onChange={(event) => chooseEditAppointment(event.target.value)}><option value="">{t("No appointment")}</option>{appointments.map((appointment) => { const start = new Date(appointment.startAt); return <option value={appointment.id} key={appointment.id}>{appointment.customerName ?? names.get(appointment.customerId) ?? t("Client")} · {appointment.serviceName} · {new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(start)}</option>; })}</select></label></div><div className="link-behavior-note">{t("Client only → appears in Past appointments without a date. Appointment → uses that appointment's client and date.")}</div><button className="primary-button" disabled={saving}>{saving ? t("Saving…") : t("Save nail set")}</button></form></PaperCard></div>}
    </div>
  );
}
