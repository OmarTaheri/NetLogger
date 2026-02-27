import { db } from '../db/index.js';
import { visitors, links } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export function getVisitorsForExport(linkId?: number) {
  let query = db.select({
    visitor: visitors,
    linkSlug: links.slug,
    linkTitle: links.title,
  })
    .from(visitors)
    .leftJoin(links, eq(visitors.linkId, links.id))
    .orderBy(desc(visitors.createdAt));

  if (linkId) {
    query = query.where(eq(visitors.linkId, linkId)) as any;
  }

  const results = query.all();
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
