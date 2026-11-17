import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api';
import { Brand, PaperCard } from '../components/UI';

export function LoginPage() {
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
      setError(cause instanceof ApiError ? cause.message : 'Unable to reach the Kuri Labo server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="confetti" aria-hidden="true" />
      <section className="login-intro">
        <Brand />
        <p className="eyebrow">YOUR NAIL STORY</p>
        <h1>A cozy place for your next set.</h1>
        <p>Save inspiration, request appointments and keep your nail memories together.</p>
        <div className="login-doodle" aria-hidden="true">✿</div>
      </section>
      <PaperCard className="login-card">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to Kuri Labo</h2>
        <p className="muted">Welcome back—your next nail idea is waiting.</p>
        <form onSubmit={handleSubmit}>
          <label>Phone number<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="778-555-1234" required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="login-help">New to Kuri Labo? <Link to="/register">Create your account</Link></p>
      </PaperCard>
    </div>
  );
}
