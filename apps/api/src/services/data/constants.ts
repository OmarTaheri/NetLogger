export const VPN_ISP_KEYWORDS = [
  'vpn', 'proxy', 'datacenter', 'data center', 'hosting', 'cloud', 'server',
  'digitalocean', 'amazon', 'aws', 'google cloud', 'azure', 'linode', 'vultr',
  'ovh', 'hetzner', 'choopa', 'leaseweb', 'contabo', 'scaleway', 'oracle cloud',
  'alibaba', 'tencent', 'rackspace', 'softlayer', 'colocation', 'colo',
  'nordvpn', 'expressvpn', 'surfshark', 'mullvad', 'protonvpn', 'cyberghost',
  'private internet access', 'pia', 'torguard', 'windscribe', 'ipvanish',
  'tor exit', 'tor relay', 'm247', 'datacamp', 'quadranet',
];

// Subset of VPN_ISP_KEYWORDS specifically indicating datacenter IPs
export const DATACENTER_ISP_KEYWORDS = [
  'datacenter', 'data center', 'hosting', 'cloud', 'digitalocean', 'amazon',
  'aws', 'azure', 'google cloud', 'linode', 'vultr', 'ovh', 'hetzner',
];

export const COUNTRY_TIMEZONE_MAP: Record<string, number[]> = {
  US: [-10, -9, -8, -7, -6, -5, -4],
  CA: [-8, -7, -6, -5, -4, -3],
  GB: [0], UK: [0],
  DE: [1, 2], FR: [1, 2], ES: [1, 2], IT: [1, 2], NL: [1, 2], BE: [1, 2],
  AT: [1, 2], CH: [1, 2], PL: [1, 2], CZ: [1, 2], SE: [1, 2], NO: [1, 2],
  DK: [1, 2], FI: [2, 3], PT: [0, 1],
  RU: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  JP: [9], KR: [9],
  CN: [8], HK: [8], TW: [8], SG: [8], MY: [8], PH: [8],
  IN: [5], // UTC+5:30 rounds to 5 or 6
  AU: [8, 9, 10, 11],
  NZ: [12, 13],
  BR: [-5, -4, -3, -2],
  MX: [-8, -7, -6, -5],
  AR: [-3],
  CL: [-4, -3],
  CO: [-5],
  ZA: [2],
  EG: [2, 3],
  NG: [1],
  KE: [3],
  AE: [4],
  SA: [3],
  IL: [2, 3],
  TR: [3],
  TH: [7],
  VN: [7],
  ID: [7, 8, 9],
  PK: [5],
  BD: [6],
  UA: [2, 3],
  RO: [2, 3],
  GR: [2, 3],
  IE: [0, 1],
  IS: [0],
};
