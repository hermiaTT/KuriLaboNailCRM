import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { Brand, PaperCard } from '../components/UI';
import { ApiError } from '../lib/api';

export function RegisterPage() {
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
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: String(data.get('name')).trim(),
        email: String(data.get('email')).trim(),
        password,
        phone: String(data.get('phone') || '').trim() || null,
        birthday: String(data.get('birthday') || '') || null,
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page register-page">
      <div className="confetti" aria-hidden="true" />
      <section className="login-intro">
        <Brand />
        <p className="eyebrow">JOIN KURI LABO</p>
        <h1>Your nail diary starts here.</h1>
        <p>Book your next visit, collect your favorite sets and keep every little detail close.</p>
        <div className="login-doodle" aria-hidden="true">♡</div>
      </section>
      <PaperCard className="login-card register-card">
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h2>Nice to meet you</h2>
        <p className="muted">Tell us a little about yourself.</p>
        <form onSubmit={handleSubmit}>
          <label>Full name<input name="name" autoComplete="name" placeholder="Your name" maxLength={120} required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <div className="form-pair"><label>Phone <span className="optional">optional</span><input name="phone" type="tel" autoComplete="tel" placeholder="604-555-0123" maxLength={40} /></label><label>Birthday <span className="optional">optional</span><input name="birthday" type="date" max={new Date().toISOString().split('T')[0]} /></label></div>
          <div className="form-pair"><label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required /></label><label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} placeholder="Type it again" required /></label></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={submitting}>{submitting ? 'Creating your account…' : 'Create account'}</button>
        </form>
        <p className="login-help">Already have an account? <Link to="/login">Sign in</Link></p>
      </PaperCard>
    </div>
  );
}
