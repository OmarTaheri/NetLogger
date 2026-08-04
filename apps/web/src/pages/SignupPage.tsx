import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const { register, googleSignIn, config } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = useCallback(async (credential: string) => {
    setError(''); setLoading(true);
    try { await googleSignIn(credential); navigate('/app', { replace: true }); }
    catch (err: any) { setError(err.message || 'Google sign-up failed'); }
    finally { setLoading(false); }
  }, [googleSignIn, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try { await register(displayName, email, password); navigate('/app', { replace: true }); }
    catch (err: any) { setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell eyebrow="Initialize account // 02" title="Create your signal room">
      <GoogleSignInButton label="signup_with" onCredential={handleGoogle} onError={setError} />
      {config.googleEnabled && <div className="auth-divider"><span>or register with email</span></div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Display name<input autoFocus autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} minLength={2} required /></label>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} required /><small>12 characters minimum</small></label>
        <label>Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={12} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={loading}>{loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthShell>
  );
}
