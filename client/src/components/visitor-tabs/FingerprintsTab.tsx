import type { Visitor } from 'shared/types';
import { SectionHeader, Detail } from '../visitorHelpers';

export default function FingerprintsTab({ v }: { v: Visitor }) {
  return (
    <div className="space-y-4">
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
