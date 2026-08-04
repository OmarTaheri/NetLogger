import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import type { Visitor } from '@netlogger/shared/types';
import {
  markerIcon, countryCodeToFlag, LocationIcon,
  SectionHeader, Detail, getVisitorCoords,
} from '../visitorHelpers';

interface Props {
  v: Visitor;
  coords: ReturnType<typeof getVisitorCoords>;
}

export default function LocationTab({ v, coords }: Props) {
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
