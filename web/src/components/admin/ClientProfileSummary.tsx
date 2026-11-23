import { PaperCard, StatusBadge } from '../UI';
import type { AdminUserDetail } from '../../types';

function valueOrEmpty(value: string | null, fallback = 'Not provided') {
  return value?.trim() || fallback;
}

export function ClientProfileSummary({ client }: { client: AdminUserDetail }) {
  return (
    <section className="client-profile-summary">
      <PaperCard className="client-profile-identity-card">
        <div className="client-profile-avatar">
          {client.avatarUrl ? <img src={client.avatarUrl} alt={`${client.name} profile`} /> : client.name[0]?.toUpperCase()}
        </div>
        <div className="client-profile-name">
          <div><h2>{client.name}</h2><StatusBadge status={client.status} /></div>
          <p>{client.accountType === 'GUEST' ? 'Admin-created guest client' : client.email || 'Registered client'}</p>
          <span>{client.phone || 'No phone number'}</span>
        </div>
      </PaperCard>

      <PaperCard className="client-profile-details-card">
        <div className="client-profile-facts">
          <div><span>Birthday</span><strong>{client.birthday ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${client.birthday}T12:00:00`)) : 'Not provided'}</strong></div>
          <div><span>Instagram</span><strong>{valueOrEmpty(client.instagram)}</strong></div>
          <div><span>WeChat</span><strong>{valueOrEmpty(client.wechat)}</strong></div>
          <div><span>Client since</span><strong>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(client.createdAt))}</strong></div>
        </div>
        <div className="client-preference-grid">
          <div><span>Preferred nail style</span><p>{valueOrEmpty(client.preferredNailStyle, 'No preference recorded yet.')}</p></div>
          <div className="sensitivity"><span>Allergy / sensitivity</span><p>{valueOrEmpty(client.allergyNotes, 'No allergy notes recorded.')}</p></div>
          <div className="admin-only"><span>Private admin notes</span><p>{valueOrEmpty(client.adminNotes, 'No private notes yet.')}</p></div>
        </div>
      </PaperCard>
    </section>
  );
}
