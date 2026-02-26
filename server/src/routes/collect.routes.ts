import { Router } from 'express';
import * as linkService from '../services/link.service.js';
import * as visitorService from '../services/visitor.service.js';
import { lookupIp } from '../services/geoip.service.js';
import { analyzeVisitor } from '../services/analysis.service.js';
import { wsManager } from '../ws/index.js';

const router = Router();

router.post('/:slug', async (req, res) => {
  const { slug } = req.params;
  const link = linkService.getLinkBySlug(slug);

  if (!link || !link.isActive) {
    res.status(404).json({ ok: false });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.headers['cf-connecting-ip'] as string
    || req.socket.remoteAddress
    || '';
  const userAgent = req.headers['user-agent'] || '';

  const body = req.body || {};

  // Lookup IP geolocation
  const geoip = await lookupIp(ip);

  const visitor = visitorService.createVisitor({
    linkId: link.id,
    ip,
    userAgent,
    browser: body.browser || null,
    browserVersion: body.browserVersion || null,
    os: body.os || null,
    platform: body.platform || null,
    cpuCores: body.cpuCores || null,
    ram: body.ram || null,
    screenWidth: body.screenWidth || null,
    screenHeight: body.screenHeight || null,
    colorDepth: body.colorDepth || null,
    gpuVendor: body.gpuVendor || null,
    gpuRenderer: body.gpuRenderer || null,
    canvasHash: body.canvasHash || null,
    touchSupport: body.touchSupport ?? null,
    language: body.language || null,
    timezone: body.timezone || null,
    cookiesEnabled: body.cookiesEnabled ?? null,
    doNotTrack: body.doNotTrack ?? null,
    // New fields
    audioHash: body.audioHash || null,
    webglMaxTextureSize: body.webglMaxTextureSize ?? null,
    webglMaxViewportWidth: body.webglMaxViewportWidth ?? null,
    webglMaxViewportHeight: body.webglMaxViewportHeight ?? null,
    webglExtensions: body.webglExtensions || null,
    webglShaderPrecision: body.webglShaderPrecision || null,
    connectionType: body.connectionType || null,
    downlinkSpeed: body.downlinkSpeed ?? null,
    networkRtt: body.networkRtt ?? null,
    saveData: body.saveData ?? null,
    cameraCount: body.cameraCount ?? null,
    microphoneCount: body.microphoneCount ?? null,
    speakerCount: body.speakerCount ?? null,
    screenAvailWidth: body.screenAvailWidth ?? null,
    screenAvailHeight: body.screenAvailHeight ?? null,
    pixelDepth: body.pixelDepth ?? null,
    devicePixelRatio: body.devicePixelRatio ?? null,
    screenOrientation: body.screenOrientation || null,
    vendor: body.vendor || null,
    isOnline: body.isOnline ?? null,
    pdfViewerEnabled: body.pdfViewerEnabled ?? null,
    webdriverDetected: body.webdriverDetected ?? null,
    storageQuota: body.storageQuota ?? null,
    storageUsage: body.storageUsage ?? null,
    installedLanguages: body.installedLanguages || null,
    permGeolocation: body.permGeolocation || null,
    permCamera: body.permCamera || null,
    permMicrophone: body.permMicrophone || null,
    permNotifications: body.permNotifications || null,
    referrer: body.referrer || null,
    pageLoadTime: body.pageLoadTime ?? null,
    adBlockerDetected: body.adBlockerDetected ?? null,
    incognitoDetected: body.incognitoDetected ?? null,
    // Deep fingerprinting
    localIPs: body.localIPs || null,
    speechVoicesHash: body.speechVoicesHash || null,
    detectedFonts: body.detectedFonts || null,
    // CSS Media Queries
    prefersColorScheme: body.prefersColorScheme || null,
    prefersReducedMotion: body.prefersReducedMotion ?? null,
    hdrSupport: body.hdrSupport ?? null,
    forcedColors: body.forcedColors ?? null,
    pointerType: body.pointerType || null,
    colorGamut: body.colorGamut || null,
    // Client Hints
    clientArch: body.clientArch || null,
    clientBitness: body.clientBitness || null,
    clientPlatformVersion: body.clientPlatformVersion || null,
    clientModel: body.clientModel || null,
    // Battery
    batteryLevel: body.batteryLevel ?? null,
    batteryCharging: body.batteryCharging ?? null,
    // Intl & Memory
    intlLocaleFingerprint: body.intlLocaleFingerprint || null,
    jsHeapSizeLimit: body.jsHeapSizeLimit ?? null,
    // Extended screen & touch
    multiMonitor: body.multiMonitor ?? null,
    maxTouchPoints: body.maxTouchPoints ?? null,
    // Plugins & APIs
    installedPlugins: body.installedPlugins || null,
    apiSupport: body.apiSupport || null,
    // Extended timezone
    timezoneOffset: body.timezoneOffset ?? null,
    observesDst: body.observesDst ?? null,
    // Navigation & input
    navigationType: body.navigationType || null,
    keyboardLayout: body.keyboardLayout || null,
    // Advanced fingerprints
    mathFingerprint: body.mathFingerprint || null,
    domRectFingerprint: body.domRectFingerprint || null,
    mediaCodecFingerprint: body.mediaCodecFingerprint || null,
    audioContextProps: body.audioContextProps || null,
    cssSystemColorFingerprint: body.cssSystemColorFingerprint || null,
    webgl2Fingerprint: body.webgl2Fingerprint || null,
    svgFilterFingerprint: body.svgFilterFingerprint || null,
    errorMessageFingerprint: body.errorMessageFingerprint || null,
    wasmCapabilities: body.wasmCapabilities || null,
    scrollbarWidth: body.scrollbarWidth ?? null,
    timerResolution: body.timerResolution || null,
    textMetricsFingerprint: body.textMetricsFingerprint || null,
    dateToStringFingerprint: body.dateToStringFingerprint || null,
    emojiSupportFingerprint: body.emojiSupportFingerprint || null,
    perfEntryTypes: body.perfEntryTypes || null,
    securityContext: body.securityContext || null,
    cssSupportFingerprint: body.cssSupportFingerprint || null,
    lineBreakFingerprint: body.lineBreakFingerprint || null,
    // Behavioral biometrics
    mouseData: body.mouseData || null,
    clickData: body.clickData || null,
    scrollData: body.scrollData || null,
    touchData: body.touchData || null,
    motionData: body.motionData || null,
    dwellTime: body.dwellTime ?? null,
    focusData: body.focusData || null,
    // GPS
    gpsGranted: body.gpsGranted || false,
    latitude: body.latitude || null,
    longitude: body.longitude || null,
    accuracy: body.accuracy || null,
    altitude: body.altitude || null,
    altitudeAccuracy: body.altitudeAccuracy || null,
    speed: body.speed || null,
    heading: body.heading || null,
    ...geoip,
  });

  // Run server-side analysis
  const analysis = analyzeVisitor(visitor);
  visitorService.updateVisitor(visitor.id, analysis);
  Object.assign(visitor, analysis);

  linkService.incrementVisitCount(link.id);

  // Broadcast to dashboard
  wsManager.broadcast({
    type: 'new_visitor',
    data: { ...visitor, linkSlug: link.slug, linkTitle: link.title },
  });

  res.json({ ok: true });
});

export default router;
