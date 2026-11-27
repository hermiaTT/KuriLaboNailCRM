import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { formatSalonTime, salonDateKey, salonMinutes, todayInSalon } from '../../lib/dates';
import { formatClock, getLocale, statusLabel, t, useLanguage } from '../../lib/i18n';
import { api, ApiError } from '../../lib/api';
import type { AdminAppointment, AdminScheduleAvailability, AdminUserDetail, Appointment, NailSet, ServiceDefinition } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { DatePicker } from '../DatePicker';
import { ReferencePhotoPicker } from '../ReferencePhotoPicker';
import { PaperCard, StatusBadge } from '../UI';

type Confirmation = 'reject' | 'approve-cancellation' | 'admin-cancel' | 'no-show' | null;

type AppointmentManagementModalProps = {
  appointment: AdminAppointment;
  nailSet?: NailSet;
  onClose: () => void;
  onUpdated: (appointment: AdminAppointment) => void;
};

function timeInputValue(value: string) {
  const minutes = salonMinutes(value);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function timeMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function addMinutes(value: string, amount: number) {
  return minutesTime(timeMinutes(value) + amount);
}

export function AppointmentManagementModal({ appointment, nailSet, onClose, onUpdated }: AppointmentManagementModalProps) {
  useLanguage();
  const [current, setCurrent] = useState(appointment);
  const [client, setClient] = useState<AdminUserDetail | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(appointment.estimatedPrice == null ? '' : Number(appointment.estimatedPrice).toFixed(2));
  const [estimatedPriceTouched, setEstimatedPriceTouched] = useState(false);
  const [finalPrice, setFinalPrice] = useState(appointment.finalPrice == null ? '' : Number(appointment.finalPrice).toFixed(2));
  const [serviceNotes, setServiceNotes] = useState(appointment.serviceNotes ?? '');
  const [date, setDate] = useState(salonDateKey(appointment.startAt));
  const [startTime, setStartTime] = useState(timeInputValue(appointment.startAt));
  const [schedule, setSchedule] = useState<AdminScheduleAvailability | null>(null);
  const [selectedWindowStart, setSelectedWindowStart] = useState<string | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [customTime, setCustomTime] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [uploadingReferences, setUploadingReferences] = useState(false);

  useEffect(() => {
    api<AdminUserDetail>(`/api/v1/admin/users/${appointment.customerId}`)
      .then(setClient)
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Unable to load client details.'));
  }, [appointment.customerId]);

  useEffect(() => {
    if (appointment.estimatedPrice != null || !appointment.serviceId || estimatedPriceTouched) return;
    let active = true;
    api<ServiceDefinition[]>('/api/v1/admin/services')
      .then((services) => {
        const service = services.find((item) => item.id === appointment.serviceId);
        if (active && service && !estimatedPriceTouched) {
          setEstimatedPrice(Number(service.price).toFixed(2));
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [appointment.estimatedPrice, appointment.serviceId, estimatedPriceTouched]);

  useEffect(() => {
    if (!showReschedule || (current.status !== 'PENDING_CONFIRMATION' && current.status !== 'CONFIRMED')) return;
    let active = true;
    setLoadingSchedule(true);
    setError(null);
    api<AdminScheduleAvailability>(`/api/v1/admin/appointments/${current.id}/availability?date=${date}`)
      .then((result) => {
        if (!active) return;
        setSchedule(result);
        const currentStart = salonDateKey(current.startAt) === date ? timeInputValue(current.startAt) : '';
        const matchingWindow = result.availableWindows.find((window) =>
          currentStart && timeMinutes(currentStart) >= timeMinutes(window.startTime) &&
          timeMinutes(currentStart) + result.durationMinutes <= timeMinutes(window.endTime));
        setSelectedWindowStart(matchingWindow?.startTime ?? null);
        setStartTime(matchingWindow ? currentStart : '');
      })
      .catch((cause) => {
        if (active) setError(cause instanceof ApiError ? cause.message : 'Unable to load available times.');
      })
      .finally(() => { if (active) setLoadingSchedule(false); });
    return () => { active = false; };
  }, [current.id, current.startAt, current.status, date, showReschedule]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !confirmation) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmation, onClose]);

  const contact = client?.phone || client?.loginPhone || client?.email || null;
  const contactHref = contact
    ? contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/[^+\d]/g, '')}`
    : null;
  const canReschedule = current.status === 'PENDING_CONFIRMATION' || current.status === 'CONFIRMED';
  const isCompleted = current.status === 'COMPLETED';
  const canUploadReferences = current.status === 'PENDING_CONFIRMATION' || current.status === 'CONFIRMED';
  const canEditDetails = ['PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED', 'COMPLETED'].includes(current.status);
  const appointmentEnded = new Date(current.endAt).getTime() <= Date.now();
  const appointmentStarted = new Date(current.startAt).getTime() <= Date.now();
  const statusCopy = statusLabel(current.status);
  const selectedWindow = schedule?.availableWindows.find((window) => window.startTime === selectedWindowStart) ?? null;
  const startOptions = selectedWindow
    ? Array.from(
      { length: Math.floor((timeMinutes(selectedWindow.endTime) - timeMinutes(selectedWindow.startTime) - (schedule?.durationMinutes ?? current.durationMinutes)) / 5) + 1 },
      (_, index) => minutesTime(timeMinutes(selectedWindow.startTime) + index * 5),
    )
    : [];
  const endTime = startTime ? addMinutes(startTime, schedule?.durationMinutes ?? current.durationMinutes) : '';

  function publish(updated: AdminAppointment) {
    setCurrent(updated);
    onUpdated(updated);
  }

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api<AdminAppointment>(`/api/v1/admin/appointments/${current.id}/visit-details`, {
        method: 'PUT',
        body: JSON.stringify({
          serviceNotes: serviceNotes.trim() || null,
          estimatedPrice: estimatedPrice.trim() === '' ? null : Number(estimatedPrice),
          finalPrice: isCompleted && finalPrice.trim() !== '' ? Number(finalPrice) : null,
        }),
      });
      publish(updated);
      onClose();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save appointment details.');
    } finally {
      setBusy(false);
    }
  }

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api<AdminAppointment>(`/api/v1/admin/appointments/${current.id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ date, startTime, endTime }),
      });
      publish(updated);
      setDate(salonDateKey(updated.startAt));
      setStartTime(timeInputValue(updated.startAt));
      setCustomTime(false);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to reschedule this appointment.');
    } finally {
      setBusy(false);
    }
  }

  async function transition(action: 'confirm' | 'reject' | 'cancel' | 'complete' | 'no-show') {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${current.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: `Updated from appointment management: ${action}` }),
      });
      publish({ ...current, ...updated });
      setConfirmation(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update this appointment.');
    } finally {
      setBusy(false);
    }
  }

  async function reviewCancellation(action: 'approve' | 'reject') {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${current.id}/cancellation-requests/${action}`, {
        method: 'POST',
        body: JSON.stringify({ reason: action === 'approve' ? 'Approved from appointment management' : 'Cancellation request declined' }),
      });
      publish({ ...current, ...updated });
      setConfirmation(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update this cancellation request.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadReferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (referenceFiles.length === 0) return;
    const body = new FormData();
    referenceFiles.forEach((file) => body.append('files', file));
    setUploadingReferences(true);
    setError(null);
    try {
      const updated = await api<Appointment>(`/api/v1/admin/appointments/${current.id}/references`, {
        method: 'POST',
        body,
      });
      publish({ ...current, ...updated });
      setReferenceFiles([]);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to upload reference photos.');
    } finally {
      setUploadingReferences(false);
    }
  }

  const confirmationContent = confirmation === 'reject'
    ? { title: t('Reject booking request'), message: t('Reject this booking request? The client will be notified to choose another time.'), label: t('Reject appointment') }
    : confirmation === 'approve-cancellation'
      ? { title: t('Approve cancellation'), message: t('Cancel this appointment and release the reserved time?'), label: t('Approve cancellation') }
      : confirmation === 'admin-cancel'
        ? { title: t('Cancel appointment'), message: t('Cancel this appointment and release the reserved time?'), label: t('Cancel appointment') }
      : { title: t('Mark as no show'), message: t('Mark this appointment as a no show?'), label: t('Mark no show') };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !confirmation) onClose(); }}>
    <PaperCard className="visit-details-modal appointment-management-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-management-title">
      <button className="modal-close" onClick={onClose} aria-label={t('Close')}>×</button>
      <div className="appointment-modal-heading">
        <div><p className="eyebrow">{t('APPOINTMENT MANAGEMENT')}</p><h2 id="appointment-management-title">{current.customerName || client?.name || t('Client')}</h2></div>
        <StatusBadge status={current.status} />
      </div>
      {error && <div className="form-notice">{t(error)}</div>}

      <div className="visit-summary appointment-management-summary">
        <div><span>{t('Client')}</span><strong>{current.customerName || client?.name || t('Client')}</strong></div>
        <div><span>{t('Service')}</span><strong>{current.serviceName}</strong></div>
        <div><span>{t('When')}</span><strong>{new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' }).format(new Date(current.startAt))} · {formatSalonTime(current.startAt)}–{formatSalonTime(current.endAt)} · {current.durationMinutes} {t('min')}</strong></div>
      </div>

      {(current.status === 'PENDING_CONFIRMATION' || current.status === 'CANCELLATION_REQUESTED') && <section className="appointment-contact-panel">
        <div><p className="eyebrow">{t('CONTACT CLIENT')}</p><strong>{contact || t('No contact information')}</strong></div>
        {contactHref && <a className="details-button" href={contactHref}>{contact?.includes('@') ? t('Send email') : t('Call client')}</a>}
      </section>}

      {current.status === 'PENDING_CONFIRMATION' && <div className="appointment-modal-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={() => setConfirmation('reject')}>{t('Reject')}</button>
        <button type="button" className="primary-button" disabled={busy} onClick={() => void transition('confirm')}>{busy ? t('Saving…') : t('Confirm appointment')}</button>
      </div>}

      {current.status === 'CANCELLATION_REQUESTED' && <div className="appointment-modal-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={() => void reviewCancellation('reject')}>{t('Keep appointment')}</button>
        <button type="button" className="primary-button" disabled={busy} onClick={() => setConfirmation('approve-cancellation')}>{t('Approve cancellation')}</button>
      </div>}

      {canReschedule && <section className="appointment-management-section">
        <button type="button" className="appointment-section-toggle" aria-expanded={showReschedule} onClick={() => setShowReschedule((value) => !value)}>
          <span><small>{t('SCHEDULE')}</small><strong>{t('Change appointment time')}</strong></span>
          <i aria-hidden="true">{showReschedule ? '−' : '+'}</i>
        </button>
        {showReschedule && <div className="appointment-reschedule-content">
          <div className="appointment-section-copy"><p>{t('Choose an open window. The appointment keeps its current duration and the end time is calculated automatically.')}</p></div>
          <form className="appointment-reschedule-form" onSubmit={reschedule}>
          <div className="appointment-date-picker"><span>{t('Date')}</span><DatePicker value={date} minDate={todayInSalon()} onChange={(value) => { setDate(value); setStartTime(''); setSelectedWindowStart(null); setCustomTime(false); }} required /></div>
          {loadingSchedule ? <p className="availability-loading">{t('Finding open times…')}</p> : schedule && <>
            <div className="reschedule-day-timeline">
              <div className="reschedule-timeline-axis"><span>{formatClock(schedule.dayStart)}</span><span>{formatClock(schedule.dayEnd)}</span></div>
              <div className="reschedule-timeline-track">
                {schedule.availableWindows.map((window) => {
                  const dayStart = timeMinutes(schedule.dayStart);
                  const dayLength = timeMinutes(schedule.dayEnd) - dayStart;
                  return <span className="reschedule-open-band" key={`${window.startTime}-${window.endTime}`} style={{ left: `${((timeMinutes(window.startTime) - dayStart) / dayLength) * 100}%`, width: `${((timeMinutes(window.endTime) - timeMinutes(window.startTime)) / dayLength) * 100}%` }} />;
                })}
                {schedule.busyPeriods.map((period, index) => {
                  const dayStart = timeMinutes(schedule.dayStart);
                  const dayLength = timeMinutes(schedule.dayEnd) - dayStart;
                  return <span className={`reschedule-busy-band ${period.type.toLowerCase()}`} title={`${period.label} · ${formatClock(period.startTime)}–${formatClock(period.endTime)}`} key={`${period.type}-${period.startTime}-${index}`} style={{ left: `${((timeMinutes(period.startTime) - dayStart) / dayLength) * 100}%`, width: `${((timeMinutes(period.endTime) - timeMinutes(period.startTime)) / dayLength) * 100}%` }}>{period.label}</span>;
                })}
              </div>
              <div className="reschedule-timeline-key"><span><i className="open" />{t('Available')}</span><span><i className="appointment" />{t('Appointment')}</span><span><i className="block" />{t('Blocked time')}</span></div>
            </div>
            <div className="available-window-list">
              {schedule.availableWindows.map((window) => <button type="button" className={selectedWindowStart === window.startTime ? 'selected' : ''} key={window.startTime} onClick={() => { setSelectedWindowStart(window.startTime); setStartTime(window.startTime.slice(0, 5)); }}>{formatClock(window.startTime)}–{formatClock(window.endTime)}</button>)}
              {schedule.availableWindows.length === 0 && <p>{t('No open window can fit this appointment on this date.')}</p>}
            </div>
          </>}
          {!customTime && selectedWindow && <div className="form-pair reschedule-time-fields"><label>{t('Start time')}<select value={startTime} onChange={(event) => setStartTime(event.target.value)} required>{startOptions.map((option) => <option value={option} key={option}>{formatClock(option)}</option>)}</select></label><label>{t('End time')}<div className="calculated-time"><strong>{formatClock(endTime)}</strong><small>{schedule?.durationMinutes ?? current.durationMinutes} {t('min')}</small></div></label></div>}
          {customTime && <div className="custom-reschedule-time"><p>{t('Custom times are useful outside the 8 AM–8 PM schedule. Availability is still checked before saving.')}</p><div className="form-pair"><label>{t('Start time')}<input type="time" step="300" max={minutesTime(24 * 60 - (schedule?.durationMinutes ?? current.durationMinutes) - 5)} value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></label><label>{t('End time')}<div className="calculated-time"><strong>{endTime ? formatClock(endTime) : '—'}</strong><small>{schedule?.durationMinutes ?? current.durationMinutes} {t('min')}</small></div></label></div></div>}
          <button type="button" className="reschedule-custom-toggle" onClick={() => { setCustomTime((value) => !value); setStartTime(customTime ? '' : timeInputValue(current.startAt)); setSelectedWindowStart(null); }}>{customTime ? t('Choose an available window') : t('Enter a custom time')}</button>
            <button className="secondary-button" disabled={busy || loadingSchedule || !startTime}>{busy ? t('Saving…') : t('Update time')}</button>
          </form>
        </div>}
      </section>}

      {canEditDetails && <section className="appointment-management-section">
        <div className="appointment-section-copy"><p className="eyebrow">{t('ADMIN ONLY')}</p></div>
        <form id="appointment-details-form" onSubmit={saveDetails}>
          {!isCompleted && <label>{t('Estimated price (CAD)')}<span className="optional">{t('admin reference only')}</span><div className="money-input"><span>$</span><input type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" value={estimatedPrice} onChange={(event) => { setEstimatedPriceTouched(true); setEstimatedPrice(event.target.value); }} placeholder="0.00" /></div></label>}
          {isCompleted && <label>{t('Final price paid (CAD)')}<div className="money-input"><span>$</span><input type="number" min="0" max="99999999.99" step="0.01" inputMode="decimal" value={finalPrice} onChange={(event) => setFinalPrice(event.target.value)} placeholder="0.00" /></div></label>}
          <label>{t('Internal service notes')}<span className="optional">{t('admin only')}</span><textarea value={serviceNotes} onChange={(event) => setServiceNotes(event.target.value)} maxLength={5000} placeholder={t('Products, colors, technique, adjustments…')} /></label>
        </form>
      </section>}

      {(current.referenceImages.length > 0 || canUploadReferences) && <div className="visit-reference-section"><p className="eyebrow">{t('CLIENT REFERENCES')}</p><p className="reference-shared-note">{t('Shared with the client and studio.')}</p><ReferencePhotoPicker files={referenceFiles} onChange={setReferenceFiles} existingImages={current.referenceImages} disabled={uploadingReferences} allowUpload={canUploadReferences} />{canUploadReferences && referenceFiles.length > 0 && <form className="appointment-reference-upload" onSubmit={uploadReferences}><button className="secondary-button" disabled={uploadingReferences}>{uploadingReferences ? t('Uploading photos…') : t('Upload photos')}</button></form>}</div>}

      {(isCompleted || nailSet) && <div className="visit-photo-section appointment-linked-photos">
        <div><p className="eyebrow">{t('NAIL SET')}</p><h3>{nailSet ? t('{count} linked photos', { count: nailSet.images.length }) : t('No photos linked yet')}</h3></div>
        {nailSet && <div className="appointment-linked-photo-strip">{nailSet.images.slice(0, 4).map((image) => <span key={image.id}><img src={image.url} alt={nailSet.title} /><a href={`${image.url}?download=true`} download aria-label={t('Download photo')}>🐾</a></span>)}</div>}
        {isCompleted && <Link className="details-button" to={`/inspiration?appointmentId=${current.id}`}>{nailSet ? t('Manage photos') : t('+ Add nail work')}</Link>}
      </div>}

      {current.status === 'CONFIRMED' && appointmentStarted && <div className="appointment-modal-actions appointment-completion-actions">
        <button type="button" className="secondary-button" disabled={busy} onClick={() => setConfirmation('no-show')}>{t('No show')}</button>
        <button type="button" className="primary-button" disabled={busy || !appointmentEnded} onClick={() => void transition('complete')}>{t('Complete')}</button>
      </div>}

      {canEditDetails && <div className={`appointment-footer-actions ${current.status === 'CONFIRMED' ? 'with-cancel' : ''}`}>
        {current.status === 'CONFIRMED' && <button type="button" className="secondary-button appointment-cancel-button" disabled={busy} onClick={() => setConfirmation('admin-cancel')}>{t('Cancel appointment')}</button>}
        <button type="submit" form="appointment-details-form" className="primary-button" disabled={busy}>{busy ? t('Saving…') : t('Save appointment details')}</button>
      </div>}

      <ConfirmModal
        open={confirmation !== null}
        tone="danger"
        title={confirmationContent.title}
        message={confirmationContent.message}
        confirmLabel={confirmationContent.label}
        pending={busy}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void (confirmation === 'reject' ? transition('reject') : confirmation === 'approve-cancellation' ? reviewCancellation('approve') : confirmation === 'admin-cancel' ? transition('cancel') : transition('no-show'))}
      />
    </PaperCard>
  </div>;
}
