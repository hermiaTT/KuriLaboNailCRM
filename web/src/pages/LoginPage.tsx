import { t, useLanguage } from '../lib/i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { Brand, PaperCard } from '../components/UI';

export function LoginPage() {
  useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/', { replace: true });
    if (user?.role === 'USER') navigate('/client', { replace: true });
  }, [navigate, user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(phone.trim(), password);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to reach the Kuri Labo server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="confetti" aria-hidden="true" />
      <section className="login-intro">
        <Brand />
        <p className="eyebrow">{t("YOUR NAIL STORY")}</p>
        <h1>{t("A cozy place for your next set.")}</h1>
        <p>{t("Save inspiration, request appointments and keep your nail memories together.")}</p>
        <div className="login-doodle" aria-hidden="true">✿</div>
      </section>
      <PaperCard className="login-card">
        <p className="eyebrow">{t("WELCOME BACK")}</p>
        <h2>{t("Sign in to Kuri Labo")}</h2>
        <p className="muted">{t("Welcome back—your next nail idea is waiting.")}</p>
        <form onSubmit={handleSubmit}>
          <label>{t("Phone number")}<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="778-555-1234" required /><small className="field-hint">{t("Enter your 10-digit phone number. +1 is optional.")}</small></label>
          <label>{t("Password")}<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("Your password")} required /></label>
          {error && <p className="form-error" role="alert">{t(error)}</p>}
          <button className="primary-button" disabled={submitting}>{submitting ? t("Signing in…") : t("Sign in")}</button>
        </form>
        <p className="login-help">{t("New to Kuri Labo?")}<Link to="/register">{t("Create your account")}</Link></p>
        <p className="login-help password-help">{t("Forgot your password? Contact Kuri for help.")}</p>
      </PaperCard>
    </div>
  );
}
