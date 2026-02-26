import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import VisitorMap from '../components/VisitorMap';
import VisitorTable from '../components/VisitorTable';
import { HudSectionTitle, HudBadge } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { getLink } from '../api/links';
import { getVisitors, getStats, deleteVisitor } from '../api/visitors';
import type { Link, Stats, Visitor } from 'shared/types';
import { copyToClipboard } from '../utils/clipboard';

type LinkWithUrl = Link & { trackingUrl: string };

export default function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const linkId = parseInt(id!);

  const [link, setLink] = useState<LinkWithUrl | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [l, s, v] = await Promise.all([
        getLink(linkId),
        getStats(linkId),
        getVisitors({ linkId, limit: 100 }),
      ]);
      setLink(l);
      setStats(s);
      setVisitors(v.visitors);
    } catch {
      navigate('/links');
    }
  }, [linkId, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  useWebSocket((newVisitor) => {
    if (newVisitor.linkId === linkId) {
      setVisitors((prev) => [newVisitor, ...prev]);
      loadData();
    }
  });

  const handleCopy = async () => {
    if (link) {
      await copyToClipboard(link.trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteVisitor = async (visitorId: number) => {
    await deleteVisitor(visitorId);
    loadData();
  };

  if (!link) return <div className="text-center py-12 text-hud-text-muted font-mono">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-hud-blink">
        <button onClick={() => navigate('/links')} className="text-sm text-hud-accent hover:text-hud-accent/80 font-mono uppercase mb-2 transition-colors">
          &larr; Back to Links
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl uppercase tracking-widest font-mono text-hud-text">{link.title || link.slug}</h2>
          <HudBadge variant={link.templateId === 'gdrive' ? 'warning' : 'info'}>
            {link.templateId === 'gdrive' ? 'Google Drive' : 'Redirect'}
          </HudBadge>
        </div>
        <p className="text-sm text-hud-text-muted mt-1 font-mono">Target: {link.targetUrl}</p>
        <div className="flex items-center gap-2 mt-2">
          <code className="text-sm bg-hud-bg px-3 py-1.5 font-mono text-hud-accent border border-hud-border">
            {link.trackingUrl}
          </code>
          <button onClick={handleCopy} className="text-sm text-hud-accent hover:text-hud-accent/80 font-mono uppercase transition-colors">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-hud-accent/60 via-hud-accent/20 to-transparent" />
      </div>

      <div className="opacity-0 animate-hud-blink-delay-1">
        <StatsCards stats={stats} />
      </div>

      <div className="opacity-0 animate-hud-blink-delay-2">
        <HudSectionTitle>Visitor Locations</HudSectionTitle>
        <VisitorMap visitors={visitors} height="350px" />
      </div>

      <div className="opacity-0 animate-hud-blink-delay-3">
        <HudSectionTitle>Visitors ({visitors.length})</HudSectionTitle>
        <VisitorTable visitors={visitors} onDelete={handleDeleteVisitor} />
      </div>
    </div>
  );
}
