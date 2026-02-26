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
    templateId: 'redirect' | 'gdrive';
    title: string | null;
    templateOptions: string | null;
    gpsMode: 'required' | 'optional' | 'disabled';
    domainId: number | null;
    isActive: boolean;
    visitCount: number;
    createdAt: string;
}
export interface CreateLinkInput {
    targetUrl: string;
    templateId: 'redirect' | 'gdrive';
    title?: string;
    templateOptions?: RedirectTemplateOptions | GdriveTemplateOptions;
    gpsMode?: 'required' | 'optional' | 'disabled';
    domainId?: number;
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
    audioHash: string | null;
    webglMaxTextureSize: number | null;
    webglMaxViewportWidth: number | null;
    webglMaxViewportHeight: number | null;
    webglExtensions: string | null;
    webglShaderPrecision: string | null;
    connectionType: string | null;
    downlinkSpeed: number | null;
    networkRtt: number | null;
    saveData: boolean | null;
    cameraCount: number | null;
    microphoneCount: number | null;
    speakerCount: number | null;
    screenAvailWidth: number | null;
    screenAvailHeight: number | null;
    pixelDepth: number | null;
    devicePixelRatio: number | null;
    screenOrientation: string | null;
    vendor: string | null;
    isOnline: boolean | null;
    pdfViewerEnabled: boolean | null;
    webdriverDetected: boolean | null;
    storageQuota: number | null;
    storageUsage: number | null;
    installedLanguages: string | null;
    permGeolocation: string | null;
    permCamera: string | null;
    permMicrophone: string | null;
    permNotifications: string | null;
    referrer: string | null;
    pageLoadTime: number | null;
    adBlockerDetected: boolean | null;
    incognitoDetected: boolean | null;
    localIPs: string | null;
    speechVoicesHash: string | null;
    detectedFonts: string | null;
    prefersColorScheme: string | null;
    prefersReducedMotion: boolean | null;
    hdrSupport: boolean | null;
    forcedColors: boolean | null;
    pointerType: string | null;
    colorGamut: string | null;
    clientArch: string | null;
    clientBitness: string | null;
    clientPlatformVersion: string | null;
    clientModel: string | null;
    batteryLevel: number | null;
    batteryCharging: boolean | null;
    intlLocaleFingerprint: string | null;
    jsHeapSizeLimit: number | null;
    multiMonitor: boolean | null;
    maxTouchPoints: number | null;
    installedPlugins: string | null;
    apiSupport: string | null;
    timezoneOffset: number | null;
    observesDst: boolean | null;
    navigationType: string | null;
    keyboardLayout: string | null;
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
    mouseData: string | null;
    clickData: string | null;
    scrollData: string | null;
    touchData: string | null;
    motionData: string | null;
    dwellTime: number | null;
    focusData: string | null;
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
    gpsGranted: boolean;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    speed: number | null;
    heading: number | null;
    ipCity: string | null;
    ipRegion: string | null;
    ipCountry: string | null;
    ipCountryCode: string | null;
    ipLat: number | null;
    ipLon: number | null;
    ipIsp: string | null;
    createdAt: string;
    linkSlug?: string;
    linkTitle?: string;
}
export interface Stats {
    totalLinks: number;
    totalVisitors: number;
    gpsGrantedCount: number;
    gpsGrantRate: number;
    visitorsToday: number;
    topBrowsers: {
        name: string;
        count: number;
    }[];
    topOS: {
        name: string;
        count: number;
    }[];
    visitorsPerDay: {
        date: string;
        count: number;
    }[];
}
export declare const VALID_TEMPLATE_IDS: readonly ['redirect', 'gdrive'];
export declare const VALID_GPS_MODES: readonly ['required', 'optional', 'disabled'];
export type TemplateId = typeof VALID_TEMPLATE_IDS[number];
export type GpsMode = typeof VALID_GPS_MODES[number];
export interface TemplateInfo {
    id: TemplateId;
    name: string;
    description: string;
}
export declare const TEMPLATES: TemplateInfo[];
export interface WsMessage {
    type: 'new_visitor';
    data: Visitor;
}
//# sourceMappingURL=types.d.ts.map