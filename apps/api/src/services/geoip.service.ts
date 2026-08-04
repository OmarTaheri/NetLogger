interface GeoIpResult {
  ipCity: string | null;
  ipRegion: string | null;
  ipCountry: string | null;
  ipCountryCode: string | null;
  ipLat: number | null;
  ipLon: number | null;
  ipIsp: string | null;
}

export async function lookupIp(ip: string): Promise<GeoIpResult> {
  const empty: GeoIpResult = { ipCity: null, ipRegion: null, ipCountry: null, ipCountryCode: null, ipLat: null, ipLon: null, ipIsp: null };

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return empty;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode,lat,lon,isp`);
    const data = await res.json();
    if (data.status === 'success') {
      return {
        ipCity: data.city || null,
        ipRegion: data.regionName || null,
        ipCountry: data.country || null,
        ipCountryCode: data.countryCode || null,
        ipLat: data.lat || null,
        ipLon: data.lon || null,
        ipIsp: data.isp || null,
      };
    }
  } catch {
    // fail silently
  }

  return empty;
}
