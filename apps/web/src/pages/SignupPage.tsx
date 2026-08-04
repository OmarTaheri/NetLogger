import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const { googleSignIn, config } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await googleSignIn(credential);
      navigate(user.onboardingCompleted ? '/app' : '/onboarding', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  }, [googleSignIn, navigate]);

  return (
    <AuthShell eyebrow="Initialize account // 02" title="Create your signal room">
      <GoogleSignInButton label="signup_with" onCredential={handleGoogle} onError={setError} />
      {!config.googleEnabled && <p className="auth-error" role="alert">Google sign-in is not configured yet.</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="mt-5 text-sm text-hud-text-muted">New accounts use Google sign-in, then choose a display name and optional username.</p>
      {loading && <p className="mt-4 font-mono text-hud-sm text-hud-accent">AUTHENTICATING…</p>}
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
