import { useCallback, useEffect, useState } from 'react';
import { getAdminDomains, type AdminDomainsResponse } from '../api/admin';
import { HudBadge, HudButton, HudPageTitle, HudPanel } from '../components/ui/HudComponents';

function displayDate(value: string) {
  return new Date(`${value}Z`).toLocaleDateString();
}

export default function AdminDomainsPage() {
  const [data, setData] = useState<AdminDomainsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      setData(await getAdminDomains());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load domains');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDomains(); }, [loadDomains]);

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="Default hostname and domains attached to every account" animate>Domains</HudPageTitle>
      <HudPanel corners className="p-4 md:p-6">
        <p className="font-mono text-hud-xs uppercase tracking-widest text-hud-text-muted">Service domain</p>
        <p className="mt-2 break-all font-mono text-base text-hud-accent">{data?.defaultDomain || 'Loading…'}</p>
        <p className="mt-2 text-sm text-hud-text-muted">This is the website hostname used for links that do not have a custom domain selected.</p>
      </HudPanel>
      <HudPanel corners className="p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-hud-xs uppercase tracking-widest text-hud-text-muted">{loading ? 'Loading domains…' : `${data?.domains.length || 0} linked domain${data?.domains.length === 1 ? '' : 's'}`}</p>
          <HudButton type="button" variant="secondary" onClick={() => { void loadDomains(); }} disabled={loading}>Refresh</HudButton>
        </div>
        {error ? <p className="font-mono text-hud-sm text-hud-red">{error}</p> : (
          <div className="overflow-x-auto border border-hud-border">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-hud-bg"><tr>{['Domain', 'Owner', 'Status', 'Links', 'Added'].map((label) => <th key={label} className="border-b border-hud-border px-3 py-3 font-mono text-hud-xs uppercase tracking-wider text-hud-text-muted">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-hud-border">
                {data?.domains.map((domain) => <tr key={domain.id} className="hover:bg-hud-accent/5">
                  <td className="px-3 py-3 font-mono text-sm text-hud-text">{domain.domain}</td>
                  <td className="px-3 py-3"><p className="font-mono text-sm text-hud-text">{domain.ownerDisplayName}</p><p className="font-mono text-hud-xs text-hud-text-muted">{domain.ownerEmail || `Account #${domain.ownerId}`}</p></td>
                  <td className="px-3 py-3"><HudBadge variant={domain.isActive ? 'success' : 'default'}>{domain.isActive ? 'active' : 'disabled'}</HudBadge></td>
                  <td className="px-3 py-3 font-mono text-sm text-hud-accent">{domain.linkCount}</td>
                  <td className="px-3 py-3 font-mono text-hud-xs text-hud-text-muted">{displayDate(domain.createdAt)}</td>
                </tr>)}
                {!loading && !data?.domains.length && <tr><td colSpan={5} className="px-3 py-10 text-center font-mono text-hud-sm text-hud-text-muted">No custom domains have been linked yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>
    </div>
  );
}
