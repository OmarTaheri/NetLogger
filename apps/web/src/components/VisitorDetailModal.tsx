import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Visitor } from '@netlogger/shared/types';
import { BrowserIcon, OSIcon, getVisitorCoords } from './visitorHelpers';

import LocationTab from './visitor-tabs/LocationTab';
import DeviceTab from './visitor-tabs/DeviceTab';
import RiskTab from './visitor-tabs/RiskTab';
import FingerprintsTab from './visitor-tabs/FingerprintsTab';
import NetworkTab from './visitor-tabs/NetworkTab';
import BehaviorTab from './visitor-tabs/BehaviorTab';
import SystemTab from './visitor-tabs/SystemTab';

const TABS = ['Location', 'Device', 'Risk Analysis', 'Fingerprints', 'Network', 'Behavior', 'System'] as const;
type Tab = typeof TABS[number];

interface Props {
  visitor: Visitor;
  onClose: () => void;
}

export default function VisitorDetailModal({ visitor: v, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Location');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const coords = getVisitorCoords(v);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-hud-bg border border-hud-border hud-corners w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-hud-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-hud-accent font-mono text-xs font-semibold">#{v.id}</span>
            <span className="text-hud-text-dim font-mono text-xs">{new Date(v.createdAt + 'Z').toLocaleString()}</span>
            <div className="flex items-center gap-1.5">
              <BrowserIcon name={v.browser} />
              <span className="text-hud-text-dim text-xs">{v.browser}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <OSIcon name={v.os} />
              <span className="text-hud-text-dim text-xs">{v.os}</span>
            </div>
            <span className="text-hud-text-muted font-mono text-xs">{v.ip}</span>
          </div>
          <button onClick={onClose} className="text-hud-text-muted hover:text-hud-text transition-colors ml-3 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-hud-border shrink-0 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                tab === t
                  ? 'border-hud-accent text-hud-accent'
                  : 'border-transparent text-hud-text-muted hover:text-hud-text-dim'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1">
          {tab === 'Location' && <LocationTab v={v} coords={coords} />}
          {tab === 'Device' && <DeviceTab v={v} />}
          {tab === 'Risk Analysis' && <RiskTab v={v} />}
          {tab === 'Fingerprints' && <FingerprintsTab v={v} />}
          {tab === 'Network' && <NetworkTab v={v} />}
          {tab === 'Behavior' && <BehaviorTab v={v} />}
          {tab === 'System' && <SystemTab v={v} />}
        </div>
      </div>
    </div>
  );
}
