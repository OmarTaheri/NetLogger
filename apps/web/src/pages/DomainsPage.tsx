import { useState, useEffect, useCallback } from 'react';
import { getDomains, createDomain, updateDomain, deleteDomain, verifyDomain } from '../api/domains';
import { HudPageTitle, HudPanel, HudInput, HudButton } from '../components/ui/HudComponents';
import { useToast } from '../hooks/useToast';
import type { Domain } from '@netlogger/shared/types';

function VerificationInstructions({ domain }: { domain: Domain }) {
  return (
    <div className="mt-4 border border-hud-border bg-hud-bg/60 p-4 font-mono text-hud-sm text-hud-text-dim">
      <p className="text-hud-xs uppercase tracking-widest text-hud-accent">Verification required</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>Add <span className="text-hud-text">{domain.domain}</span> as a custom domain in your Coolify application, so its proxy and SSL certificate accept the hostname.</li>
        <li>{domain.verification.cnameTarget ? <>Create a CNAME for <span className="text-hud-text">{domain.domain}</span> pointing to <span className="break-all text-hud-text">{domain.verification.cnameTarget}</span>.</> : <>Set a public <span className="text-hud-text">BASE_URL</span> or <span className="text-hud-text">DOMAIN_CNAME_TARGET</span> in production before verification.</>}</li>
        <li>Create the TXT record <span className="break-all text-hud-text">{domain.verification.recordName}</span> with value <span className="break-all text-hud-text">{domain.verification.recordValue}</span>.</li>
      </ol>
      <p className="mt-3 text-hud-xs text-hud-text-muted">DNS propagation may take several minutes. This domain cannot be selected for a link until verification succeeds.</p>
      {domain.verificationError && <p className="mt-3 border-l-2 border-hud-yellow pl-3 text-hud-yellow">Last check: {domain.verificationError}</p>}
    </div>
  );
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const { addToast } = useToast();

  const loadDomains = useCallback(async () => {
    try {
      setDomains(await getDomains());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load domains');
    }
  }, []);

  useEffect(() => { void loadDomains(); }, [loadDomains]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!newDomain.trim()) {
      setError('Domain is required');
      return;
    }
    setLoading(true);
    try {
      await createDomain(newDomain.trim());
      setNewDomain('');
      addToast('Domain added. Complete DNS verification to use it.', 'success');
      await loadDomains();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add domain');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (domain: Domain) => {
    setError('');
    setVerifyingId(domain.id);
    try {
      const checked = await verifyDomain(domain.id);
      addToast(checked.isActive ? 'Domain verified and ready to use.' : 'DNS is not ready yet. Review the verification message.', checked.isActive ? 'success' : 'error');
      await loadDomains();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not verify domain');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleToggle = async (domain: Domain) => {
    try {
      await updateDomain(domain.id, { isActive: !domain.isActive });
      await loadDomains();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update domain');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this domain? Links using it will fall back to the default URL.')) return;
    await deleteDomain(id);
    await loadDomains();
  };

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="Connect a domain, prove ownership with DNS, then use it for private links" animate>Domains</HudPageTitle>

      <HudPanel corners animate animationDelay={1} className="p-5">
        <form onSubmit={handleAdd}>
          <label className="mb-2 block font-mono text-hud-xs uppercase tracking-widest text-hud-text-muted">Connect a domain</label>
          <div className="flex gap-3">
            <div className="flex-1"><HudInput type="text" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="e.g. links.yourdomain.com" aria-describedby="domain-help" /></div>
            <HudButton type="submit" disabled={loading} variant="primary">{loading ? 'Adding…' : 'Add domain'}</HudButton>
          </div>
          {error && <p className="mt-3 font-mono text-hud-sm text-hud-red">{error}</p>}
          <p id="domain-help" className="mt-3 font-mono text-hud-xs text-hud-text-muted">Domains start inactive. You will receive a unique TXT record, then the server checks that DNS points to this application before enabling it.</p>
        </form>
      </HudPanel>

      <div className="space-y-3">
        {domains.map((domain, index) => {
          const verified = domain.verificationStatus === 'verified';
          return <HudPanel key={domain.id} corners animate animationDelay={Math.min(2 + index, 8)} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3"><div className={`h-2.5 w-2.5 rounded-full ${domain.isActive ? 'bg-hud-green' : domain.verificationStatus === 'failed' ? 'bg-hud-red' : 'bg-hud-yellow'}`} /><p className="break-all font-mono text-base text-hud-text">{domain.domain}</p></div>
                <p className="mt-1 font-mono text-hud-xs uppercase tracking-wider text-hud-text-muted">{verified ? (domain.isActive ? 'Verified and active' : 'Verified but disabled') : domain.verificationStatus === 'failed' ? 'DNS check failed' : 'Waiting for DNS verification'}</p>
                {!verified && <VerificationInstructions domain={domain} />}
                {verified && <p className="mt-2 font-mono text-hud-xs text-hud-text-muted">Verified {domain.verifiedAt ? new Date(`${domain.verifiedAt}Z`).toLocaleString() : 'recently'} · Attached only to your account</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!verified && <HudButton type="button" variant="secondary" disabled={verifyingId === domain.id} onClick={() => { void handleVerify(domain); }}>{verifyingId === domain.id ? 'Checking DNS…' : 'Verify DNS'}</HudButton>}
                {verified && <button type="button" onClick={() => { void handleToggle(domain); }} className={`border px-3 py-2 font-mono text-hud-xs uppercase transition-colors ${domain.isActive ? 'border-hud-green/40 bg-hud-green/10 text-hud-green hover:bg-hud-green/20' : 'border-hud-text-muted/40 bg-white/5 text-hud-text-muted hover:bg-white/10'}`}>{domain.isActive ? 'Active' : 'Disabled'}</button>}
                <button type="button" onClick={() => { void handleDelete(domain.id); }} className="border border-transparent px-3 py-2 font-mono text-hud-xs uppercase text-hud-red transition-colors hover:border-hud-red/30 hover:bg-hud-red/10">Delete</button>
              </div>
            </div>
          </HudPanel>;
        })}
        {domains.length === 0 && <div className="py-12 text-center font-mono text-hud-text-muted">No domains added yet. Add a domain to begin the DNS verification process.</div>}
      </div>
    </div>
  );
}
