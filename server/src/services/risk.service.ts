import { DATACENTER_ISP_KEYWORDS } from './data/constants.js';
import { isTimezoneConsistent } from './geo-analysis.service.js';
import { checkBrowserAuthenticity } from './fingerprint-analysis.service.js';
import { safeParseJSON } from './helpers.js';

function isDesktop(os: string): boolean {
  return os.includes('windows') || os.includes('mac') || os.includes('linux') || os.includes('chrome os');
}

export function computeRiskFlags(v: Record<string, any>, botScore: number, vpnDetected: boolean): string[] {
  const flags: string[] = [];

  if (v.webdriverDetected) flags.push('webdriver_detected');

  if (v.ipCountryCode && v.timezoneOffset != null) {
    if (!isTimezoneConsistent(v.ipCountryCode, v.timezoneOffset)) {
      flags.push('timezone_ip_mismatch');
    }
  }

  const authenticity = checkBrowserAuthenticity(v);
  if (authenticity === 'spoofed' || authenticity === 'likely_spoofed') {
    flags.push('browser_spoofing_likely');
  }

  const isp = (v.ipIsp || '').toLowerCase();
  if (isp.includes('tor') || isp.includes('tor exit') || isp.includes('tor relay')) {
    flags.push('tor_suspected');
  }

  if (v.webdriverDetected && !v.gpuRenderer) {
    flags.push('headless_browser');
  }

  if (vpnDetected) flags.push('vpn_likely');
  if (botScore > 50) flags.push('bot_behavior');

  for (const kw of DATACENTER_ISP_KEYWORDS) {
    if (isp.includes(kw)) {
      flags.push('datacenter_ip');
      break;
    }
  }

  if (!v.canvasHash) flags.push('canvas_blocked');

  const mouse = safeParseJSON(v.mouseData);
  const click = safeParseJSON(v.clickData);
  const scroll = safeParseJSON(v.scrollData);
  const os = (v.os || '').toLowerCase();
  if (isDesktop(os) && (!mouse || mouse.totalMoves === 0) && (!click || click.totalClicks === 0) && (!scroll || scroll.totalScrollEvents === 0)) {
    flags.push('no_human_interaction');
  }

  if (v.cpuCores === 0 || v.ram === 0) flags.push('impossible_hardware');

  if (v.gpuRenderer && v.gpuRenderer.toLowerCase().includes('swiftshader')) {
    flags.push('emulator_suspected');
  }

  if (v.adBlockerDetected || v.incognitoDetected || v.doNotTrack) {
    flags.push('privacy_tools_active');
  }

  return flags;
}

export function computePrivacyScore(v: Record<string, any>): number {
  let score = 0;

  if (v.doNotTrack) score += 10;
  if (v.adBlockerDetected) score += 15;
  if (v.incognitoDetected) score += 20;
  if (v.cookiesEnabled === false) score += 10;

  const perms = [v.permGeolocation, v.permCamera, v.permMicrophone, v.permNotifications];
  if (perms.every(p => p === 'denied')) score += 10;

  if (!v.localIPs || v.localIPs === '' || v.localIPs === 'null') score += 10;
  if (!v.canvasHash) score += 8;
  if (!v.referrer) score += 5;

  const langs = v.installedLanguages;
  if (langs && langs.split(',').length <= 1) score += 5;

  if (v.cameraCount === 0 && v.microphoneCount === 0 && v.speakerCount === 0) score += 7;

  return Math.min(100, score);
}

export function computeDeviceTier(v: Record<string, any>): string {
  let score = 0;
  let factors = 0;

  if (v.ram != null) {
    factors += 3;
    if (v.ram >= 16) score += 3 * 4;
    else if (v.ram >= 8) score += 3 * 3;
    else if (v.ram >= 4) score += 3 * 2;
    else score += 3 * 1;
  }

  if (v.cpuCores != null) {
    factors += 2;
    if (v.cpuCores >= 12) score += 2 * 4;
    else if (v.cpuCores >= 8) score += 2 * 3;
    else if (v.cpuCores >= 4) score += 2 * 2;
    else score += 2 * 1;
  }

  if (v.screenWidth != null && v.screenHeight != null) {
    factors += 2;
    const pixels = v.screenWidth * v.screenHeight;
    if (pixels >= 3686400) score += 2 * 4;
    else if (pixels >= 2073600) score += 2 * 3;
    else if (pixels >= 921600) score += 2 * 2;
    else score += 2 * 1;
  }

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
