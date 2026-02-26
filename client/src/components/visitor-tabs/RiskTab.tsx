import type { Visitor } from 'shared/types';
import { SectionHeader, Detail, safeJSON } from '../visitorHelpers';

export default function RiskTab({ v }: { v: Visitor }) {
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
