import { resolve4, resolve6, resolveCname, resolveTxt } from 'node:dns/promises';
import { config } from '../config.js';
import { sanitizeDomain } from '../utils/domain.js';

function normalizedHost(value: string) {
  return value.toLowerCase().replace(/\.$/, '');
}

function isLocalHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost') || host.endsWith('.local');
}

export function getDomainVerificationTarget() {
  const configured = config.domainCnameTarget || config.baseUrl;
  const target = sanitizeDomain(configured).split(':')[0];
  return target && !isLocalHost(target) ? target : null;
}

export function getDomainVerificationInstructions(domain: string, token: string) {
  const target = getDomainVerificationTarget();
  return {
    recordName: `_netlogger-verification.${domain}`,
    recordValue: `netlogger-verification=${token}`,
    cnameTarget: target,
  };
}

export async function verifyDomainDns(domain: string, token: string) {
  const instructions = getDomainVerificationInstructions(domain, token);
  if (!instructions.cnameTarget) {
    return { verified: false, status: 'failed' as const, error: 'The server has no public domain target. Set BASE_URL or DOMAIN_CNAME_TARGET before verifying custom domains.' };
  }

  const txtRecords = await resolveTxt(instructions.recordName).catch(() => [] as string[][]);
  const expectedTxt = instructions.recordValue.toLowerCase();
  const hasTxtProof = txtRecords
    .map((parts) => parts.join('').toLowerCase())
    .some((value) => value === expectedTxt);
  if (!hasTxtProof) {
    return { verified: false, status: 'pending' as const, error: `DNS TXT proof not found. Add ${instructions.recordName} with the value shown below, then allow time for DNS propagation.` };
  }

  const target = normalizedHost(instructions.cnameTarget);
  const cnameRecords = (await resolveCname(domain).catch(() => [] as string[])).map(normalizedHost);
  const cnameMatches = cnameRecords.includes(target);

  const [domainV4, targetV4, domainV6, targetV6] = await Promise.all([
    resolve4(domain).catch(() => [] as string[]),
    resolve4(target).catch(() => [] as string[]),
    resolve6(domain).catch(() => [] as string[]),
    resolve6(target).catch(() => [] as string[]),
  ]);
  const ipMatches = domainV4.some((address) => targetV4.includes(address)) || domainV6.some((address) => targetV6.includes(address));

  if (!cnameMatches && !ipMatches) {
    return { verified: false, status: 'failed' as const, error: `DNS routing is not ready. Point ${domain} to ${target} with a CNAME, or use matching A/AAAA records.` };
  }

  return { verified: true, status: 'verified' as const, error: null };
}
