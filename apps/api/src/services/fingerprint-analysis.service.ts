import { db } from '../database/index.js';
import { visitors, links } from '../database/schema.js';
import { eq, sql } from 'drizzle-orm';
import { safeParseJSON } from './helpers.js';

export function checkBrowserAuthenticity(v: Record<string, any>): string {
  let mismatches = 0;
  const browser = (v.browser || '').toLowerCase();
  const vendor = (v.vendor || '').toLowerCase();

  if (browser.includes('chrome') && !vendor.includes('google')) mismatches++;
  if (browser.includes('firefox') && vendor !== '') mismatches++;
  if (browser === 'safari' && !vendor.includes('apple')) mismatches++;
  if (browser.includes('chrome') && safeParseJSON(v.apiSupport)) { /* heuristic hook */ }
  if (v.webdriverDetected && browser !== 'unknown') mismatches++;

  if (mismatches >= 2) return 'spoofed';
  if (mismatches === 1) return 'likely_spoofed';
  return 'genuine';
}

export async function computeUniquenessScore(v: Record<string, any>, userId: number): Promise<number> {
  const fields: [string, string, number][] = [
    ['canvasHash', 'canvas_hash', 15], ['audioHash', 'audio_hash', 15], ['mathFingerprint', 'math_fingerprint', 10],
    ['webgl2Fingerprint', 'webgl2_fingerprint', 10], ['domRectFingerprint', 'dom_rect_fingerprint', 10],
    ['errorMessageFingerprint', 'error_message_fingerprint', 8], ['cssSystemColorFingerprint', 'css_system_color_fingerprint', 8],
    ['textMetricsFingerprint', 'text_metrics_fingerprint', 8], ['emojiSupportFingerprint', 'emoji_support_fingerprint', 8], ['svgFilterFingerprint', 'svg_filter_fingerprint', 8],
  ];
  const activeFields = fields.filter(([key]) => v[key]);
  if (!activeFields.length) return 50;

  const totalResult = await db.select({ total: sql<number>`count(*)::int` }).from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id)).where(eq(links.userId, userId));
  const totalVisitors = totalResult[0]?.total || 1;

  try {
    const selections = activeFields.map(([key, column]) => sql`
      SUM(CASE WHEN visitors.${sql.identifier(column)} = ${v[key]} THEN 1 ELSE 0 END)::int AS ${sql.identifier(`${column}_count`)}
    `);
    const result = await db.execute(sql`
      SELECT ${sql.join(selections, sql`, `)}
      FROM visitors INNER JOIN links ON visitors.link_id = links.id
      WHERE links.user_id = ${userId}
    `);
    const row = result.rows[0] as Record<string, number> | undefined;
    if (!row) return 50;

    let totalWeight = 0;
    let weightedScore = 0;
    for (const [_key, column, weight] of activeFields) {
      totalWeight += weight;
      const sharePercent = ((row[`${column}_count`] || 0) / totalVisitors) * 100;
      weightedScore += weight * (sharePercent < 1 ? 100 : sharePercent < 5 ? 80 : sharePercent < 10 ? 50 : 20);
    }
    return Math.round(weightedScore / totalWeight);
  } catch {
    return 50;
  }
}
