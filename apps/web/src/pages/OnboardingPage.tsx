import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../hooks/useAuth';

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await completeOnboarding(displayName, username.trim() || undefined);
      navigate(updated.role === 'admin' ? '/admin' : '/app', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell eyebrow="Workspace setup // 03" title="Make it yours">
      <p className="mb-6 text-sm text-hud-text-muted">Choose how your workspace identifies you. You can change your display name later.</p>
      <form onSubmit={submit} className="auth-form">
        <label>What should we call you?<input autoFocus autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={80} required /></label>
        <label>Username <small>optional · lowercase letters, numbers, and hyphens</small><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} minLength={3} maxLength={32} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="signal-operator" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={saving}>{saving ? 'SAVING…' : 'ENTER WORKSPACE'}</button>
      </form>
    </AuthShell>
  );
}
