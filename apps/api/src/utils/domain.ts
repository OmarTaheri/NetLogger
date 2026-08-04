export function sanitizeDomain(input: string): string {
  let clean = input.trim();
  clean = clean.replace(/^https?:\/\//, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}
