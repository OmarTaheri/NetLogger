import { useState, useEffect, useCallback, useRef } from 'react';
import VisitorTable from '../components/VisitorTable';
import VisitorMap from '../components/VisitorMap';
import { HudPageTitle, HudButton, HudSelect, HudInput } from '../components/ui/HudComponents';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import { getVisitors, deleteVisitor, getSinceTimestamp, bulkDeleteVisitors } from '../api/visitors';
import type { Visitor } from '@netlogger/shared/types';

export default function VisitorsPage() {
  const { addToast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [timeframe, setTimeframe] = useState('all');
  const [search, setSearch] = useState('');
  const [browserFilter, setBrowserFilter] = useState('');
  const [osFilter, setOsFilter] = useState('');
  const [gpsFilter, setGpsFilter] = useState('');
  const [vpnFilter, setVpnFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const limit = 50;
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadData = useCallback(async () => {
    const since = getSinceTimestamp(timeframe);
    const data = await getVisitors({
      limit,
      offset: page * limit,
      since,
      search: search || undefined,
      browser: browserFilter || undefined,
      os: osFilter || undefined,
      gpsGranted: gpsFilter ? gpsFilter === 'true' : undefined,
      vpnDetected: vpnFilter ? vpnFilter === 'true' : undefined,
      sortBy,
      sortOrder,
    });
    setVisitors(data.visitors);
    setTotal(data.total);
    setSelectedIds(new Set());
  }, [page, timeframe, search, browserFilter, osFilter, gpsFilter, vpnFilter, sortBy, sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  useWebSocket((newVisitor) => {
    if (page === 0 && !search && !browserFilter && !osFilter) {
      setVisitors((prev) => [newVisitor, ...prev.slice(0, limit - 1)]);
      setTotal((t) => t + 1);
    }
  });

  const handleDelete = async (id: number) => {
    await deleteVisitor(id);
    addToast('Visitor deleted', 'success');
    loadData();
  };

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 300);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(0);
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === visitors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visitors.map((v) => v.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected visitors?`)) return;
    try {
      const result = await bulkDeleteVisitors({ ids: Array.from(selectedIds) });
      addToast(`Deleted ${result.deleted} visitors`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleExport = () => {
    window.open('/api/export/visitors/export', '_blank');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 opacity-0 animate-hud-blink">
        <HudPageTitle>All Visitors</HudPageTitle>
        <div className="flex items-center gap-3 flex-wrap">
          <HudButton onClick={handleExport} variant="secondary">Export CSV</HudButton>
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

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-hud-blink-delay-1">
        <div className="flex-1 min-w-[200px]">
          <HudInput
            type="text"
            placeholder="Search IP, browser, OS, city, country..."
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-32">
          <HudSelect value={browserFilter} onChange={(e) => { setBrowserFilter(e.target.value); setPage(0); }}>
            <option value="">All Browsers</option>
            <option value="Chrome">Chrome</option>
            <option value="Firefox">Firefox</option>
            <option value="Safari">Safari</option>
            <option value="Edge">Edge</option>
          </HudSelect>
        </div>
        <div className="w-32">
          <HudSelect value={osFilter} onChange={(e) => { setOsFilter(e.target.value); setPage(0); }}>
            <option value="">All OS</option>
            <option value="Windows">Windows</option>
            <option value="macOS">macOS</option>
            <option value="Linux">Linux</option>
            <option value="Android">Android</option>
            <option value="iOS">iOS</option>
          </HudSelect>
        </div>
        <div className="w-28">
          <HudSelect value={gpsFilter} onChange={(e) => { setGpsFilter(e.target.value); setPage(0); }}>
            <option value="">GPS: All</option>
            <option value="true">GPS: Yes</option>
            <option value="false">GPS: No</option>
          </HudSelect>
        </div>
        <div className="w-28">
          <HudSelect value={vpnFilter} onChange={(e) => { setVpnFilter(e.target.value); setPage(0); }}>
            <option value="">VPN: All</option>
            <option value="true">VPN: Yes</option>
            <option value="false">VPN: No</option>
          </HudSelect>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-hud-accent/10 border border-hud-accent/30">
          <span className="text-sm font-mono text-hud-accent">{selectedIds.size} selected</span>
          <HudButton onClick={handleBulkDelete} variant="danger">Delete Selected</HudButton>
          <HudButton onClick={() => setSelectedIds(new Set())} variant="ghost">Clear</HudButton>
        </div>
      )}

      {visitors.length > 0 && (
        <div className="opacity-0 animate-hud-blink-delay-1">
          <VisitorMap visitors={visitors} height="500px" animate />
        </div>
      )}

      <div className="opacity-0 animate-hud-blink-delay-2">
        <VisitorTable
          visitors={visitors}
          onDelete={handleDelete}
          selectable
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
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
