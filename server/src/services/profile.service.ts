import { safeParseJSON } from './helpers.js';

export function buildUserProfile(v: Record<string, any>): Record<string, any> {
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

  const primaryLanguage = v.language || 'unknown';
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

  // Fingerprint stability
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
