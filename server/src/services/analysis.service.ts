import { db } from '../db/index.js';
import { visitors } from '../db/schema.js';
import { sql } from 'drizzle-orm';

// --- Helpers ---

function safeParseJSON(str: string | null | undefined): any {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const VPN_ISP_KEYWORDS = [
  'vpn', 'proxy', 'datacenter', 'data center', 'hosting', 'cloud', 'server',
  'digitalocean', 'amazon', 'aws', 'google cloud', 'azure', 'linode', 'vultr',
  'ovh', 'hetzner', 'choopa', 'leaseweb', 'contabo', 'scaleway', 'oracle cloud',
  'alibaba', 'tencent', 'rackspace', 'softlayer', 'colocation', 'colo',
  'nordvpn', 'expressvpn', 'surfshark', 'mullvad', 'protonvpn', 'cyberghost',
  'private internet access', 'pia', 'torguard', 'windscribe', 'ipvanish',
  'tor exit', 'tor relay', 'm247', 'datacamp', 'quadranet',
];

const COUNTRY_TIMEZONE_MAP: Record<string, number[]> = {
  US: [-10, -9, -8, -7, -6, -5, -4],
  CA: [-8, -7, -6, -5, -4, -3],
  GB: [0], UK: [0],
  DE: [1, 2], FR: [1, 2], ES: [1, 2], IT: [1, 2], NL: [1, 2], BE: [1, 2],
  AT: [1, 2], CH: [1, 2], PL: [1, 2], CZ: [1, 2], SE: [1, 2], NO: [1, 2],
  DK: [1, 2], FI: [2, 3], PT: [0, 1],
  RU: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  JP: [9], KR: [9],
  CN: [8], HK: [8], TW: [8], SG: [8], MY: [8], PH: [8],
  IN: [5], // UTC+5:30 rounds to 5 or 6
  AU: [8, 9, 10, 11],
  NZ: [12, 13],
  BR: [-5, -4, -3, -2],
  MX: [-8, -7, -6, -5],
  AR: [-3],
  CL: [-4, -3],
  CO: [-5],
  ZA: [2],
  EG: [2, 3],
  NG: [1],
  KE: [3],
  AE: [4],
  SA: [3],
  IL: [2, 3],
  TR: [3],
  TH: [7],
  VN: [7],
  ID: [7, 8, 9],
  PK: [5],
  BD: [6],
  UA: [2, 3],
  RO: [2, 3],
  GR: [2, 3],
  IE: [0, 1],
  IS: [0],
};

// --- Analysis Functions ---

function computeBotScore(v: Record<string, any>): number {
  let score = 0;

  if (v.webdriverDetected) score += 40;

  // No mouse on desktop
  const mouse = safeParseJSON(v.mouseData);
  const os = (v.os || '').toLowerCase();
  const isDesktop = os.includes('windows') || os.includes('mac') || os.includes('linux') || os.includes('chrome os');
  if (isDesktop && (!mouse || mouse.totalMoves === 0)) score += 15;

  // No scroll
  const scroll = safeParseJSON(v.scrollData);
  if (!scroll || scroll.totalScrollEvents === 0) score += 8;

  // Very short dwell time
  if (v.dwellTime != null && v.dwellTime < 500) score += 12;

  // Missing common APIs
  const apiSupport = safeParseJSON(v.apiSupport);
  if (apiSupport) {
    const missing = ['bluetooth', 'usb', 'hid', 'serial', 'webgpu'].filter(k => apiSupport[k] === false);
    // Most real browsers lack these, so only penalize if ALL common ones missing
    if (!apiSupport.serviceWorker && !apiSupport.webgl) score += 10;
  }

  // Uniform timer (high precision = real, very low variance = bot)
  const timerRes = v.timerResolution;
  if (timerRes != null) {
    const res = parseFloat(timerRes);
    if (!isNaN(res) && res === 0) score += 5;
  }

  // Back/forward navigation
  if (v.navigationType === 'back_forward') score += 3;

  // No mouse jitter on desktop (perfectly smooth = bot)
  if (isDesktop && mouse && mouse.totalMoves > 10 && mouse.jitterScore === 0) score += 7;

  return Math.min(100, score);
}

function detectVPN(v: Record<string, any>): boolean {
  const isp = (v.ipIsp || '').toLowerCase();

  // ISP keyword check
  for (const kw of VPN_ISP_KEYWORDS) {
    if (isp.includes(kw)) return true;
  }

  // Timezone vs IP country mismatch
  if (v.ipCountryCode && v.timezoneOffset != null) {
    const cc = v.ipCountryCode.toUpperCase();
    const expectedOffsets = COUNTRY_TIMEZONE_MAP[cc];
    if (expectedOffsets) {
      const actualOffset = -(v.timezoneOffset / 60); // JS offset is inverted
      const match = expectedOffsets.some(o => Math.abs(o - actualOffset) <= 1);
      if (!match) return true;
    }
  }

  return false;
}

function computePrivacyScore(v: Record<string, any>): number {
  let score = 0;

  if (v.doNotTrack) score += 10;
  if (v.adBlockerDetected) score += 15;
  if (v.incognitoDetected) score += 20;
  if (v.cookiesEnabled === false) score += 10;

  // All permissions denied
  const perms = [v.permGeolocation, v.permCamera, v.permMicrophone, v.permNotifications];
  if (perms.every(p => p === 'denied')) score += 10;

  // No WebRTC IPs
  if (!v.localIPs || v.localIPs === '' || v.localIPs === 'null') score += 10;

  // Canvas blocked (hash is null/empty)
  if (!v.canvasHash) score += 8;

  // No referrer
  if (!v.referrer) score += 5;

  // Few languages
  const langs = v.installedLanguages;
  if (langs && langs.split(',').length <= 1) score += 5;

  // No media devices
  if (v.cameraCount === 0 && v.microphoneCount === 0 && v.speakerCount === 0) score += 7;

  return Math.min(100, score);
}

function computeDeviceTier(v: Record<string, any>): string {
  let score = 0;
  let factors = 0;

  // RAM (weight 3)
  if (v.ram != null) {
    factors += 3;
    if (v.ram >= 16) score += 3 * 4;
    else if (v.ram >= 8) score += 3 * 3;
    else if (v.ram >= 4) score += 3 * 2;
    else score += 3 * 1;
  }

  // CPU cores (weight 2)
  if (v.cpuCores != null) {
    factors += 2;
    if (v.cpuCores >= 12) score += 2 * 4;
    else if (v.cpuCores >= 8) score += 2 * 3;
    else if (v.cpuCores >= 4) score += 2 * 2;
    else score += 2 * 1;
  }

  // Screen resolution (weight 2)
  if (v.screenWidth != null && v.screenHeight != null) {
    factors += 2;
    const pixels = v.screenWidth * v.screenHeight;
    if (pixels >= 3686400) score += 2 * 4;       // 4K+
    else if (pixels >= 2073600) score += 2 * 3;   // 1440p+
    else if (pixels >= 921600) score += 2 * 2;     // 1080p+
    else score += 2 * 1;
  }

  // GPU renderer (weight 1)
  if (v.gpuRenderer) {
    factors += 1;
    const gpu = v.gpuRenderer.toLowerCase();
    if (gpu.includes('rtx') || gpu.includes('radeon rx 7') || gpu.includes('m3') || gpu.includes('m2') || gpu.includes('apple gpu')) {
      score += 4;
    } else if (gpu.includes('gtx') || gpu.includes('radeon rx 6') || gpu.includes('m1') || gpu.includes('iris xe')) {
      score += 3;
    } else if (gpu.includes('intel') || gpu.includes('uhd') || gpu.includes('hd graphics')) {
      score += 2;
    } else {
      score += 1;
    }
  }

  if (factors === 0) return 'mid';
  const avg = score / factors;
  if (avg >= 3.5) return 'flagship';
  if (avg >= 2.5) return 'high';
  if (avg >= 1.5) return 'mid';
  return 'low';
}

function checkBrowserAuthenticity(v: Record<string, any>): string {
  let mismatches = 0;
  const browser = (v.browser || '').toLowerCase();
  const vendor = (v.vendor || '').toLowerCase();

  // Chrome should have Google Inc. vendor
  if (browser.includes('chrome') && !vendor.includes('google')) mismatches++;

  // Firefox should have empty vendor
  if (browser.includes('firefox') && vendor !== '') mismatches++;

  // Safari should have Apple vendor
  if (browser === 'safari' && !vendor.includes('apple')) mismatches++;

  // Chrome-specific APIs
  const apiSupport = safeParseJSON(v.apiSupport);
  if (browser.includes('chrome') && apiSupport) {
    // Chrome should support these
    if (apiSupport.bluetooth === false && apiSupport.usb === false && apiSupport.serial === false) {
      // Might be spoofed
    }
  }

  // Check webdriver + claimed regular browser
  if (v.webdriverDetected && browser !== 'unknown') mismatches++;

  // Check CSS support mismatch
  const cssFp = v.cssSupportFingerprint;
  const errorFp = v.errorMessageFingerprint;
  if (cssFp && errorFp) {
    // Different browsers have different error message formats
    // This is a heuristic check
  }

  if (mismatches >= 2) return 'spoofed';
  if (mismatches === 1) return 'likely_spoofed';
  return 'genuine';
}

function computeUniquenessScore(v: Record<string, any>): number {
  // Key fingerprint fields and their weights
  const fields: [string, number][] = [
    ['canvasHash', 15],
    ['audioHash', 15],
    ['mathFingerprint', 10],
    ['webgl2Fingerprint', 10],
    ['domRectFingerprint', 10],
    ['errorMessageFingerprint', 8],
    ['cssSystemColorFingerprint', 8],
    ['textMetricsFingerprint', 8],
    ['emojiSupportFingerprint', 8],
    ['svgFilterFingerprint', 8],
  ];

  let totalWeight = 0;
  let weightedScore = 0;

  // Get total visitor count for percentage calculation
  const countResult = db.select({ count: sql<number>`count(*)` }).from(visitors).get();
  const totalVisitors = countResult?.count || 1;

  for (const [field, weight] of fields) {
    const val = v[field];
    if (!val) continue;

    totalWeight += weight;

    // Count how many other visitors share this value
    const col = field.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
    try {
      const matchResult = db.select({ count: sql<number>`count(*)` })
        .from(visitors)
        .where(sql`${sql.raw(col)} = ${val}`)
        .get();
      const matchCount = matchResult?.count || 0;
      const sharePercent = (matchCount / totalVisitors) * 100;

      if (sharePercent < 1) weightedScore += weight * 100;
      else if (sharePercent < 5) weightedScore += weight * 80;
      else if (sharePercent < 10) weightedScore += weight * 50;
      else weightedScore += weight * 20;
    } catch {
      // If query fails, use neutral score
      weightedScore += weight * 50;
    }
  }

  if (totalWeight === 0) return 50;
  return Math.round(weightedScore / totalWeight);
}

function checkLocationConsistency(v: Record<string, any>): string {
  // GPS vs IP location
  if (v.gpsGranted && v.latitude != null && v.longitude != null && v.ipLat != null && v.ipLon != null) {
    const dist = haversineDistance(v.latitude, v.longitude, v.ipLat, v.ipLon);
    if (dist > 500) return 'suspicious';
    if (dist > 100) return 'minor_mismatch';
  }

  // Timezone vs IP country
  if (v.ipCountryCode && v.timezoneOffset != null) {
    const cc = v.ipCountryCode.toUpperCase();
    const expectedOffsets = COUNTRY_TIMEZONE_MAP[cc];
    if (expectedOffsets) {
      const actualOffset = -(v.timezoneOffset / 60);
      const match = expectedOffsets.some(o => Math.abs(o - actualOffset) <= 1);
      if (!match) return 'suspicious';
    }
  }

  return 'consistent';
}

function computeHumanScore(v: Record<string, any>): number {
  let score = 0;

  const mouse = safeParseJSON(v.mouseData);
  if (mouse && mouse.totalMoves > 0) {
    // Mouse with jitter
    if (mouse.jitterScore > 0) score += 20;
    // Speed variance (not uniform)
    if (mouse.avgSpeed > 0 && mouse.jitterScore > 0) score += 15;
  }

  // Click variance
  const click = safeParseJSON(v.clickData);
  if (click && click.totalClicks > 1 && click.avgTimeBetweenClicks > 100) score += 10;

  // Scroll direction changes
  const scroll = safeParseJSON(v.scrollData);
  if (scroll && scroll.directionChanges > 0) score += 10;

  // Tab switching
  const focus = safeParseJSON(v.focusData);
  if (focus && focus.blurCount > 0) score += 10;

  // Touch pressure
  const touch = safeParseJSON(v.touchData);
  if (touch && touch.avgPressure > 0) score += 15;

  // Reasonable dwell time (1-300 seconds)
  if (v.dwellTime != null && v.dwellTime > 1000 && v.dwellTime < 300000) score += 10;

  // Device motion
  const motion = safeParseJSON(v.motionData);
  if (motion && (motion.hasGyro || motion.hasAccel)) score += 10;

  return Math.min(100, score);
}

function buildUserProfile(v: Record<string, any>): Record<string, any> {
  const os = (v.os || '').toLowerCase();
  const browser = (v.browser || '').toLowerCase();

  // Device type
  let deviceType = 'unknown';
  if (os.includes('android') || os.includes('ios') || os.includes('ipad')) {
    deviceType = v.maxTouchPoints > 0 && v.screenWidth < 800 ? 'mobile' : 'tablet';
  } else if (os.includes('windows') || os.includes('mac') || os.includes('linux') || os.includes('chrome os')) {
    deviceType = 'desktop';
  }

  // Likely real browser
  const vendor = (v.vendor || '').toLowerCase();
  let likelyRealBrowser = true;
  if (v.webdriverDetected) likelyRealBrowser = false;
  if (browser.includes('chrome') && !vendor.includes('google')) likelyRealBrowser = false;

  // Likely real OS
  const likelyRealOS = !!v.os && v.os !== 'Unknown';

  // Technical level
  let technicalLevel = 'basic';
  if (v.adBlockerDetected || v.doNotTrack) technicalLevel = 'intermediate';
  if (v.incognitoDetected || (v.localIPs && v.localIPs === '')) technicalLevel = 'advanced';
  if (v.adBlockerDetected && v.incognitoDetected && v.doNotTrack) technicalLevel = 'expert';

  // Network type
  let networkType = 'unknown';
  const conn = (v.connectionType || '').toLowerCase();
  if (conn === 'wifi' || conn === '4g' || conn === '3g' || conn === '2g' || conn === 'cellular') {
    networkType = conn;
  } else if (conn === 'ethernet') {
    networkType = 'wired';
  } else if (v.downlinkSpeed != null) {
    networkType = v.downlinkSpeed > 10 ? 'broadband' : 'limited';
  }

  // Primary language
  const primaryLanguage = v.language || 'unknown';

  // Estimated region from IP
  const estimatedRegion = v.ipCountry || v.ipRegion || 'unknown';

  // Session behavior
  const mouse = safeParseJSON(v.mouseData);
  const click = safeParseJSON(v.clickData);
  const scroll = safeParseJSON(v.scrollData);
  let sessionBehavior = 'passive';
  if ((mouse && mouse.totalMoves > 10) || (click && click.totalClicks > 2) || (scroll && scroll.totalScrollEvents > 3)) {
    sessionBehavior = 'active';
  }
  if ((mouse && mouse.totalMoves > 50) && (click && click.totalClicks > 5) && (scroll && scroll.totalScrollEvents > 10)) {
    sessionBehavior = 'highly_engaged';
  }

  // Fingerprint stability (how many fingerprint fields are populated)
  const fpFields = [
    'canvasHash', 'audioHash', 'mathFingerprint', 'webgl2Fingerprint',
    'domRectFingerprint', 'errorMessageFingerprint', 'svgFilterFingerprint',
    'textMetricsFingerprint', 'emojiSupportFingerprint', 'cssSystemColorFingerprint'
  ];
  const populated = fpFields.filter(f => v[f]).length;
  const fingerprintStability = populated >= 8 ? 'stable' : populated >= 5 ? 'partial' : 'unstable';

  return {
    deviceType,
    likelyRealBrowser,
    likelyRealOS,
    technicalLevel,
    networkType,
    primaryLanguage,
    estimatedRegion,
    sessionBehavior,
    fingerprintStability,
  };
}

function computeRiskFlags(v: Record<string, any>, botScore: number, vpnDetected: boolean): string[] {
  const flags: string[] = [];

  if (v.webdriverDetected) flags.push('webdriver_detected');

  if (v.ipCountryCode && v.timezoneOffset != null) {
    const cc = v.ipCountryCode.toUpperCase();
    const expectedOffsets = COUNTRY_TIMEZONE_MAP[cc];
    if (expectedOffsets) {
      const actualOffset = -(v.timezoneOffset / 60);
      const match = expectedOffsets.some(o => Math.abs(o - actualOffset) <= 1);
      if (!match) flags.push('timezone_ip_mismatch');
    }
  }

  const authenticity = checkBrowserAuthenticity(v);
  if (authenticity === 'spoofed' || authenticity === 'likely_spoofed') {
    flags.push('browser_spoofing_likely');
  }

  // Tor suspected: very low bandwidth + no WebRTC + VPN ISP
  const isp = (v.ipIsp || '').toLowerCase();
  if (isp.includes('tor') || isp.includes('tor exit') || isp.includes('tor relay')) {
    flags.push('tor_suspected');
  }

  // Headless browser
  if (v.webdriverDetected && !v.gpuRenderer) {
    flags.push('headless_browser');
  }

  if (vpnDetected) flags.push('vpn_likely');

  if (botScore > 50) flags.push('bot_behavior');

  // Datacenter IP
  const dcKeywords = ['datacenter', 'data center', 'hosting', 'cloud', 'digitalocean', 'amazon', 'aws', 'azure', 'google cloud', 'linode', 'vultr', 'ovh', 'hetzner'];
  for (const kw of dcKeywords) {
    if (isp.includes(kw)) {
      flags.push('datacenter_ip');
      break;
    }
  }

  if (!v.canvasHash) flags.push('canvas_blocked');

  // No human interaction on desktop
  const mouse = safeParseJSON(v.mouseData);
  const click = safeParseJSON(v.clickData);
  const scroll = safeParseJSON(v.scrollData);
  const os = (v.os || '').toLowerCase();
  const isDesktop = os.includes('windows') || os.includes('mac') || os.includes('linux');
  if (isDesktop && (!mouse || mouse.totalMoves === 0) && (!click || click.totalClicks === 0) && (!scroll || scroll.totalScrollEvents === 0)) {
    flags.push('no_human_interaction');
  }

  // Impossible hardware (e.g., 0 cores or 0 RAM)
  if (v.cpuCores === 0 || v.ram === 0) flags.push('impossible_hardware');

  // Emulator: very specific patterns
  if (v.gpuRenderer && v.gpuRenderer.toLowerCase().includes('swiftshader')) {
    flags.push('emulator_suspected');
  }

  // Privacy tools active
  if (v.adBlockerDetected || v.incognitoDetected || v.doNotTrack) {
    flags.push('privacy_tools_active');
  }

  return flags;
}

// --- Main Export ---

export function analyzeVisitor(visitor: Record<string, any>): Record<string, any> {
  const botScore = computeBotScore(visitor);
  const vpnDetected = detectVPN(visitor);
  const privacyScore = computePrivacyScore(visitor);
  const deviceTier = computeDeviceTier(visitor);
  const browserAuthenticity = checkBrowserAuthenticity(visitor);
  const uniquenessScore = computeUniquenessScore(visitor);
  const locationConsistency = checkLocationConsistency(visitor);
  const humanScore = computeHumanScore(visitor);
  const userProfile = buildUserProfile(visitor);
  const riskFlags = computeRiskFlags(visitor, botScore, vpnDetected);

  return {
    botScore,
    vpnDetected,
    privacyScore,
    deviceTier,
    browserAuthenticity,
    uniquenessScore,
    locationConsistency,
    humanScore,
    userProfile: JSON.stringify(userProfile),
    riskFlags: JSON.stringify(riskFlags),
  };
}
