import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useAuth } from '../auth';
import { Button, Field, FormError, PasswordInput } from '../components/ui';
import { Icon } from '../components/icons';

export default function ChangePassword() {
  const { user, logout, refresh, token } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await http.post<{ message: string }>('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setBusy(false);
    }
  }

  if (!token) return null;

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
            <h1>Set a new password</h1>
            <p className="auth-sub">
              Welcome, <b>{user?.username}</b>. Set your permanent password to continue.
            </p>
          </div>

          <FormError text={error} />

          <Field label="Current password" required>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Temporary password"
              required
              autoFocus
            />
          </Field>
          <Field label="New password" required hint="At least 8 characters.">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
          </Field>
          <Field label="Confirm new password" required>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
            />
          </Field>

          <Button type="submit" disabled={busy} className="btn-gold">
            {busy ? 'Saving...' : 'Change password'}
          </Button>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            <Icon name="logout" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}