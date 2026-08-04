import { useState, useEffect, useCallback } from 'react';
import { HudPageTitle, HudPanel, HudInput, HudButton, HudSectionTitle } from '../components/ui/HudComponents';
import { changePassword } from '../api/auth';
import { getAuditLogs, bulkDeleteVisitors } from '../api/visitors';
import { useToast } from '../hooks/useToast';
import type { AuditLog } from '@netlogger/shared/types';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function SettingsPage() {
  const { addToast } = useToast();
  const { user, config, linkGoogle } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [purgeDays, setPurgeDays] = useState('30');
  const [purging, setPurging] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const logs = await getAuditLogs(50);
      setAuditLogs(logs);
    } catch {}
  }, []);

  useEffect(() => { loadAuditLogs(); }, [loadAuditLogs]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 12) {
      addToast('Password must be at least 12 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePurge = async () => {
    const days = parseInt(purgeDays);
    if (isNaN(days) || days < 1) {
      addToast('Enter a valid number of days', 'error');
      return;
    }
    if (!confirm(`Delete all visitors older than ${days} days? This cannot be undone.`)) return;
    setPurging(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const result = await bulkDeleteVisitors({ olderThan: cutoff.toISOString() });
      addToast(`Deleted ${result.deleted} visitors`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to purge data', 'error');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="System Configuration" animate animationDelay={0}>Settings</HudPageTitle>

      <HudPanel corners animate animationDelay={1} className="p-6">
        <HudSectionTitle>Account Identity</HudSectionTitle>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-2">
            <p className="text-lg font-mono text-hud-text">{user?.displayName}</p>
            <p className="text-xs font-mono text-hud-text-muted">{user?.email || user?.username}</p>
            <div className="flex gap-2 pt-2">
              {user?.providers.map((provider) => <span key={provider} className="border border-hud-accent/30 bg-hud-accent/10 px-2 py-1 text-hud-xs uppercase font-mono text-hud-accent">{provider}</span>)}
            </div>
          </div>
          {config.googleEnabled && user?.providers.includes('password') && !user.providers.includes('google') && (
            <div className="min-w-[240px]">
              <p className="text-hud-xs uppercase font-mono text-hud-text-muted mb-2">Connect another sign-in method</p>
              <GoogleSignInButton
                label="continue_with"
                onCredential={async (credential) => {
                  try { await linkGoogle(credential); addToast('Google account connected', 'success'); }
                  catch (err: any) { addToast(err.message || 'Could not connect Google', 'error'); }
                }}
                onError={(message) => addToast(message, 'error')}
              />
            </div>
          )}
        </div>
      </HudPanel>

      {/* Change Password */}
      {user?.providers.includes('password') && <HudPanel corners animate animationDelay={2} className="p-6">
        <HudSectionTitle>Change Password</HudSectionTitle>
        <form onSubmit={handleChangePassword} className="space-y-3 mt-4 max-w-md">
          <div>
            <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Current Password</label>
            <HudInput type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">New Password</label>
            <HudInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Confirm New Password</label>
            <HudInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <HudButton type="submit" disabled={changingPassword} variant="primary">
            {changingPassword ? 'Changing...' : 'Change Password'}
          </HudButton>
        </form>
      </HudPanel>}

      {/* System Info */}
      <HudPanel corners animate animationDelay={3} className="p-6">
        <HudSectionTitle>System Info</HudSectionTitle>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-hud-xs uppercase font-mono text-hud-text-muted">Version</p>
            <p className="text-sm font-mono text-hud-text">1.0.0</p>
          </div>
          <div>
            <p className="text-hud-xs uppercase font-mono text-hud-text-muted">Platform</p>
            <p className="text-sm font-mono text-hud-text">NetLogger Visitor Intelligence</p>
          </div>
          <div>
            <p className="text-hud-xs uppercase font-mono text-hud-text-muted">Database</p>
            <p className="text-sm font-mono text-hud-text">PostgreSQL</p>
          </div>
        </div>
      </HudPanel>

      {/* Danger Zone */}
      <HudPanel corners animate animationDelay={4} className="p-6 border-hud-red/30">
        <HudSectionTitle>Danger Zone</HudSectionTitle>
        <p className="text-xs font-mono text-hud-text-muted mt-2 mb-4">
          Permanently delete visitor data older than a specified number of days.
        </p>
        <div className="flex items-end gap-3 max-w-md">
          <div className="flex-1">
            <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-1">Days to keep</label>
            <HudInput type="number" value={purgeDays} onChange={(e) => setPurgeDays(e.target.value)} min="1" />
          </div>
          <HudButton onClick={handlePurge} disabled={purging} variant="danger">
            {purging ? 'Purging...' : 'Purge Old Data'}
          </HudButton>
        </div>
      </HudPanel>

      {/* Audit Log */}
      <HudPanel corners animate animationDelay={5} className="p-6">
        <HudSectionTitle>Audit Log</HudSectionTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hud-bg border-b border-white/5">
              <tr>
                <th className="text-left px-3 py-2 text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">Time</th>
                <th className="text-left px-3 py-2 text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">Action</th>
                <th className="text-left px-3 py-2 text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">Target</th>
                <th className="text-left px-3 py-2 text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-hud-accent/5">
                  <td className="px-3 py-2 text-hud-text-dim whitespace-nowrap font-mono text-xs">
                    {new Date(log.createdAt + 'Z').toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-hud-accent">{log.action}</td>
                  <td className="px-3 py-2 font-mono text-xs text-hud-text-dim">
                    {log.targetType ? `${log.targetType}#${log.targetId}` : '-'}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-hud-text-muted truncate max-w-[200px]">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-hud-text-muted font-mono text-xs">
                    No audit logs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HudPanel>
    </div>
  );
}
