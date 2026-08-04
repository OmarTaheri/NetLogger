import { safeParseJSON } from './helpers.js';

function isDesktop(os: string): boolean {
  return os.includes('windows') || os.includes('mac') || os.includes('linux') || os.includes('chrome os');
}

export function computeBotScore(v: Record<string, any>): number {
  let score = 0;

  if (v.webdriverDetected) score += 40;

  const mouse = safeParseJSON(v.mouseData);
  const os = (v.os || '').toLowerCase();
  if (isDesktop(os) && (!mouse || mouse.totalMoves === 0)) score += 15;

  const scroll = safeParseJSON(v.scrollData);
  if (!scroll || scroll.totalScrollEvents === 0) score += 8;

  if (v.dwellTime != null && v.dwellTime < 500) score += 12;

  const apiSupport = safeParseJSON(v.apiSupport);
  if (apiSupport) {
    if (!apiSupport.serviceWorker && !apiSupport.webgl) score += 10;
  }

  const timerRes = v.timerResolution;
  if (timerRes != null) {
    const res = parseFloat(timerRes);
    if (!isNaN(res) && res === 0) score += 5;
  }

  if (v.navigationType === 'back_forward') score += 3;

  if (isDesktop(os) && mouse && mouse.totalMoves > 10 && mouse.jitterScore === 0) score += 7;

  return Math.min(100, score);
}

export function computeHumanScore(v: Record<string, any>): number {
  let score = 0;

  const mouse = safeParseJSON(v.mouseData);
  if (mouse && mouse.totalMoves > 0) {
    if (mouse.jitterScore > 0) score += 20;
    if (mouse.avgSpeed > 0 && mouse.jitterScore > 0) score += 15;
  }

  const click = safeParseJSON(v.clickData);
  if (click && click.totalClicks > 1 && click.avgTimeBetweenClicks > 100) score += 10;

  const scroll = safeParseJSON(v.scrollData);
  if (scroll && scroll.directionChanges > 0) score += 10;

  const focus = safeParseJSON(v.focusData);
  if (focus && focus.blurCount > 0) score += 10;

  const touch = safeParseJSON(v.touchData);
  if (touch && touch.avgPressure > 0) score += 15;

  if (v.dwellTime != null && v.dwellTime > 1000 && v.dwellTime < 300000) score += 10;

  const motion = safeParseJSON(v.motionData);
  if (motion && (motion.hasGyro || motion.hasAccel)) score += 10;

  return Math.min(100, score);
}
