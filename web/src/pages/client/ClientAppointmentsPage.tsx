import { t, getLocale, useLanguage } from '../../lib/i18n';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { NailSetViewer } from '../../components/NailSetGallery';
import { ReferencePhotoPicker } from '../../components/ReferencePhotoPicker';
import { EmptyState, PageHeading, PaperCard, StatusBadge } from '../../components/UI';
import { formatSalonTime } from '../../lib/dates';
import { api, ApiError } from '../../lib/api';
import type { Appointment, NailSet, SalonContact } from '../../types';

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_STATUSES = new Set<Appointment['status']>(['CANCELLED', 'REJECTED', 'COMPLETED', 'NO_SHOW']);

function isPastAppointment(appointment: Appointment, now: number) {
  return HISTORY_STATUSES.has(appointment.status) || new Date(appointment.endAt).getTime() < now;
}

function appointmentDay(start: Date) {
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', timeZone: 'America/Vancouver' }).format(start);
}

function appointmentMonth(start: Date) {
  return new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'America/Vancouver' }).format(start);
}

export function ClientAppointmentsPage() {
  useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nailSets, setNailSets] = useState<NailSet[]>([]);
  const [contact, setContact] = useState<SalonContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [openSet, setOpenSet] = useState<NailSet | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [referenceTarget, setReferenceTarget] = useState<Appointment | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  useEffect(() => {
    Promise.all([
      api<Appointment[]>('/api/v1/appointments/me'),
      api<NailSet[]>('/api/v1/nail-sets/mine'),
      api<SalonContact>('/api/v1/salon/contact'),
    ])
      .then(([nextAppointments, nextNailSets, nextContact]) => {
        setAppointments(nextAppointments);
        setNailSets(nextNailSets);
        setContact(nextContact);
      })
      .catch(() => setError("Unable to load your appointments."))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const upcoming = appointments.filter((appointment) => !isPastAppointment(appointment, now));
  const past = appointments.filter((appointment) => isPastAppointment(appointment, now));
  const setsByAppointment = useMemo(() => new Map(nailSets.filter((item) => item.appointmentId).map((item) => [item.appointmentId, item])), [nailSets]);
  const unlinkedHistory = nailSets.filter((item) => !item.appointmentId);

  async function requestCancellation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancelTarget) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/appointments/${cancelTarget.id}/cancellation-requests`, {
        method: 'POST',
        body: JSON.stringify({ reason: data.get('reason') || null }),
      });
      setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
      setCancelTarget(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to send your cancellation request.");
    } finally {
      setBusy(false);
    }
  }

  async function copyWechat() {
    if (!contact?.wechatId) return;
    await navigator.clipboard.writeText(contact.wechatId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function openNailSet(item: NailSet) {
    setActiveImage(0);
    setOpenSet(item);
  }

  function openReferences(appointment: Appointment) {
    setError(null);
    setReferenceFiles([]);
    setReferenceTarget(appointment);
  }

  async function uploadReferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!referenceTarget || referenceFiles.length === 0) return;
    const body = new FormData();
    referenceFiles.forEach((file) => body.append('files', file));
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/appointments/${referenceTarget.id}/references`, { method: 'POST', body });
      setAppointments((current) => current.map((appointment) => appointment.id === updated.id ? updated : appointment));
      setReferenceFiles([]);
      setReferenceTarget(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to upload reference photos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="client-page">
      <PageHeading eyebrow={t("YOUR VISITS")} title={t("My appointments")} action={<Link className="primary-button compact" to="/client/book">{t("+ Book")}</Link>} />
      {error && <div className="form-notice">{t(error)}</div>}

      <section className="appointment-section">
        <div className="appointment-section-title"><div><p className="eyebrow">{t("COMING UP")}</p><h2>{t("Upcoming appointments")}</h2></div><span>{upcoming.length}</span></div>
        <PaperCard className="client-appointment-list">
          {!loading && upcoming.length === 0 ? <EmptyState>{t("No upcoming appointments. Your next Kuri Labo visit can start here.")}</EmptyState> : upcoming.map((appointment) => {
            const start = new Date(appointment.startAt);
            const confirmed = appointment.status === 'CONFIRMED';
            const future = start.getTime() > Date.now();
            const outsideWindow = start.getTime() > Date.now() + DAY_MS;
            return (
              <article key={appointment.id} className="client-appointment-row">
                <div className="date-block"><strong>{appointmentDay(start)}</strong><small>{appointmentMonth(start)}</small></div>
                <div className="client-appt-copy">
                  <div><h3>{appointment.serviceName}</h3><StatusBadge status={appointment.status} /></div>
                  <p>{formatSalonTime(start)} · {appointment.durationMinutes} {t("minutes")}</p>
                  {appointment.note && <small>{appointment.note}</small>}
                  {appointment.status === 'CANCELLATION_REQUESTED' && <p className="appointment-hint pending-hint">{t("Cancellation requested—your time stays reserved until Kuri reviews it.")}</p>}
                  {confirmed && future && !outsideWindow && <p className="appointment-hint contact-hint">{t("Within 24 hours—please contact Kuri directly if you need help.")}</p>}
                </div>
                {appointment.referenceImages.length > 0 && <div className="client-appointment-media-column"><ReferencePhotoPicker files={[]} onChange={() => undefined} existingImages={appointment.referenceImages} allowUpload={false} /></div>}
                {(appointment.status === 'PENDING_CONFIRMATION' || appointment.status === 'CONFIRMED') && <button className="reference-manage-button" onClick={() => openReferences(appointment)}>{appointment.referenceImages.length ? t('+ Add photos') : t('Upload photos')}</button>}
                {confirmed && future && outsideWindow && <button className="cancel-request-button" onClick={() => setCancelTarget(appointment)}>{t("Request cancellation")}</button>}
              </article>
            );
          })}
        </PaperCard>
      </section>

      <section className="appointment-section past-appointment-section">
        <div className="appointment-section-title"><div><p className="eyebrow">{t("YOUR NAIL HISTORY")}</p><h2>{t("Past appointments")}</h2></div><span>{past.length + unlinkedHistory.length}</span></div>
        <PaperCard className="client-appointment-list past-appointment-list">
          {!loading && past.length === 0 && unlinkedHistory.length === 0 ? <EmptyState>{t("Your past visits and photo sets will appear here.")}</EmptyState> : past.map((appointment) => {
            const start = new Date(appointment.startAt);
            const nailSet = setsByAppointment.get(appointment.id);
            return (
              <article key={appointment.id} className="client-appointment-row past-appointment-row">
                <div className="date-block"><strong>{appointmentDay(start)}</strong><small>{appointmentMonth(start)}</small></div>
                <div className="client-appt-copy"><div><h3>{appointment.serviceName}</h3><StatusBadge status={appointment.status} /></div><p>{new Intl.DateTimeFormat(getLocale(), { year: 'numeric', timeZone: 'America/Vancouver' }).format(start)} · {formatSalonTime(start)}</p></div>
                {appointment.referenceImages.length > 0 && <div className="client-appointment-media-column"><ReferencePhotoPicker files={[]} onChange={() => undefined} existingImages={appointment.referenceImages} allowUpload={false} /></div>}
                {nailSet ? <button className="history-photo-button" onClick={() => openNailSet(nailSet)}><img src={nailSet.images[0]?.url} alt="" /><span>{t("View")}{nailSet.images.length} {t("photo")}{getLocale() === 'en-US' && nailSet.images.length !== 1 ? 's' : ''}</span></button> : <span className="no-history-photos">{t("No photos added")}</span>}
              </article>
            );
          })}
          {unlinkedHistory.map((item) => <article key={item.id} className="client-appointment-row past-appointment-row client-only-history-row"><div className="date-block archive-date-block"><span>✿</span><small>{t("set")}</small></div><div className="client-appt-copy"><div><h3>{item.title}</h3><span className="history-only-label">{t("nail history")}</span></div>{item.description && <small>{item.description}</small>}</div><button className="history-photo-button" onClick={() => openNailSet(item)}><img src={item.images[0]?.url} alt="" /><span>{t("View")}{item.images.length} {t("photo")}{getLocale() === 'en-US' && item.images.length !== 1 ? 's' : ''}</span></button></article>)}
        </PaperCard>
      </section>

      <PaperCard className="contact-kuri-card">
        <div><p className="eyebrow">{t("NEED HELP?")}</p><h2>{t("Contact the nail artist")}</h2><p>{contact?.contactMessage || t("For special requests or help within 24 hours, contact the nail artist directly.")}</p></div>
        {contact?.wechatId ? <button className="secondary-button" onClick={() => void copyWechat()}>{copied ? t("Copied!") : t("Copy WeChat · {id}", { id: contact.wechatId })}</button> : <span className="contact-not-set">{t("WeChat will be added by the studio")}</span>}
      </PaperCard>

      {cancelTarget && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCancelTarget(null); }}><PaperCard className="cancel-modal"><button className="modal-close" onClick={() => setCancelTarget(null)} aria-label={t("Close")}>×</button><p className="eyebrow">{t("CANCELLATION REQUEST")}</p><h2>{t("Ask Kuri to cancel?")}</h2><p className="modal-subtitle">{cancelTarget.serviceName} · {appointmentMonth(new Date(cancelTarget.startAt))} {appointmentDay(new Date(cancelTarget.startAt))} {t("at")}{formatSalonTime(cancelTarget.startAt)}</p><div className="cancellation-note">{t("Your appointment remains reserved until Kuri approves this request.")}</div><form onSubmit={requestCancellation}><label>{t("Reason")}<span className="optional">{t("optional")}</span><textarea name="reason" maxLength={1000} placeholder={t("Let Kuri know what changed…")} /></label><button className="primary-button" disabled={busy}>{busy ? t("Sending…") : t("Send cancellation request")}</button></form></PaperCard></div>}
      {referenceTarget && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setReferenceTarget(null); }}><PaperCard className="reference-photo-modal"><button className="modal-close" disabled={busy} onClick={() => setReferenceTarget(null)} aria-label={t('Close')}>×</button><p className="eyebrow">{t('YOUR APPOINTMENT')}</p><h2>{t('Reference photos')}</h2><p className="modal-subtitle">{referenceTarget.serviceName} · {t('Shared with you and the studio.')}</p>{error && <div className="form-notice">{t(error)}</div>}<form onSubmit={uploadReferences}><ReferencePhotoPicker files={referenceFiles} onChange={setReferenceFiles} existingImages={referenceTarget.referenceImages} disabled={busy} allowUpload={referenceTarget.status === 'PENDING_CONFIRMATION' || referenceTarget.status === 'CONFIRMED'} />{(referenceTarget.status === 'PENDING_CONFIRMATION' || referenceTarget.status === 'CONFIRMED') && referenceFiles.length > 0 && <button className="primary-button" disabled={busy}>{busy ? t('Uploading photos…') : t('Upload photos')}</button>}</form></PaperCard></div>}
      {openSet && <NailSetViewer item={openSet} activeImage={activeImage} setActiveImage={setActiveImage} onClose={() => setOpenSet(null)} />}
    </div>
  );
}
