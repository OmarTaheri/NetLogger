import type { Visitor } from '@netlogger/shared/types';
import { Detail } from '../visitorHelpers';

export default function NetworkTab({ v }: { v: Visitor }) {
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
