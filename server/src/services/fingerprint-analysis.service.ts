import { db, sqlite } from '../db/index.js';
import { visitors } from '../db/schema.js';
import { sql } from 'drizzle-orm';
import { safeParseJSON } from './helpers.js';

export function checkBrowserAuthenticity(v: Record<string, any>): string {
  let mismatches = 0;
  const browser = (v.browser || '').toLowerCase();
  const vendor = (v.vendor || '').toLowerCase();

  if (browser.includes('chrome') && !vendor.includes('google')) mismatches++;
  if (browser.includes('firefox') && vendor !== '') mismatches++;
  if (browser === 'safari' && !vendor.includes('apple')) mismatches++;

  const apiSupport = safeParseJSON(v.apiSupport);
  if (browser.includes('chrome') && apiSupport) {
    // Chrome should support these — heuristic check
  }

  if (v.webdriverDetected && browser !== 'unknown') mismatches++;

  if (mismatches >= 2) return 'spoofed';
  if (mismatches === 1) return 'likely_spoofed';
  return 'genuine';
}

export function computeUniquenessScore(v: Record<string, any>): number {
  const fields: [string, string, number][] = [
    ['canvasHash', 'canvas_hash', 15],
    ['audioHash', 'audio_hash', 15],
    ['mathFingerprint', 'math_fingerprint', 10],
    ['webgl2Fingerprint', 'webgl2_fingerprint', 10],
    ['domRectFingerprint', 'dom_rect_fingerprint', 10],
    ['errorMessageFingerprint', 'error_message_fingerprint', 8],
    ['cssSystemColorFingerprint', 'css_system_color_fingerprint', 8],
    ['textMetricsFingerprint', 'text_metrics_fingerprint', 8],
    ['emojiSupportFingerprint', 'emoji_support_fingerprint', 8],
    ['svgFilterFingerprint', 'svg_filter_fingerprint', 8],
  ];

  // Filter to only fields that have values
  const activeFields = fields.filter(([key]) => v[key]);
  if (activeFields.length === 0) return 50;

  const result = db.select({
    total: sql<number>`count(*)`,
  }).from(visitors).get();

  const totalVisitors = result?.total || 1;

  // Single query with CASE WHEN to count matches for all fields at once
  const countQuery = `SELECT ${activeFields.map(([_key, col]) =>
    `SUM(CASE WHEN "${col}" = ? THEN 1 ELSE 0 END) AS "${col}_count"`
  ).join(', ')} FROM visitors`;

  const params = activeFields.map(([key]) => v[key]);

  try {
    const row = sqlite.prepare(countQuery).get(...params) as Record<string, number>;

    let totalWeight = 0;
    let weightedScore = 0;

    for (const [key, col, weight] of activeFields) {
      totalWeight += weight;
      const matchCount = row[`${col}_count`] || 0;
      const sharePercent = (matchCount / totalVisitors) * 100;

      if (sharePercent < 1) weightedScore += weight * 100;
      else if (sharePercent < 5) weightedScore += weight * 80;
      else if (sharePercent < 10) weightedScore += weight * 50;
      else weightedScore += weight * 20;
    }

    return Math.round(weightedScore / totalWeight);
  } catch {
    // Fallback: assume moderate uniqueness
    return 50;
  }
}
