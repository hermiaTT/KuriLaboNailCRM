import { t, useLanguage } from '../lib/i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { DatePicker } from '../components/DatePicker';
import { Brand, PaperCard } from '../components/UI';
import { ApiError } from '../lib/api';
import { todayInSalon } from '../lib/dates';

export function RegisterPage() {
  useLanguage();
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/', { replace: true });
    if (user?.role === 'USER') navigate('/client', { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));
    if (password !== String(data.get('confirmPassword'))) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: String(data.get('name')).trim(),
        email: String(data.get('email') || '').trim() || null,
        password,
        phone: String(data.get('phone')).trim(),
        birthday: String(data.get('birthday') || '') || null,
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page register-page">
      <div className="confetti" aria-hidden="true" />
      <section className="login-intro">
        <Brand />
        <p className="eyebrow">{t("JOIN KURI LABO")}</p>
        <h1>{t("Your nail diary starts here.")}</h1>
        <p>{t("Book your next visit, collect your favorite sets and keep every little detail close.")}</p>
        <div className="login-doodle" aria-hidden="true">♡</div>
      </section>
      <PaperCard className="login-card register-card">
        <p className="eyebrow">{t("CREATE ACCOUNT")}</p>
        <h2>{t("Nice to meet you")}</h2>
        <p className="muted">{t("Tell us a little about yourself.")}</p>
        <form onSubmit={handleSubmit}>
          <label>{t("Full name")}<input name="name" autoComplete="name" placeholder={t("Your name")} maxLength={120} required /></label>
          <label>{t("Phone number")}<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="778-555-1234" maxLength={40} required /></label>
          <div className="form-pair"><label>{t("Email")}<span className="optional">{t("optional")}</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" /></label><label>{t("Birthday")}<span className="optional">{t("optional")}</span><DatePicker name="birthday" maxDate={todayInSalon()} /></label></div>
          <div className="form-pair"><label>{t("Password")}<input name="password" type="password" autoComplete="new-password" minLength={8} placeholder={t("At least 8 characters")} required /></label><label>{t("Confirm password")}<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder={t("Type it again")} required /></label></div>
          {error && <p className="form-error" role="alert">{t(error)}</p>}
          <button className="primary-button" disabled={submitting}>{submitting ? t("Creating your account…") : t("Create account")}</button>
        </form>
        <p className="login-help">{t("Already have an account?")}<Link to="/login">{t("Sign in")}</Link></p>
      </PaperCard>
    </div>
  );
}
