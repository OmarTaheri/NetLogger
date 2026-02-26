import { COUNTRY_TIMEZONE_MAP, VPN_ISP_KEYWORDS } from './data/constants.js';

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isTimezoneConsistent(countryCode: string, timezoneOffset: number): boolean {
  const cc = countryCode.toUpperCase();
  const expectedOffsets = COUNTRY_TIMEZONE_MAP[cc];
  if (!expectedOffsets) return true; // unknown country, assume ok
  const actualOffset = -(timezoneOffset / 60); // JS offset is inverted
  return expectedOffsets.some(o => Math.abs(o - actualOffset) <= 1);
}

export function detectVPN(v: Record<string, any>): boolean {
  const isp = (v.ipIsp || '').toLowerCase();

  for (const kw of VPN_ISP_KEYWORDS) {
    if (isp.includes(kw)) return true;
  }

  if (v.ipCountryCode && v.timezoneOffset != null) {
    if (!isTimezoneConsistent(v.ipCountryCode, v.timezoneOffset)) return true;
  }

  return false;
}

export function checkLocationConsistency(v: Record<string, any>): string {
  // GPS vs IP location
  if (v.gpsGranted && v.latitude != null && v.longitude != null && v.ipLat != null && v.ipLon != null) {
    const dist = haversineDistance(v.latitude, v.longitude, v.ipLat, v.ipLon);
    if (dist > 500) return 'suspicious';
    if (dist > 100) return 'minor_mismatch';
  }

  // Timezone vs IP country
  if (v.ipCountryCode && v.timezoneOffset != null) {
    if (!isTimezoneConsistent(v.ipCountryCode, v.timezoneOffset)) return 'suspicious';
  }

  return 'consistent';
}
