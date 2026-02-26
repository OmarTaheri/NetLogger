import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visitor } from 'shared/types';
import {
  markerIcon, countryCodeToFlag, BrowserIcon, OSIcon, LocationIcon,
  SectionHeader, Detail, safeJSON, getVisitorCoords,
} from './visitorHelpers';

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

function LocationTab({ v, coords }: { v: Visitor; coords: ReturnType<typeof getVisitorCoords> }) {
  return (
    <div className="space-y-4">
      {coords && (
        <div className="overflow-hidden border border-hud-border" style={{ height: 350 }}>
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={coords.isGps ? 15 : 11}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" pane="overlayPane" />
            <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
          </MapContainer>
        </div>
      )}
      {v.gpsGranted && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5 text-hud-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          } label="GPS Data" color="text-hud-accent" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Latitude" value={v.latitude?.toFixed(6)} />
            <Detail label="Longitude" value={v.longitude?.toFixed(6)} />
            <Detail label="Accuracy" value={v.accuracy ? `${v.accuracy.toFixed(0)}m` : null} />
            <Detail label="Altitude" value={v.altitude ? `${v.altitude.toFixed(0)}m` : null} />
            <Detail label="Speed" value={v.speed != null ? `${v.speed} m/s` : null} />
            <Detail label="Heading" value={v.heading != null ? `${v.heading}°` : null} />
          </div>
        </>
      )}
      {v.ipCity && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
          } label="IP Geolocation" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="City" value={v.ipCity} icon={<LocationIcon />} />
            <Detail label="Region" value={v.ipRegion} />
            <Detail label="Country" value={v.ipCountry} icon={v.ipCountryCode ? <span className="text-base leading-none">{countryCodeToFlag(v.ipCountryCode)}</span> : undefined} />
            <Detail label="ISP" value={v.ipIsp} />
          </div>
        </>
      )}
      {!v.gpsGranted && !v.ipCity && (
        <p className="text-hud-text-muted font-mono text-sm">No location data available.</p>
      )}
    </div>
  );
}

function DeviceTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Detail label="Platform" value={v.platform} icon={<OSIcon name={v.os} />} />
        <Detail label="CPU Cores" value={v.cpuCores} />
        <Detail label="RAM" value={v.ram ? `${v.ram} GB` : null} />
        <Detail label="Screen" value={v.screenWidth ? `${v.screenWidth}x${v.screenHeight}` : null} />
        <Detail label="GPU" value={v.gpuRenderer} />
        <Detail label="Language" value={v.language} />
        <Detail label="Timezone" value={v.timezone} />
        <Detail label="Canvas Hash" value={v.canvasHash} />
        <Detail label="Touch" value={v.touchSupport != null ? (v.touchSupport ? 'Yes' : 'No') : null} />
        <Detail label="Cookies" value={v.cookiesEnabled != null ? (v.cookiesEnabled ? 'Yes' : 'No') : null} />
        <Detail label="DNT" value={v.doNotTrack != null ? (v.doNotTrack ? 'Yes' : 'No') : null} />
        <Detail label="User Agent" value={v.userAgent} />
      </div>

      {/* Screen Extended */}
      {(v.devicePixelRatio != null || v.screenOrientation) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          } label="Screen" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Avail Size" value={v.screenAvailWidth ? `${v.screenAvailWidth}x${v.screenAvailHeight}` : null} />
            <Detail label="Pixel Ratio" value={v.devicePixelRatio} />
            <Detail label="Orientation" value={v.screenOrientation} />
            <Detail label="Pixel Depth" value={v.pixelDepth} />
          </div>
        </>
      )}

      {/* Client Hints & Battery */}
      {(v.clientArch || v.clientBitness || v.clientPlatformVersion || v.clientModel || v.batteryLevel != null || v.batteryCharging != null) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
          } label="Client Hints & Battery" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Architecture" value={v.clientArch} />
            <Detail label="Bitness" value={v.clientBitness ? `${v.clientBitness}-bit` : null} />
            <Detail label="Platform Ver." value={v.clientPlatformVersion} />
            <Detail label="Device Model" value={v.clientModel} />
            <Detail label="Battery" value={v.batteryLevel != null ? `${v.batteryLevel}%` : null} />
            <Detail label="Charging" value={v.batteryCharging != null ? (v.batteryCharging ? 'Yes' : 'No') : null} />
          </div>
        </>
      )}

      {/* Media Devices */}
      {(v.cameraCount != null || v.microphoneCount != null || v.speakerCount != null) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          } label="Devices" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Cameras" value={v.cameraCount} />
            <Detail label="Microphones" value={v.microphoneCount} />
            <Detail label="Speakers" value={v.speakerCount} />
          </div>
        </>
      )}

      {/* Permissions */}
      {(v.permGeolocation || v.permCamera || v.permMicrophone || v.permNotifications) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          } label="Permissions" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Geolocation" value={v.permGeolocation} />
            <Detail label="Camera" value={v.permCamera} />
            <Detail label="Microphone" value={v.permMicrophone} />
            <Detail label="Notifications" value={v.permNotifications} />
          </div>
        </>
      )}
    </div>
  );
}

function RiskTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {v.botScore != null && (
          <div>
            <span className="text-hud-text-muted text-hud-xs uppercase font-mono">Bot Score</span>
            <p className={`font-mono font-semibold ${v.botScore > 60 ? 'text-hud-red' : v.botScore > 30 ? 'text-hud-yellow' : 'text-hud-green'}`}>
              {v.botScore}/100
            </p>
          </div>
        )}
        {v.humanScore != null && (
          <div>
            <span className="text-hud-text-muted text-hud-xs uppercase font-mono">Human Score</span>
            <p className={`font-mono font-semibold ${v.humanScore > 60 ? 'text-hud-green' : v.humanScore > 30 ? 'text-hud-yellow' : 'text-hud-red'}`}>
              {v.humanScore}/100
            </p>
          </div>
        )}
        {v.vpnDetected != null && (
          <div>
            <span className="text-hud-text-muted text-hud-xs uppercase font-mono">VPN Detected</span>
            <p className={`font-mono font-semibold ${v.vpnDetected ? 'text-hud-red' : 'text-hud-green'}`}>
              {v.vpnDetected ? 'Yes' : 'No'}
            </p>
          </div>
        )}
        <Detail label="Privacy Score" value={v.privacyScore != null ? `${v.privacyScore}/100` : null} />
        <Detail label="Device Tier" value={v.deviceTier} />
        {v.browserAuthenticity && (
          <div>
            <span className="text-hud-text-muted text-hud-xs uppercase font-mono">Browser Auth</span>
            <p className={`font-mono font-semibold ${v.browserAuthenticity === 'genuine' ? 'text-hud-green' : v.browserAuthenticity === 'likely_spoofed' ? 'text-hud-yellow' : 'text-hud-red'}`}>
              {v.browserAuthenticity}
            </p>
          </div>
        )}
        <Detail label="Uniqueness" value={v.uniquenessScore != null ? `${v.uniquenessScore}/100` : null} />
        {v.locationConsistency && (
          <div>
            <span className="text-hud-text-muted text-hud-xs uppercase font-mono">Location</span>
            <p className={`font-mono font-semibold ${v.locationConsistency === 'consistent' ? 'text-hud-green' : v.locationConsistency === 'minor_mismatch' ? 'text-hud-yellow' : 'text-hud-red'}`}>
              {v.locationConsistency}
            </p>
          </div>
        )}
      </div>

      {/* User Profile */}
      {v.userProfile && (() => {
        const profile = safeJSON(v.userProfile);
        if (!profile) return null;
        return (
          <div className="pt-3 border-t border-white/5">
            <SectionHeader icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            } label="User Profile" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Detail label="Device Type" value={profile.deviceType} />
              <Detail label="Real Browser" value={profile.likelyRealBrowser != null ? (profile.likelyRealBrowser ? 'Yes' : 'No') : null} />
              <Detail label="Real OS" value={profile.likelyRealOS != null ? (profile.likelyRealOS ? 'Yes' : 'No') : null} />
              <Detail label="Tech Level" value={profile.technicalLevel} />
              <Detail label="Network Type" value={profile.networkType} />
              <Detail label="Language" value={profile.primaryLanguage} />
              <Detail label="Region" value={profile.estimatedRegion} />
              <Detail label="Session Behavior" value={profile.sessionBehavior} />
            </div>
          </div>
        );
      })()}

      {/* Risk Flags */}
      {v.riskFlags && (() => {
        const flags: string[] = safeJSON(v.riskFlags) || [];
        return (
          <div className="pt-3 border-t border-white/5">
            <SectionHeader icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            } label="Risk Flags" />
            <div className="flex flex-wrap gap-1.5">
              {flags.length === 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 border text-hud-xs font-mono border-hud-green/40 text-hud-green bg-hud-green/10">No risk flags</span>
              ) : flags.map((flag) => (
                <span key={flag} className="inline-flex items-center px-2 py-0.5 border text-hud-xs font-mono border-hud-red/40 text-hud-red bg-hud-red/10">
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {v.botScore == null && v.humanScore == null && v.vpnDetected == null && !v.userProfile && !v.riskFlags && (
        <p className="text-hud-text-muted font-mono text-sm">No risk analysis data available.</p>
      )}
    </div>
  );
}

function FingerprintsTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
      {/* Basic */}
      {(v.audioHash || v.webglExtensions) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>
          } label="Basic Fingerprints" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Audio Hash" value={v.audioHash} />
            <Detail label="WebGL Texture" value={v.webglMaxTextureSize} />
            <Detail label="WebGL Viewport" value={v.webglMaxViewportWidth ? `${v.webglMaxViewportWidth}x${v.webglMaxViewportHeight}` : null} />
            <Detail label="Shader Precision" value={v.webglShaderPrecision} />
          </div>
        </>
      )}

      {/* Deep */}
      {(v.localIPs || v.speechVoicesHash || v.detectedFonts || v.intlLocaleFingerprint || v.keyboardLayout || v.jsHeapSizeLimit != null) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          } label="Deep Fingerprints" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Local IPs" value={v.localIPs} />
            <Detail label="Speech Voices" value={v.speechVoicesHash} />
            <Detail label="Detected Fonts" value={v.detectedFonts ? `${v.detectedFonts.split(',').length} fonts` : null} />
            <Detail label="Intl Fingerprint" value={v.intlLocaleFingerprint} />
            <Detail label="Keyboard Layout" value={v.keyboardLayout} />
            <Detail label="JS Heap Limit" value={v.jsHeapSizeLimit != null ? `${Math.round(v.jsHeapSizeLimit / 1048576)} MB` : null} />
          </div>
        </>
      )}

      {/* Advanced */}
      {(v.mathFingerprint || v.errorMessageFingerprint || v.domRectFingerprint || v.mediaCodecFingerprint || v.webgl2Fingerprint || v.svgFilterFingerprint || v.wasmCapabilities || v.audioContextProps || v.scrollbarWidth != null || v.timerResolution || v.cssSupportFingerprint || v.lineBreakFingerprint || v.dateToStringFingerprint || v.emojiSupportFingerprint || v.textMetricsFingerprint || v.cssSystemColorFingerprint || v.perfEntryTypes || v.securityContext) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>
          } label="Advanced Fingerprints" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Math Engine" value={v.mathFingerprint} />
            <Detail label="Error Messages" value={v.errorMessageFingerprint} />
            <Detail label="Date Format" value={v.dateToStringFingerprint} />
            <Detail label="Line Break" value={v.lineBreakFingerprint} />
            <Detail label="CSS Features" value={v.cssSupportFingerprint} />
            <Detail label="DOMRect" value={v.domRectFingerprint} />
            <Detail label="Text Metrics" value={v.textMetricsFingerprint} />
            <Detail label="SVG Filter" value={v.svgFilterFingerprint} />
            <Detail label="Emoji Version" value={v.emojiSupportFingerprint} />
            <Detail label="WebGL2" value={v.webgl2Fingerprint} />
            <Detail label="Audio Context" value={v.audioContextProps} />
            <Detail label="Media Codecs" value={v.mediaCodecFingerprint} />
            <Detail label="WASM" value={v.wasmCapabilities} />
            <Detail label="Scrollbar Width" value={v.scrollbarWidth != null ? `${v.scrollbarWidth}px` : null} />
            <Detail label="Timer Resolution" value={v.timerResolution != null ? `${v.timerResolution}ms` : null} />
            <Detail label="Security Context" value={v.securityContext} />
            <Detail label="System Colors" value={v.cssSystemColorFingerprint} />
            <Detail label="Perf Entry Types" value={v.perfEntryTypes} />
          </div>
        </>
      )}

      {!v.audioHash && !v.webglExtensions && !v.localIPs && !v.speechVoicesHash && !v.mathFingerprint && (
        <p className="text-hud-text-muted font-mono text-sm">No fingerprint data available.</p>
      )}
    </div>
  );
}

function NetworkTab({ v }: { v: Visitor }) {
  if (!v.connectionType && v.downlinkSpeed == null && v.networkRtt == null && v.saveData == null) {
    return <p className="text-hud-text-muted font-mono text-sm">No network data available.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <Detail label="Connection" value={v.connectionType} />
      <Detail label="Downlink" value={v.downlinkSpeed != null ? `${v.downlinkSpeed} Mbps` : null} />
      <Detail label="RTT" value={v.networkRtt != null ? `${v.networkRtt}ms` : null} />
      <Detail label="Save Data" value={v.saveData != null ? (v.saveData ? 'Yes' : 'No') : null} />
    </div>
  );
}

function BehaviorTab({ v }: { v: Visitor }) {
  if (v.dwellTime == null && !v.mouseData && !v.clickData && !v.scrollData && !v.touchData && !v.motionData && !v.focusData) {
    return <p className="text-hud-text-muted font-mono text-sm">No behavioral data available.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <Detail label="Dwell Time" value={v.dwellTime != null ? `${(v.dwellTime / 1000).toFixed(1)}s` : null} />
      {(() => {
        const m = safeJSON(v.mouseData);
        if (!m) return <Detail label="Mouse Moves" value="0" />;
        return <>
          <Detail label="Mouse Moves" value={m.totalMoves} />
          <Detail label="Mouse Avg Speed" value={m.avgSpeed != null ? m.avgSpeed.toFixed(2) : null} />
          <Detail label="Mouse Jitter" value={m.jitterScore != null ? m.jitterScore.toFixed(3) : null} />
          <Detail label="Direction Entropy" value={m.directionEntropy != null ? m.directionEntropy.toFixed(2) : null} />
        </>;
      })()}
      {(() => {
        const c = safeJSON(v.clickData);
        return <Detail label="Clicks" value={c ? c.totalClicks : '0'} />;
      })()}
      {(() => {
        const s = safeJSON(v.scrollData);
        if (!s) return null;
        return <>
          <Detail label="Scroll Depth" value={s.maxScrollDepth != null ? `${s.maxScrollDepth.toFixed(0)}%` : null} />
          <Detail label="Scroll Dir Changes" value={s.directionChanges} />
        </>;
      })()}
      {(() => {
        const t = safeJSON(v.touchData);
        if (!t) return null;
        return <>
          <Detail label="Touch Count" value={t.touchCount} />
          <Detail label="Avg Pressure" value={t.avgPressure != null ? t.avgPressure.toFixed(3) : null} />
        </>;
      })()}
      {(() => {
        const mo = safeJSON(v.motionData);
        if (!mo) return null;
        return <Detail label="Gyro/Accel" value={`${mo.hasGyro ? 'G' : '-'}/${mo.hasAccel ? 'A' : '-'}`} />;
      })()}
      {(() => {
        const f = safeJSON(v.focusData);
        if (!f) return null;
        return <Detail label="Tab Switches" value={f.blurCount} />;
      })()}
    </div>
  );
}

function SystemTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
      {/* CSS & Display */}
      {(v.prefersColorScheme || v.prefersReducedMotion != null || v.hdrSupport != null || v.forcedColors != null || v.pointerType || v.colorGamut || v.multiMonitor != null || v.maxTouchPoints != null) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
          } label="CSS & Display" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Color Scheme" value={v.prefersColorScheme} />
            <Detail label="Reduced Motion" value={v.prefersReducedMotion != null ? (v.prefersReducedMotion ? 'Yes' : 'No') : null} />
            <Detail label="HDR Support" value={v.hdrSupport != null ? (v.hdrSupport ? 'Yes' : 'No') : null} />
            <Detail label="Forced Colors" value={v.forcedColors != null ? (v.forcedColors ? 'Yes' : 'No') : null} />
            <Detail label="Pointer Type" value={v.pointerType} />
            <Detail label="Color Gamut" value={v.colorGamut} />
            <Detail label="Multi-Monitor" value={v.multiMonitor != null ? (v.multiMonitor ? 'Yes' : 'No') : null} />
            <Detail label="Touch Points" value={v.maxTouchPoints} />
          </div>
        </>
      )}

      {/* System flags */}
      {(v.vendor || v.isOnline != null || v.adBlockerDetected != null || v.incognitoDetected != null) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          } label="System" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Vendor" value={v.vendor} />
            <Detail label="Online" value={v.isOnline != null ? (v.isOnline ? 'Yes' : 'No') : null} />
            <Detail label="PDF Viewer" value={v.pdfViewerEnabled != null ? (v.pdfViewerEnabled ? 'Yes' : 'No') : null} />
            <Detail label="Webdriver" value={v.webdriverDetected != null ? (v.webdriverDetected ? 'Yes' : 'No') : null} />
            <Detail label="Ad Blocker" value={v.adBlockerDetected != null ? (v.adBlockerDetected ? 'Detected' : 'No') : null} />
            <Detail label="Incognito" value={v.incognitoDetected != null ? (v.incognitoDetected ? 'Likely' : 'No') : null} />
          </div>
        </>
      )}

      {/* Other */}
      {(v.referrer || v.pageLoadTime != null || v.installedLanguages || v.navigationType || v.timezoneOffset != null || v.observesDst != null || v.installedPlugins || v.apiSupport) && (
        <>
          <SectionHeader icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          } label="Other" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Detail label="Referrer" value={v.referrer} />
            <Detail label="Page Load" value={v.pageLoadTime != null ? `${v.pageLoadTime}ms` : null} />
            <Detail label="Languages" value={v.installedLanguages} />
            <Detail label="Nav Type" value={v.navigationType} />
            <Detail label="TZ Offset" value={v.timezoneOffset != null ? `UTC${v.timezoneOffset <= 0 ? '+' : '-'}${Math.abs(v.timezoneOffset / 60)}` : null} />
            <Detail label="Observes DST" value={v.observesDst != null ? (v.observesDst ? 'Yes' : 'No') : null} />
            <Detail label="Plugins" value={v.installedPlugins ? `${v.installedPlugins.split(',').length} plugins` : null} />
            <Detail label="API Support" value={v.apiSupport ? (() => { try { const a = JSON.parse(v.apiSupport); return Object.values(a).filter(Boolean).length + '/' + Object.keys(a).length; } catch { return null; } })() : null} />
          </div>
        </>
      )}

      {!v.prefersColorScheme && v.prefersReducedMotion == null && !v.vendor && v.isOnline == null && !v.referrer && v.pageLoadTime == null && (
        <p className="text-hud-text-muted font-mono text-sm">No system data available.</p>
      )}
    </div>
  );
}
