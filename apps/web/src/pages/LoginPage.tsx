import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';
import DemoAccountPicker from '../components/DemoAccountPicker';
import type { DemoAccount } from '../api/auth';

export default function LoginPage() {
  const { login, googleSignIn, config } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestedDestination = (location.state as { from?: string } | null)?.from;

  const complete = useCallback((user: { role: 'user' | 'admin' }) => {
    navigate(requestedDestination || (user.role === 'admin' ? '/admin' : '/app'), { replace: true });
  }, [requestedDestination, navigate]);
  const handleGoogle = useCallback(async (credential: string) => {
    setError('');
    setLoading(true);
    try { const user = await googleSignIn(credential); complete(user); }
    catch (err: any) { setError(err.message || 'Google sign-in failed'); }
    finally { setLoading(false); }
  }, [complete, googleSignIn]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try { const user = await login(identifier, password); complete(user); }
    catch (err: any) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const chooseDemoAccount = (account: DemoAccount) => {
    setError('');
    setIdentifier(account.email);
    setPassword(account.password);
  };

  return (
    <AuthShell eyebrow="Secure access // 01" title="Welcome back">
      <DemoAccountPicker accounts={config.demoAccounts} onSelect={chooseDemoAccount} />
      <GoogleSignInButton onCredential={handleGoogle} onError={setError} />
      {config.googleEnabled && <div className="auth-divider"><span>or use your credentials</span></div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Email or username<input autoFocus autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={loading}>{loading ? 'AUTHENTICATING…' : 'ENTER THE APP'}</button>
      </form>
      <p className="auth-switch">New to NetLogger? <Link to="/signup">Create an account</Link></p>
    </AuthShell>
  );
}
