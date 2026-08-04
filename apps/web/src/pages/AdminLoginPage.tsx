import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { useAuth } from '../hooks/useAuth';
import DemoAccountPicker from '../components/DemoAccountPicker';
import type { DemoAccount } from '../api/auth';

export default function AdminLoginPage() {
  const { adminLogin, config } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from || '/admin';
  const presetAccount = (location.state as { demoAccount?: DemoAccount } | null)?.demoAccount;

  useEffect(() => {
    if (presetAccount?.role === 'admin') {
      setEmail(presetAccount.email);
      setPassword(presetAccount.password);
    }
  }, [presetAccount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Administrator sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const chooseDemoAccount = (account: DemoAccount) => {
    setError('');
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <AuthShell eyebrow="Administrator access // restricted" title="Admin sign in">
      <DemoAccountPicker accounts={config.demoAccounts.filter((account) => account.role === 'admin')} onSelect={chooseDemoAccount} />
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Administrator email<input autoFocus type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" disabled={loading}>{loading ? 'AUTHENTICATING…' : 'ENTER ADMIN'}</button>
      </form>
      <p className="auth-switch">Need the regular workspace? <a href="/login">User sign in</a></p>
    </AuthShell>
  );
}
