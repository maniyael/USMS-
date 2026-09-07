import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { getRemembered } from '../api';
import { Button, FormError, Field, Input, PasswordInput } from '../components/ui';
import { Icon } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(getRemembered());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login(username.trim(), password, remember);
      navigate(res.mustChangePassword ? '/change-password' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <div className="auth-brand">
          <div className="emblem">
            <Icon name="graduationCap" />
          </div>
          <div>
            <div className="auth-brand-name">USMS</div>
            <div className="auth-brand-sub">University Student Management System</div>
          </div>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <div>
            <div className="auth-accent" />
            <h1>Welcome back</h1>
            <p className="auth-sub">Sign in with your university account to continue.</p>
          </div>

          <FormError text={error} />

          <Field label="Username" required>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="e.g. admin or 2529i001"
              autoFocus
              required
            />
          </Field>

          <Field label="Password" required>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </Field>

          <div className="auth-remember-row">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="link-btn" onClick={() => setError('Please contact the ICT Support Office at support@university.edu to reset your password.')}>
              Forgot password?
            </button>
          </div>

          <Button type="submit" disabled={busy} className={busy ? '' : 'btn-gold'}>
            {busy ? (
              <>
                <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.25)', borderTopColor: 'var(--ink)' }} />
                Signing in...
              </>
            ) : (
              <>
                <Icon name="lock" /> Sign in
              </>
            )}
          </Button>
        </form>

        <div className="auth-footer">
          Authorised access only · Transactions are securely audited
        </div>
      </div>
    </div>
  );
}