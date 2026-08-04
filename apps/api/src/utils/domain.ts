export function sanitizeDomain(input: string): string {
  const raw = input.trim();
  if (!raw) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (
      !['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash
      || !url.hostname
    ) return '';

    return `${url.hostname.toLowerCase()}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return '';
  }
}
