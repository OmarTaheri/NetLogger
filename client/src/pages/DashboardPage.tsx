import { useState, useEffect, useCallback } from 'react';
import StatsCards from '../components/StatsCards';
import VisitorMap from '../components/VisitorMap';
import VisitorTable from '../components/VisitorTable';
import { HudPageTitle, HudSectionTitle } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { getStats, getVisitors, getSinceTimestamp } from '../api/visitors';
import type { Stats, Visitor } from 'shared/types';

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
      <div className="opacity-0 animate-hud-blink-delay-2">
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
