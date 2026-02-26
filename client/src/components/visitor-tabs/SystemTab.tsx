import type { Visitor } from 'shared/types';
import { SectionHeader, Detail } from '../visitorHelpers';

export default function SystemTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
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
