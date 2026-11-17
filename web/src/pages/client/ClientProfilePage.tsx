import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '../../auth/AuthContext';
import { PageHeading, PaperCard } from '../../components/UI';
import { api, ApiError } from '../../lib/api';
import type { CurrentProfile } from '../../types';

type ProfileForm = {
  name: string;
  phone: string;
  birthday: string;
  instagram: string;
  wechat: string;
  preferredNailStyle: string;
  allergyNotes: string;
};

const EMPTY_FORM: ProfileForm = {
  name: '',
  phone: '',
  birthday: '',
  instagram: '',
  wechat: '',
  preferredNailStyle: '',
  allergyNotes: '',
};

function formFromProfile(profile: CurrentProfile): ProfileForm {
  return {
    name: profile.name,
    phone: profile.phone ?? '',
    birthday: profile.birthday ?? '',
    instagram: profile.instagram ?? '',
    wechat: profile.wechat ?? '',
    preferredNailStyle: profile.preferredNailStyle ?? '',
    allergyNotes: profile.allergyNotes ?? '',
  };
}

const MAX_BIRTHDAY = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

export function ClientProfilePage() {
  const { logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<CurrentProfile>('/api/v1/users/me')
      .then((nextProfile) => {
        setProfile(nextProfile);
        setForm(formFromProfile(nextProfile));
      })
      .catch(() => setError('Unable to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: keyof ProfileForm, value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api<CurrentProfile>('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          birthday: form.birthday || null,
          instagram: form.instagram.trim() || null,
          wechat: form.wechat.trim() || null,
          preferredNailStyle: form.preferredNailStyle.trim() || null,
          allergyNotes: form.allergyNotes.trim() || null,
        }),
      });
      setProfile(updated);
      setForm(formFromProfile(updated));
      await refreshUser();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="client-page">
      <PageHeading eyebrow="ABOUT YOU" title="My profile" />
      {error && <div className="form-notice profile-notice" role="alert">{error}</div>}
      <div className="profile-grid">
        <PaperCard className="profile-identity">
          <div className="profile-avatar">{profile?.name?.[0]?.toUpperCase() ?? 'K'}</div>
          <h2>{profile?.name || (loading ? 'Loading…' : 'Kuri client')}</h2>
          <p>{profile?.phone}</p>
          <span className="profile-privacy-note">Only you and Kuri can see these details.</span>
          <button className="secondary-button" onClick={() => void logout()}>Sign out</button>
        </PaperCard>

        <PaperCard className="profile-edit-card">
          <div className="profile-form-heading">
            <div><p className="eyebrow">PERSONAL DETAILS</p><h2>Keep your notes up to date</h2></div>
            {saved && <span className="save-success" role="status">Saved ✓</span>}
          </div>
          <form onSubmit={handleSubmit}>
            <label>Full name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} autoComplete="name" maxLength={120} required disabled={loading} /></label>
            <div className="form-pair">
              <label>Phone<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} type="tel" autoComplete="tel" maxLength={40} placeholder="778-555-1234" required disabled={loading} /></label>
              <label>Birthday <span className="optional">optional</span><input value={form.birthday} onChange={(event) => updateField('birthday', event.target.value)} type="date" max={MAX_BIRTHDAY} disabled={loading} /></label>
            </div>
            <div className="form-pair">
              <label>Instagram <span className="optional">optional</span><input value={form.instagram} onChange={(event) => updateField('instagram', event.target.value)} maxLength={120} placeholder="@yourhandle" disabled={loading} /></label>
              <label>WeChat <span className="optional">optional</span><input value={form.wechat} onChange={(event) => updateField('wechat', event.target.value)} maxLength={120} placeholder="Your WeChat ID" disabled={loading} /></label>
            </div>
            <label>Preferred nail style <span className="optional">optional</span><textarea value={form.preferredNailStyle} onChange={(event) => updateField('preferredNailStyle', event.target.value)} maxLength={1000} placeholder="Colors, shapes, finishes or styles you love…" disabled={loading} /></label>
            <label>Allergy or sensitivity notes <span className="optional">optional</span><textarea value={form.allergyNotes} onChange={(event) => updateField('allergyNotes', event.target.value)} maxLength={1000} placeholder="Share anything Kuri should know before your visit…" disabled={loading} /></label>
            <div className="profile-form-actions"><small>Your phone number is used for sign-in. If you change it, use the new number next time.</small><button className="primary-button" disabled={loading || saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </PaperCard>
      </div>
    </div>
  );
}
