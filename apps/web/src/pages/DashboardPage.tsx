import { useState, useEffect, useCallback } from 'react';
import StatsCards from '../components/StatsCards';
import VisitorMap from '../components/VisitorMap';
import VisitorTable from '../components/VisitorTable';
import VisitorsOverTimeChart from '../components/charts/VisitorsOverTimeChart';
import BrowserPieChart from '../components/charts/BrowserPieChart';
import OSPieChart from '../components/charts/OSPieChart';
import { HudPageTitle, HudSectionTitle } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { getStats, getVisitors, getSinceTimestamp } from '../api/visitors';
import type { Stats, Visitor } from '@netlogger/shared/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  const loadData = useCallback(async () => {
    const since = getSinceTimestamp('24h');
    const [s, v] = await Promise.all([
      getStats(),
      getVisitors({ limit: 200, since }),
    ]);
    setStats(s);
    setVisitors(v.visitors);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useWebSocket((newVisitor) => {
    setVisitors((prev) => [newVisitor, ...prev].slice(0, 20));
    setStats((prev) => prev ? {
      ...prev,
      totalVisitors: prev.totalVisitors + 1,
      visitorsToday: prev.visitorsToday + 1,
      gpsGrantedCount: prev.gpsGrantedCount + (newVisitor.gpsGranted ? 1 : 0),
      gpsGrantRate: Math.round(((prev.gpsGrantedCount + (newVisitor.gpsGranted ? 1 : 0)) / (prev.totalVisitors + 1)) * 100),
    } : null);
  });

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="System Overview" animate animationDelay={0}>Dashboard</HudPageTitle>
      <div className="opacity-0 animate-hud-blink-delay-1">
        <StatsCards stats={stats} />
      </div>

      {/* Charts */}
      {stats && (
        <div className="opacity-0 animate-hud-blink-delay-2">
          <div className="flex items-end justify-between gap-4">
            <HudSectionTitle>Signal Analytics</HudSectionTitle>
            <span className="hidden sm:block text-[9px] font-mono uppercase tracking-[.16em] text-hud-text-muted">Live account telemetry // UTC</span>
          </div>
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

      <div className="opacity-0 animate-hud-blink-delay-3">
        <HudSectionTitle>Visitor Locations</HudSectionTitle>
        <VisitorMap visitors={visitors} height="400px" animate />
        <p className="text-hud-xs text-hud-text-muted mt-2 font-mono uppercase">
          Orange = GPS location &bull; Blue = IP-based location
        </p>
      </div>
      <div className="opacity-0 animate-hud-blink-delay-3">
        <HudSectionTitle>Recent Visitors (Last 24h)</HudSectionTitle>
        <VisitorTable visitors={visitors} />
      </div>
    </div>
  );
}
