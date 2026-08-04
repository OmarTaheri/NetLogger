import type { Stats } from '@netlogger/shared/types';
import { HudStatCard } from './ui/HudComponents';

interface StatsCardsProps {
  stats: Stats | null;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: 'Total Links', value: stats?.totalLinks ?? '-' },
    { label: 'Total Visitors', value: stats?.totalVisitors ?? '-' },
    { label: 'GPS Granted', value: stats ? `${stats.gpsGrantRate}%` : '-' },
    { label: 'Today', value: stats?.visitorsToday ?? '-' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <HudStatCard
          key={card.label}
          label={card.label}
          value={card.value}
          animate
          animationDelay={i as 0 | 1 | 2 | 3}
        />
      ))}
    </div>
  );
}
