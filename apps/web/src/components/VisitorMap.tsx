import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Visitor } from '@netlogger/shared/types';

// Custom glowing dot markers
const gpsIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:#ff6600;border-radius:50%;box-shadow:0 0 8px 2px rgba(255,102,0,0.6);border:2px solid rgba(255,102,0,0.8)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -8],
});

const ipIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:#00aaff;border-radius:50%;box-shadow:0 0 6px 2px rgba(0,170,255,0.5);border:2px solid rgba(0,170,255,0.7)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  popupAnchor: [0, -7],
});

interface MarkerData {
  visitor: Visitor;
  lat: number;
  lng: number;
  isGps: boolean;
}

function FitBounds({ markers, animate }: { markers: MarkerData[]; animate?: boolean }) {
  const map = useMap();
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (markers.length === 0) return;

    const isInitial = isInitialRef.current;
    isInitialRef.current = false;

    const doFit = () => {
      if (markers.length === 1) {
        const zoom = markers[0].isGps ? 17 : 14;
        if (animate) {
          map.flyTo([markers[0].lat, markers[0].lng], zoom, { duration: 1.8 });
        } else {
          map.setView([markers[0].lat, markers[0].lng], zoom);
        }
        return;
      }
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      if (animate) {
        map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16, duration: 1.8 });
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    };

    if (animate && isInitial) {
      const timer = setTimeout(doFit, 600);
      return () => clearTimeout(timer);
    } else {
      doFit();
    }
  }, [markers, map, animate]);

  return null;
}

interface VisitorMapProps {
  visitors: Visitor[];
  height?: string;
  animate?: boolean;
}

export default function VisitorMap({ visitors, height = '400px', animate }: VisitorMapProps) {
  const markers: MarkerData[] = visitors
    .map((v) => {
      const hasGps = v.gpsGranted && v.latitude != null && v.longitude != null;
      const hasIp = v.ipLat != null && v.ipLon != null;
      if (!hasGps && !hasIp) return null;
      return {
        visitor: v,
        lat: hasGps ? v.latitude! : v.ipLat!,
        lng: hasGps ? v.longitude! : v.ipLon!,
        isGps: hasGps,
      };
    })
    .filter(Boolean) as MarkerData[];

  return (
    <div style={{ height }} className="hud-corners overflow-hidden border border-hud-border">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          pane="overlayPane"
        />
        <FitBounds markers={markers} animate={animate} />
        {markers.map((m) => (
          <Marker key={m.visitor.id} position={[m.lat, m.lng]} icon={m.isGps ? gpsIcon : ipIcon}>
            <Popup>
              <div className="text-sm font-mono">
                <p className="font-semibold text-hud-text">{m.visitor.browser} / {m.visitor.os}</p>
                <p className="text-hud-text-dim">{m.visitor.ip}</p>
                {m.isGps && <p className="text-hud-accent">GPS: {m.lat.toFixed(4)}, {m.lng.toFixed(4)}</p>}
                {!m.isGps && <p className="text-hud-blue">IP: {m.visitor.ipCity}, {m.visitor.ipCountry}</p>}
                <p className="text-hud-text-muted text-xs mt-1">{new Date(m.visitor.createdAt).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
