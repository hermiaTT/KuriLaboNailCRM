import { t, useLanguage } from '../lib/i18n';
import { PageHeading, PaperCard } from '../components/UI';

export function PlaceholderPage({ type }: { type: 'schedule' | 'inspiration' }) {
  useLanguage();
  const schedule = type === 'schedule';
  return <div className="page"><PageHeading eyebrow={schedule ? t("AVAILABILITY") : t("VISUAL LIBRARY")} title={schedule ? t("Studio schedule") : t("Inspiration")} /><PaperCard className="coming-card"><span>{schedule ? '◷' : '✿'}</span><h2>{schedule ? t("Calendar view is next") : t("Photo library is next")}</h2><p>{t("The page shell is ready. The next slice will connect")} {schedule ? t("availability blocks and the booking calendar") : t("uploads, collections and saved inspiration")} {t("to the Spring Boot API.")}</p></PaperCard></div>;
}
