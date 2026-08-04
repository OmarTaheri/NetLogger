import type { Visitor } from '@netlogger/shared/types';
import { OSIcon, SectionHeader, Detail } from '../visitorHelpers';

export default function DeviceTab({ v }: { v: Visitor }) {
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
