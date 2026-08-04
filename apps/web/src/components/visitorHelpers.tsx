import L from 'leaflet';
import type { Visitor } from '@netlogger/shared/types';

// Shared marker icon for detail maps
export const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#ff6600;border-radius:50%;box-shadow:0 0 6px 2px rgba(255,102,0,0.5);border:2px solid rgba(255,102,0,0.8)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '';
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

export function BrowserIcon({ name }: { name: string | null }) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('chrome')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#4285F4"/>
      <path d="M12 7a5 5 0 0 1 4.33 2.5H22A10 10 0 0 0 6.27 4.05L9.13 9A5 5 0 0 1 12 7z" fill="#EA4335"/>
      <path d="M7 12a5 5 0 0 0 .87 2.83l-2.86 4.95A10 10 0 0 1 2 12h5z" fill="#FBBC05"/>
      <path d="M12 17a5 5 0 0 0 4.33-2.5l2.86 4.95A10 10 0 0 1 12 22v-5z" fill="#34A853"/>
      <circle cx="12" cy="12" r="3.5" fill="#fff"/>
    </svg>
  );
  if (n.includes('firefox')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#FF9500"/>
      <path d="M12 4c-1.5 0-3 .4-4.2 1.2C9 4.5 10.5 4.2 12 5c2 1 3.5 3 3.5 5.5 0 2-1 3.5-2.5 4.5 3 0 5.5-2.5 5.5-5.5C18.5 6.5 15.5 4 12 4z" fill="#FF4500"/>
      <circle cx="12" cy="12" r="3" fill="#fff"/>
    </svg>
  );
  if (n.includes('safari')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#006CFF"/>
      <path d="M12 5l2 5.5L19 9l-5.5 2L15 19l-3-5.5L7 15l5-2L10 5l2 5z" fill="#fff"/>
    </svg>
  );
  if (n.includes('edge')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#0078D7"/>
      <path d="M7 14c0-3.3 2.7-6 6-6 1.8 0 3.4.8 4.5 2H20C18.8 7 15.7 5 12 5 7.6 5 4 8.6 4 13c0 3 1.7 5.6 4.1 7 .3-1 .9-2.5.9-3.5V14z" fill="#50E6FF"/>
      <path d="M12 18c-2 0-3.7-1-4.7-2.5C8 17 9.9 18 12 18c3.3 0 6-2.7 6-6h-3c0 1.7-1.3 3-3 3z" fill="#fff"/>
    </svg>
  );
  if (n.includes('opera')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#FF1B2D"/>
      <ellipse cx="12" cy="12" rx="4" ry="7" fill="#fff"/>
    </svg>
  );
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-hud-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

export function OSIcon({ name }: { name: string | null }) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('windows')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M3 12.5l7-1V5.5l-7 1v6zm0 6.5l7-1v-6l-7 1v6zm8-7.5l10-1.5V3L11 5v6.5zm0 8l10-1.5V11L11 12.5V19.5z" fill="#00ADEF"/>
    </svg>
  );
  if (n.includes('mac') || n.includes('osx')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M18.7 11.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.6.9-.7 0-1.9-.8-3.1-.8C8.9 6.3 7.3 7.3 6.4 9c-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.4 2.7 1.4-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.8 1.5 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.5-3-.1 0-2.8-1.1-2.8-4.3zM16.1 4.8C16.8 3.9 17.3 2.7 17.1 1.5 16.1 1.6 14.8 2.2 14 3.1c-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.5 3.2-1.5z" fill="#999"/>
    </svg>
  );
  if (n.includes('android')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M6 10v8h2v-8H6zm10 0v8h2v-8h-2zm-8 0v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-8H8zM7.5 9h9A4.5 4.5 0 0 0 12 5a4.5 4.5 0 0 0-4.5 4zm2.1-1.8l-.8-.8 1-1a5.4 5.4 0 0 1 6.4 0l1 1-.8.8a4.3 4.3 0 0 0-6.8 0z" fill="#3DDC84"/>
      <circle cx="10" cy="7.5" r=".5" fill="#fff"/>
      <circle cx="14" cy="7.5" r=".5" fill="#fff"/>
    </svg>
  );
  if (n.includes('ios') || n.includes('ipad')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M18.7 11.5c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.6.9-.7 0-1.9-.8-3.1-.8C8.9 6.3 7.3 7.3 6.4 9c-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.4 2.7 1.4-.1 1.9-.9 3.5-.9 1.6 0 2.1.9 3.5.8 1.5 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.5-3-.1 0-2.8-1.1-2.8-4.3zM16.1 4.8C16.8 3.9 17.3 2.7 17.1 1.5 16.1 1.6 14.8 2.2 14 3.1c-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.5 3.2-1.5z" fill="#999"/>
    </svg>
  );
  if (n.includes('linux')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M12 2C8.1 2 5 5.6 5 10c0 2.4 1 4.6 2.5 6.2C6.5 17.2 5 18.5 5 20h14c0-1.5-1.5-2.8-2.5-3.8C18 14.6 19 12.4 19 10c0-4.4-3.1-8-7-8z" fill="#FCC624"/>
      <circle cx="10" cy="9" r="1.5" fill="#333"/>
      <circle cx="14" cy="9" r="1.5" fill="#333"/>
      <path d="M10 13c0 0 1 1.5 2 1.5s2-1.5 2-1.5" fill="none" stroke="#333" strokeWidth="1"/>
    </svg>
  );
  if (n.includes('chrome')) return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#4285F4"/>
      <circle cx="12" cy="12" r="4" fill="#fff"/>
    </svg>
  );
  return null;
}

export function LocationIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 text-hud-text-muted" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  );
}

export function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <div className={`flex items-center gap-1.5 mb-2 ${color || 'text-hud-text-muted'}`}>
      {icon}
      <span className="text-hud-xs font-semibold uppercase font-mono">{label}</span>
    </div>
  );
}

export function Detail({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-hud-text-muted text-hud-xs uppercase font-mono">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon && value && icon}
        <p className="text-hud-text-dim truncate font-mono text-xs" title={String(value || '-')}>{value ?? '-'}</p>
      </div>
    </div>
  );
}

export function safeJSON(str: string | null | undefined): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

export function getVisitorCoords(v: Visitor): { lat: number; lng: number; isGps: boolean } | null {
  if (v.gpsGranted && v.latitude != null && v.longitude != null) {
    return { lat: v.latitude, lng: v.longitude, isGps: true };
  }
  if (v.ipLat != null && v.ipLon != null) {
    return { lat: v.ipLat, lng: v.ipLon, isGps: false };
  }
  return null;
}
