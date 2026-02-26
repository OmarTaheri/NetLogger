import { useState } from 'react';
import { HudPanel, HudInput, HudButton } from '../components/ui/HudComponents';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hud-bg hud-grid-overlay hud-scanline-overlay flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-sm">
        <HudPanel corners animate className="p-8">
          <h1 className="text-2xl font-mono uppercase tracking-widest text-hud-accent text-center mb-1">GPS TRACKER</h1>
          <p className="text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted text-center mb-6">Authorization Required</p>
          <div className="h-px bg-gradient-to-r from-transparent via-hud-accent/40 to-transparent mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Username</label>
              <HudInput
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Password</label>
              <HudInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-hud-red text-sm font-mono bg-hud-red/10 border border-hud-red/30 px-3 py-2">{error}</p>
            )}
            <HudButton type="submit" disabled={loading} variant="primary" className="w-full">
              {loading ? 'Authenticating...' : 'Authenticate'}
            </HudButton>
          </form>
        </HudPanel>
      </div>
    </div>
  );
}
