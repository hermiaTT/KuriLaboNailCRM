import { t, getLocale, useLanguage } from '../../lib/i18n';
import { PaperCard, StatusBadge } from '../UI';
import { formatSalonTime } from '../../lib/dates';
import type { AdminAppointment, NailSet } from '../../types';
import { ReferencePhotoPicker } from '../ReferencePhotoPicker';

export function ClientAppointmentCard({ appointment, nailSet }: { appointment: AdminAppointment; nailSet?: NailSet }) {
  useLanguage();
  const start = new Date(appointment.startAt);
  const visitDate = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver',
  }).format(start);

  return (
    <PaperCard className="client-timeline-card">
      <div className="client-timeline-date"><strong>{new Intl.DateTimeFormat(getLocale(), { day: 'numeric', timeZone: 'America/Vancouver' }).format(start)}</strong><span>{new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'America/Vancouver' }).format(start)}</span></div>
      <div className="client-timeline-copy">
        <div className="client-timeline-title"><div><h3>{appointment.serviceName}</h3><StatusBadge status={appointment.status} /></div>{appointment.finalPrice != null && <b>${Number(appointment.finalPrice).toFixed(2)}</b>}</div>
        <p className="client-timeline-when">{visitDate} · {formatSalonTime(appointment.startAt)}–{formatSalonTime(appointment.endAt)} · {appointment.durationMinutes} {t("min")}</p>
        {appointment.note && <p className="client-visible-note"><span>{t("Client note")}</span>{appointment.note}</p>}
        {appointment.serviceNotes && <p className="client-private-note"><span>{t("Admin note")}</span>{appointment.serviceNotes}</p>}

        {(appointment.referenceImages.length > 0 || nailSet?.images.length) && <div className="client-visit-media">
          {appointment.referenceImages.length > 0 && <div><span>{t("References")}</span><ReferencePhotoPicker files={[]} onChange={() => undefined} existingImages={appointment.referenceImages} allowUpload={false} /></div>}
          {nailSet && nailSet.images.length > 0 && <div><span>{t("Finished set")}</span><div>{nailSet.images.map((image) => <a href={image.url} target="_blank" rel="noreferrer" key={image.id}><img src={image.url} alt={nailSet.title} /></a>)}</div></div>}
        </div>}
      </div>
    </PaperCard>
  );
}
