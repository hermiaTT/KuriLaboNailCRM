import { t, getLocale, useLanguage } from '../../lib/i18n';
import { PaperCard } from '../UI';
import type { AdminUserDetail } from '../../types';

function valueOrEmpty(value: string | null, fallback = t("Not provided")) {
  return value?.trim() || fallback;
}

export function ClientProfileSummary({ client }: { client: AdminUserDetail }) {
  useLanguage();
  return (
    <section className="client-profile-summary">
      <PaperCard className="client-profile-identity-card">
        <div className="client-profile-avatar">
          {client.avatarUrl ? <img src={client.avatarUrl} alt={t("{name} profile", { name: client.name })} /> : client.name[0]?.toUpperCase()}
        </div>
        <div className="client-profile-name">
          <div><h2>{client.name}</h2></div>
          <p>{client.accountType === 'GUEST' ? t("Admin-created guest client") : client.email || t("Registered client")}</p>
          <span>{client.phone || t("No phone number")}</span>
        </div>
      </PaperCard>

      <PaperCard className="client-profile-details-card">
        <div className="client-profile-facts">
          <div><span>{t("Birthday")}</span><strong>{client.birthday ? new Intl.DateTimeFormat(getLocale(), { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${client.birthday}T12:00:00`)) : t("Not provided")}</strong></div>
          <div><span>{t("Instagram")}</span><strong>{valueOrEmpty(client.instagram)}</strong></div>
          <div><span>{t("WeChat")}</span><strong>{valueOrEmpty(client.wechat)}</strong></div>
          <div><span>{t("Client since")}</span><strong>{new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(client.createdAt))}</strong></div>
        </div>
        <div className="client-preference-grid">
          <div><span>{t("Preferred nail style")}</span><p>{valueOrEmpty(client.preferredNailStyle, t("No preference recorded yet."))}</p></div>
          <div className="sensitivity"><span>{t("Allergy / sensitivity")}</span><p>{valueOrEmpty(client.allergyNotes, t("No allergy notes recorded."))}</p></div>
          <div className="admin-only"><span>{t("Private admin notes")}</span><p>{valueOrEmpty(client.adminNotes, t("No private notes yet."))}</p></div>
        </div>
      </PaperCard>
    </section>
  );
}
