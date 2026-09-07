import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../api';
import { useAuth } from '../auth';
import { Button, Field, FormError, Input } from '../components/ui';

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
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-logo">USMS</div>
        <h1>Change Password</h1>
        <p className="muted">
          Welcome, <b>{user?.username}</b>. You must change your temporary password to continue.
        </p>
        <FormError text={error} />
        <Field label="Current password" required>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="New password" required>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Field>
        <Field label="Confirm new password" required>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving...' : 'Change password'}
        </Button>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Sign out
        </button>
      </form>
    </div>
  );
}