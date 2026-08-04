import { useCallback, useEffect, useState } from 'react';
import { HudPageTitle, HudPanel, HudSectionTitle, HudStatCard } from '../components/ui/HudComponents';
import { getAdminOverview, type AdminOverview } from '../api/admin';

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      setError('');
      setOverview(await getAdminOverview());
    } catch (err: any) {
      setError(err.message || 'Could not load administrator statistics');
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const cards = [
    { label: 'All accounts', value: overview?.totalUsers ?? '-' },
    { label: 'Standard users', value: overview?.standardUsers ?? '-' },
    { label: 'All links', value: overview?.totalLinks ?? '-' },
    { label: 'Active links', value: overview?.activeLinks ?? '-' },
    { label: 'Recorded visits', value: overview?.totalVisitors ?? '-' },
  ];

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="Application-wide statistics" animate>Admin overview</HudPageTitle>
      {error && <HudPanel className="border-hud-red/50 p-4 font-mono text-hud-sm text-hud-red">{error}</HudPanel>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => <HudStatCard key={card.label} label={card.label} value={card.value} animate animationDelay={index} />)}
      </div>
      <HudPanel corners className="p-6">
        <HudSectionTitle>Control center</HudSectionTitle>
        <p className="max-w-2xl font-mono text-sm leading-6 text-hud-text-dim">
          These metrics cover every account. Use Users to inspect activity by account. This administrator portal is view-only; it cannot change application data or configuration.
        </p>
      </HudPanel>
    </div>
  );
}
