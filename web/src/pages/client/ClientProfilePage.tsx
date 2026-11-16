import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/AuthContext';
import { PageHeading, PaperCard } from '../../components/UI';
import { api } from '../../lib/api';
import type { CurrentProfile } from '../../types';

export function ClientProfilePage() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  useEffect(() => { api<CurrentProfile>('/api/v1/users/me').then(setProfile); }, []);
  return <div className="client-page"><PageHeading eyebrow="ABOUT YOU" title="My profile" /><div className="profile-grid"><PaperCard className="profile-identity"><div className="profile-avatar">{profile?.name?.[0]?.toUpperCase() ?? 'K'}</div><h2>{profile?.name}</h2><p>{profile?.email}</p><button className="secondary-button" onClick={() => void logout()}>Sign out</button></PaperCard><PaperCard className="profile-details"><div><span>Phone</span><strong>{profile?.phone || 'Not added'}</strong></div><div><span>Birthday</span><strong>{profile?.birthday || 'Not added'}</strong></div><div><span>Instagram</span><strong>{profile?.instagram || 'Not added'}</strong></div><div><span>Preferred style</span><strong>{profile?.preferredNailStyle || 'Tell Kuri at your next visit'}</strong></div><div><span>Allergy notes</span><strong>{profile?.allergyNotes || 'None added'}</strong></div></PaperCard></div></div>;
}
