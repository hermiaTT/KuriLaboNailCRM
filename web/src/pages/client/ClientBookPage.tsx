import { formatClock, t, useLanguage } from '../../lib/i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { BookingCalendar } from '../../components/BookingCalendar';
import { PageHeading, PaperCard } from '../../components/UI';
import { addDays, longDateLabel, todayInSalon } from '../../lib/dates';
import { api, ApiError } from '../../lib/api';
import type { Appointment, Availability, ServiceDefinition } from '../../types';

function displaySlot(value: string) {
  return formatClock(value);
}

export function ClientBookPage() {
  useLanguage();
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(addDays(todayInSalon(), 1));
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [slot, setSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Appointment | null>(null);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  useEffect(() => {
    api<ServiceDefinition[]>('/api/v1/services').then((items) => { setServices(items); if (items[0]) setServiceId(items[0].id); });
  }, []);

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoadingSlots(true); setSlot(''); setError(null);
    api<Availability>(`/api/v1/availability?date=${date}&serviceId=${serviceId}`)
      .then(setAvailability)
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "Unable to load times."))
      .finally(() => setLoadingSlots(false));
  }, [date, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) { setError("Choose an available start time."); return; }
    const data = new FormData(event.currentTarget);
    setSubmitting(true); setError(null);
    try {
      let appointment = await api<Appointment>('/api/v1/appointments', { method: 'POST', body: JSON.stringify({ serviceId, date, startTime: slot, note: data.get('note') || null }) });
      if (referenceFiles.length) {
        const references = new FormData();
        referenceFiles.forEach((file) => references.append('files', file));
        appointment = await api<Appointment>(`/api/v1/appointments/${appointment.id}/references`, { method: 'POST', body: references });
      }
      setCreated(appointment);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to request this appointment.");
    } finally { setSubmitting(false); }
  }

  if (created) return <div className="client-page"><PaperCard className="booking-success"><span>✿</span><p className="eyebrow">{t("REQUEST SENT")}</p><h1>{t("Your time is being held")}</h1><p>{created.serviceName} · {longDateLabel(date)} {t("at")}{displaySlot(slot)}</p><p className="muted">{t("Kuri will confirm your appointment soon. Pending requests reserve the selected time.")}</p><Link className="primary-button" to="/client/appointments">{t("View my appointments")}</Link></PaperCard></div>;

  return <div className="client-page"><PageHeading eyebrow={t("BOOK YOUR VISIT")} title={t("Pick a service and time")} /><form className="booking-layout" onSubmit={submit}><section><h2>{t("1. Choose your service")}</h2><div className="book-service-grid">{services.map((service, index) => <button type="button" className={serviceId === service.id ? 'selected' : ''} onClick={() => setServiceId(service.id)} key={service.id}><span>0{index + 1}</span><strong>{service.name}</strong><small>{service.durationMinutes < 60 ? t("{count} min", { count: service.durationMinutes }) : t("{count} hr", { count: service.durationMinutes / 60 })} · ${Number(service.price).toFixed(2)}</small></button>)}</div><h2>{t("2. Pick a date")}</h2><BookingCalendar value={date} minDate={todayInSalon()} onChange={setDate} /><p className="chosen-date">{longDateLabel(date)}</p></section><section><h2>{t("3. Select a start time")}</h2><PaperCard className="slot-card">{loadingSlots ? <p className="slot-message">{t("Finding open times…")}</p> : <div className="slot-grid">{availability?.slots.map((item) => <button type="button" disabled={!item.available} className={slot === item.startTime ? 'selected' : ''} onClick={() => setSlot(item.startTime)} key={item.startTime}>{displaySlot(item.startTime)}</button>)}</div>}</PaperCard><h2>{t("4. Notes and reference photos")}</h2><PaperCard className="booking-note"><textarea name="note" maxLength={1000} placeholder={t("Colors, shapes, inspiration or special requests…")} /><label className="booking-reference-picker">{t("Reference photos")}<span className="optional">{t("optional · up to 6")}</span><input type="file" accept="image/*" multiple onChange={(event) => setReferenceFiles(Array.from(event.target.files ?? []).slice(0, 6))} /></label>{referenceFiles.length > 0 && <div className="booking-reference-preview">{referenceFiles.map((file) => <img key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} alt="" />)}</div>}</PaperCard>{error && <p className="form-error">{t(error)}</p>}<button className="primary-button booking-submit" disabled={submitting || !slot}>{submitting ? t("Sending request…") : t("Request appointment")}</button><p className="booking-fine-print">{t("Your request will be pending until Kuri confirms it.")}</p></section></form></div>;
}
