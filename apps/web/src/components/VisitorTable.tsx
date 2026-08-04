import { useState } from 'react';
import type { Visitor } from '@netlogger/shared/types';
import { countryCodeToFlag, BrowserIcon, OSIcon, LocationIcon } from './visitorHelpers';
import VisitorDetailModal from './VisitorDetailModal';

interface VisitorTableProps {
  visitors: Visitor[];
  onDelete?: (id: number) => void;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
}

function SortIndicator({ column, sortBy, sortOrder }: { column: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  if (column !== sortBy) return <span className="text-hud-text-muted/30 ml-1">&udarr;</span>;
  return <span className="text-hud-accent ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>;
}

export default function VisitorTable({ visitors, onDelete, selectable, selectedIds, onToggleSelect, onToggleSelectAll, sortBy, sortOrder, onSort }: VisitorTableProps) {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const thClass = "text-left px-4 py-3 text-hud-xs uppercase tracking-widest font-mono text-hud-text-muted";
  const sortableClass = onSort ? ' cursor-pointer hover:text-hud-accent transition-colors select-none' : '';

  return (
    <>
      <div className="hud-corners bg-hud-surface/50 border border-hud-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-hud-bg border-b border-white/5">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={visitors.length > 0 && selectedIds?.size === visitors.length}
                      onChange={onToggleSelectAll}
                      className="accent-[#ff6600]"
                    />
                  </th>
                )}
                <th className={thClass + sortableClass} onClick={() => onSort?.('createdAt')}>
                  Time{onSort && <SortIndicator column="createdAt" sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
                <th className={thClass}>Link</th>
                <th className={thClass + sortableClass} onClick={() => onSort?.('ip')}>
                  IP{onSort && <SortIndicator column="ip" sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
                <th className={thClass + sortableClass} onClick={() => onSort?.('ipCountry')}>
                  Location{onSort && <SortIndicator column="ipCountry" sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
                <th className={thClass + sortableClass} onClick={() => onSort?.('browser')}>
                  Browser{onSort && <SortIndicator column="browser" sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
                <th className={thClass + sortableClass} onClick={() => onSort?.('os')}>
                  OS{onSort && <SortIndicator column="os" sortBy={sortBy} sortOrder={sortOrder} />}
                </th>
                <th className={thClass}>GPS</th>
                <th className={thClass}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visitors.map((v) => (
                <tr
                  key={v.id}
                  className={`hover:bg-hud-accent/5 cursor-pointer transition-colors ${selectedIds?.has(v.id) ? 'bg-hud-accent/10' : ''}`}
                  onClick={() => setSelectedVisitor(v)}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds?.has(v.id) || false}
                        onChange={() => onToggleSelect?.(v.id)}
                        className="accent-[#ff6600]"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-hud-text-dim whitespace-nowrap font-mono text-xs">
                    {new Date(v.createdAt + 'Z').toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-hud-accent font-mono text-xs">{v.linkTitle || v.linkSlug}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-hud-text-dim">{v.ip || '-'}</td>
                  <td className="px-4 py-3">
                    {v.gpsGranted ? (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-hud-accent" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                        </svg>
                        <span className="text-hud-accent font-mono text-xs">{v.latitude?.toFixed(3)}, {v.longitude?.toFixed(3)}</span>
                      </div>
                    ) : v.ipCity ? (
                      <div className="flex items-center gap-1.5">
                        {v.ipCountryCode && <span className="text-base leading-none">{countryCodeToFlag(v.ipCountryCode)}</span>}
                        {!v.ipCountryCode && <LocationIcon />}
                        <span className="text-hud-text-dim text-xs">{v.ipCity}, {v.ipCountry}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <BrowserIcon name={v.browser} />
                      <span className="text-hud-text-dim text-xs">{v.browser || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <OSIcon name={v.os} />
                      <span className="text-hud-text-dim text-xs">{v.os || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {v.gpsGranted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border text-hud-xs font-mono border-hud-green/40 text-hud-green bg-hud-green/10">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        YES
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 border text-hud-xs font-mono border-hud-text-muted/40 text-hud-text-muted bg-white/5">NO</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {onDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(v.id); }}
                        className="text-hud-text-muted hover:text-hud-red transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {visitors.length === 0 && (
                <tr>
                  <td colSpan={selectable ? 9 : 8} className="px-4 py-8 text-center text-hud-text-muted font-mono">
                    No visitors yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedVisitor && (
        <VisitorDetailModal visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />
      )}
    </>
  );
}
