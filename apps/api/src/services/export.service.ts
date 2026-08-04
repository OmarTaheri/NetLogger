import { db } from '../database/index.js';
import { visitors, links } from '../database/schema.js';
import { and, eq, desc } from 'drizzle-orm';

export async function getVisitorsForExport(userId: number, linkId?: number) {
  let query = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .innerJoin(links, eq(visitors.linkId, links.id))
    .orderBy(desc(visitors.createdAt));

  query = query.where(linkId
    ? and(eq(links.userId, userId), eq(visitors.linkId, linkId))
    : eq(links.userId, userId)) as any;

  const results = await query;
  return results.map(r => ({
    ...r.visitor,
    linkSlug: r.linkSlug,
    linkTitle: r.linkTitle,
  }));
}

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => headers.map(h => escapeCsvField(row[h])).join(',')),
  ];
  return csvLines.join('\n');
}
