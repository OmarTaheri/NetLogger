import { useState, useEffect, useCallback } from 'react';
import VisitorTable from '../components/VisitorTable';
import VisitorMap from '../components/VisitorMap';
import { HudPageTitle, HudButton, HudSelect } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { getVisitors, deleteVisitor, getSinceTimestamp } from '../api/visitors';
import type { Visitor } from 'shared/types';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [timeframe, setTimeframe] = useState('all');
  const limit = 50;

  const loadData = useCallback(async () => {
    const since = getSinceTimestamp(timeframe);
    const data = await getVisitors({ limit, offset: page * limit, since });
    setVisitors(data.visitors);
    setTotal(data.total);
  }, [page, timeframe]);

  useEffect(() => { loadData(); }, [loadData]);

  useWebSocket((newVisitor) => {
    if (page === 0) {
      setVisitors((prev) => [newVisitor, ...prev.slice(0, limit - 1)]);
      setTotal((t) => t + 1);
    }
  });

  const handleDelete = async (id: number) => {
    await deleteVisitor(id);
    loadData();
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between opacity-0 animate-hud-blink">
        <HudPageTitle>All Visitors</HudPageTitle>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <HudSelect value={timeframe} onChange={(e) => handleTimeframeChange(e.target.value)}>
              <option value="1h">Last 1 Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </HudSelect>
          </div>
          <span className="text-sm font-mono text-hud-accent">{total} <span className="text-hud-text-muted">total</span></span>
        </div>
      </div>

      {visitors.length > 0 && (
        <div className="opacity-0 animate-hud-blink-delay-1">
          <VisitorMap visitors={visitors} height="500px" animate />
        </div>
      )}

      <div className="opacity-0 animate-hud-blink-delay-2">
        <VisitorTable visitors={visitors} onDelete={handleDelete} />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 opacity-0 animate-hud-blink-delay-3">
          <HudButton
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            variant="secondary"
          >
            Previous
          </HudButton>
          <span className="text-hud-xs font-mono text-hud-text-muted uppercase tracking-widest">
            Page {String(page + 1).padStart(2, '0')} of {String(totalPages).padStart(2, '0')}
          </span>
          <HudButton
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            variant="secondary"
          >
            Next
          </HudButton>
        </div>
      )}
    </div>
  );
}
