import type { Visitor } from 'shared/types';
import { Detail, safeJSON } from '../visitorHelpers';

export default function BehaviorTab({ v }: { v: Visitor }) {
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
