import { useState, useEffect, useCallback } from 'react';
import { getDomains, createDomain, updateDomain, deleteDomain } from '../api/domains';
import { HudPageTitle, HudPanel, HudInput, HudButton } from '../components/ui/HudComponents';
import type { Domain } from 'shared/types';

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDomains = useCallback(async () => {
    const data = await getDomains();
    setDomains(data);
  }, []);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newDomain.trim()) {
      setError('Domain is required');
      return;
    }
    setLoading(true);
    try {
      await createDomain(newDomain.trim());
      setNewDomain('');
      loadDomains();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (domain: Domain) => {
    await updateDomain(domain.id, { isActive: !domain.isActive });
    loadDomains();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this domain? Links using it will fall back to the default URL.')) return;
    await deleteDomain(id);
    loadDomains();
  };

  return (
    <div className="space-y-6">
      <div>
        <HudPageTitle subtitle="Add custom domains that point to this server" animate animationDelay={0}>Domains</HudPageTitle>
      </div>

      {/* Add domain form */}
      <HudPanel corners animate animationDelay={1} className="p-5">
        <form onSubmit={handleAdd}>
          <label className="block text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted mb-2">Add Domain</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <HudInput
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. drive.yourdomain.com"
              />
            </div>
            <HudButton type="submit" disabled={loading} variant="primary">
              {loading ? 'Adding...' : 'Add Domain'}
            </HudButton>
          </div>
          {error && <p className="text-hud-red text-sm font-mono mt-2">{error}</p>}
          <p className="text-hud-xs text-hud-text-muted mt-2 font-mono">
            Make sure the domain's DNS points to this server before using it.
          </p>
        </form>
      </HudPanel>

      {/* Domain list */}
      <div className="space-y-3">
        {domains.map((d, i) => (
          <HudPanel key={d.id} corners animate animationDelay={Math.min(2 + i, 8)} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${d.isActive ? 'bg-hud-green' : 'bg-hud-text-muted'}`} />
              <div>
                <p className="font-mono text-hud-text">{d.domain}</p>
                <p className="text-hud-xs text-hud-text-muted font-mono">
                  Added {new Date(d.createdAt + 'Z').toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(d)}
                className={`px-3 py-1.5 text-hud-xs font-mono uppercase border transition-colors ${
                  d.isActive
                    ? 'border-hud-green/40 text-hud-green bg-hud-green/10 hover:bg-hud-green/20'
                    : 'border-hud-text-muted/40 text-hud-text-muted bg-white/5 hover:bg-white/10'
                }`}
              >
                {d.isActive ? 'Active' : 'Disabled'}
              </button>
              <button
                onClick={() => handleDelete(d.id)}
                className="px-3 py-1.5 text-hud-xs font-mono uppercase text-hud-red hover:bg-hud-red/10 border border-transparent hover:border-hud-red/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </HudPanel>
        ))}
        {domains.length === 0 && (
          <div className="text-center py-12 text-hud-text-muted font-mono">
            No domains added yet. Add a domain above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
