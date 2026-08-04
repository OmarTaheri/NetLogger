import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatsCards from '../components/StatsCards';
import VisitorMap from '../components/VisitorMap';
import VisitorTable from '../components/VisitorTable';
import VisitorsOverTimeChart from '../components/charts/VisitorsOverTimeChart';
import BrowserPieChart from '../components/charts/BrowserPieChart';
import OSPieChart from '../components/charts/OSPieChart';
import { HudSectionTitle, HudBadge, HudButton } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { getLink } from '../api/links';
import { getVisitors, getStats, deleteVisitor } from '../api/visitors';
import type { Link, Stats, Visitor } from '@netlogger/shared/types';
import { copyToClipboard } from '../utils/clipboard';

type LinkWithUrl = Link & { trackingUrl: string };

export default function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const linkId = parseInt(id!);

  const [link, setLink] = useState<LinkWithUrl | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

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
      navigate('/app/links');
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
      addToast('Tracking URL copied', 'success');
    }
  };

  const handleDeleteVisitor = async (visitorId: number) => {
    await deleteVisitor(visitorId);
    addToast('Visitor deleted', 'success');
    loadData();
  };

  const handleExport = () => {
    window.open(`/api/export/visitors/export?linkId=${linkId}`, '_blank');
  };

  if (!link) return <div className="text-center py-12 text-hud-text-muted font-mono">Loading...</div>;

  const templateLabel: Record<string, string> = {
    redirect: 'Redirect',
    gdrive: 'Google Drive',
    dropbox: 'Dropbox',
    captcha: 'CAPTCHA',
    wetransfer: 'WeTransfer',
  };

  return (
    <div className="space-y-6">
      <div className="opacity-0 animate-hud-blink">
        <button onClick={() => navigate('/app/links')} className="text-sm text-hud-accent hover:text-hud-accent/80 font-mono uppercase mb-2 transition-colors">
          &larr; Back to Links
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl uppercase tracking-widest font-mono text-hud-text">{link.title || link.slug}</h2>
          <HudBadge variant={link.templateId === 'gdrive' ? 'warning' : 'info'}>
            {templateLabel[link.templateId] || link.templateId}
          </HudBadge>
        </div>
        <p className="text-sm text-hud-text-muted mt-1 font-mono">Target: {link.targetUrl}</p>
        <div className="flex items-center gap-2 mt-2">
          <code className="text-sm bg-hud-bg px-3 py-1.5 font-mono text-hud-accent border border-hud-border">
            {link.trackingUrl}
          </code>
          <button onClick={handleCopy} className="text-sm text-hud-accent hover:text-hud-accent/80 font-mono uppercase transition-colors">
            Copy
          </button>
          <HudButton onClick={handleExport} variant="secondary">Export CSV</HudButton>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-hud-accent/60 via-hud-accent/20 to-transparent" />
      </div>

      <div className="opacity-0 animate-hud-blink-delay-1">
        <StatsCards stats={stats} />
      </div>

      {/* Charts */}
      {stats && (
        <div className="opacity-0 animate-hud-blink-delay-2">
          <HudSectionTitle>Signal Analytics</HudSectionTitle>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-3 items-start">
            <div className="xl:col-span-8 min-w-0">
              <VisitorsOverTimeChart data={stats.visitorsPerDay} />
            </div>
            <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 min-w-0">
              <div>
                <p className="text-hud-xs uppercase font-mono text-hud-text-muted mb-2">Top Browsers</p>
                <BrowserPieChart data={stats.topBrowsers} />
              </div>
              <div>
                <p className="text-hud-xs uppercase font-mono text-hud-text-muted mb-2">Top OS</p>
                <OSPieChart data={stats.topOS} />
              </div>
            </div>
          </div>
        </div>
      )}

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
