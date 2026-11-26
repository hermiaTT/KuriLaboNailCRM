import { t, useLanguage } from '../../lib/i18n';
import { LANGUAGES, isLanguageSaved, LANGUAGE_SAVE_ERROR } from '../../../../shared/i18n/core';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '../../auth/AuthContext';
import { DatePicker } from '../../components/DatePicker';
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
  preferredLanguage: string;
};

const EMPTY_FORM: ProfileForm = {
  name: '',
  phone: '',
  birthday: '',
  instagram: '',
  wechat: '',
  preferredNailStyle: '',
  allergyNotes: '',
  preferredLanguage: 'en',
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
    preferredLanguage: profile.preferredLanguage ?? 'en',
  };
}

const MAX_BIRTHDAY = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];

export function ClientProfilePage() {
  useLanguage();
  const { logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    api<CurrentProfile>('/api/v1/users/me')
      .then((nextProfile) => {
        setProfile(nextProfile);
        setForm(formFromProfile(nextProfile));
      })
      .catch(() => setError("Unable to load your profile."))
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
          preferredLanguage: form.preferredLanguage,
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          birthday: form.birthday || null,
          instagram: form.instagram.trim() || null,
          wechat: form.wechat.trim() || null,
          preferredNailStyle: form.preferredNailStyle.trim() || null,
          allergyNotes: form.allergyNotes.trim() || null,
        }),
      });
      if (!isLanguageSaved(updated, form.preferredLanguage)) {
        setError(LANGUAGE_SAVE_ERROR);
        return;
      }
      setProfile(updated);
      setForm(formFromProfile(updated));
      await refreshUser(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) { setPasswordMessage("New passwords do not match."); return; }
    setChangingPassword(true); setPasswordMessage(null);
    try {
      await api<void>('/api/v1/users/me/password', { method: 'PUT', body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }) });
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordMessage("Password updated. Use the new password next time you sign in.");
    } catch (cause) {
      setPasswordMessage(cause instanceof ApiError ? cause.message : "Unable to update your password.");
    } finally { setChangingPassword(false); }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    setUploadingAvatar(true); setError(null);
    const body = new FormData(); body.append('file', file);
    try {
      const updated = await api<CurrentProfile>('/api/v1/users/me/avatar', { method: 'POST', body });
      setProfile(updated);
      await refreshUser();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to upload your profile photo.");
    } finally { setUploadingAvatar(false); }
  }

  return (
    <div className="client-page">
      <PageHeading eyebrow={t("ABOUT YOU")} title={t("My profile")} />
      {error && <div className="form-notice profile-notice" role="alert">{t(error)}</div>}
      <div className="profile-grid">
        <PaperCard className="profile-identity">
          <label className="profile-avatar-picker">
            <span className="profile-avatar">{profile?.avatarUrl ? <img src={profile.avatarUrl} alt={t("Profile")} /> : profile?.name?.[0]?.toUpperCase() ?? 'K'}</span>
            <input type="file" accept="image/*" disabled={uploadingAvatar} onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
            <small>{uploadingAvatar ? t("Uploading…") : t("Change photo")}</small>
          </label>
          <h2>{profile?.name || (loading ? t("Loading…") : t("Kuri client"))}</h2>
          <p>{profile?.phone}</p>
          <span className="profile-privacy-note">{t("Only you and Kuri can see these details.")}</span>
          <button className="secondary-button" onClick={() => void logout()}>{t("Sign out")}</button>
        </PaperCard>

        <PaperCard className="profile-edit-card">
          <div className="profile-form-heading">
            <div><p className="eyebrow">{t("PERSONAL DETAILS")}</p><h2>{t("Keep your notes up to date")}</h2></div>
            {saved && <span className="save-success" role="status">{t("Saved ✓")}</span>}
          </div>
          <form onSubmit={handleSubmit}>
            <label>{t("Language")}<select value={form.preferredLanguage} onChange={(event) => updateField('preferredLanguage', event.target.value)} disabled={loading || saving}>{LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label>{t("Full name")}<input value={form.name} onChange={(event) => updateField('name', event.target.value)} autoComplete="name" maxLength={120} required disabled={loading} /></label>
            <div className="form-pair">
              <label>{t("Phone")}<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} type="tel" autoComplete="tel" maxLength={40} placeholder="778-555-1234" required disabled={loading} /></label>
              <label>{t("Birthday")}<span className="optional">{t("optional")}</span><DatePicker value={form.birthday} onChange={(value) => updateField('birthday', value)} maxDate={MAX_BIRTHDAY} disabled={loading} /></label>
            </div>
            <div className="form-pair">
              <label>{t("Instagram")}<span className="optional">{t("optional")}</span><input value={form.instagram} onChange={(event) => updateField('instagram', event.target.value)} maxLength={120} placeholder="@yourhandle" disabled={loading} /></label>
              <label>{t("WeChat")}<span className="optional">{t("optional")}</span><input value={form.wechat} onChange={(event) => updateField('wechat', event.target.value)} maxLength={120} placeholder={t("Your WeChat ID")} disabled={loading} /></label>
            </div>
            <label>{t("Preferred nail style")}<span className="optional">{t("optional")}</span><textarea value={form.preferredNailStyle} onChange={(event) => updateField('preferredNailStyle', event.target.value)} maxLength={1000} placeholder={t("Colors, shapes, finishes or styles you love…")} disabled={loading} /></label>
            <label>{t("Allergy or sensitivity notes")}<span className="optional">{t("optional")}</span><textarea value={form.allergyNotes} onChange={(event) => updateField('allergyNotes', event.target.value)} maxLength={1000} placeholder={t("Share anything Kuri should know before your visit…")} disabled={loading} /></label>
            <div className="profile-form-actions"><small>{t("Your phone number is used for sign-in. If you change it, use the new number next time.")}</small><button className="primary-button" disabled={loading || saving}>{saving ? t("Saving…") : t("Save changes")}</button></div>
          </form>
        </PaperCard>
        <PaperCard className="profile-edit-card profile-security-card">
          <div className="profile-form-heading"><div><p className="eyebrow">{t("SECURITY")}</p><h2>{t("Change password")}</h2></div></div>
          <form onSubmit={changePassword}>
            <label>{t("Current password")}<input type="password" value={passwords.current} onChange={(event) => setPasswords((value) => ({ ...value, current: event.target.value }))} autoComplete="current-password" required /></label>
            <div className="form-pair"><label>{t("New password")}<input type="password" value={passwords.next} onChange={(event) => setPasswords((value) => ({ ...value, next: event.target.value }))} autoComplete="new-password" minLength={8} maxLength={100} required /></label><label>{t("Confirm new password")}<input type="password" value={passwords.confirm} onChange={(event) => setPasswords((value) => ({ ...value, confirm: event.target.value }))} autoComplete="new-password" minLength={8} maxLength={100} required /></label></div>
            {passwordMessage && <div className="account-message" role="status">{t(passwordMessage)}</div>}
            <div className="profile-form-actions"><small>{t("At least 8 characters. Other saved sessions will need the new password.")}</small><button className="primary-button" disabled={changingPassword}>{changingPassword ? t("Updating…") : t("Update password")}</button></div>
          </form>
        </PaperCard>
      </div>
    </div>
  );
}
