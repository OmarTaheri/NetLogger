import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const domains = sqliteTable('domains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domain: text('domain').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const links = sqliteTable('links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  targetUrl: text('target_url').notNull(),
  templateId: text('template_id').notNull(),
  title: text('title'),
  templateOptions: text('template_options'),
  gpsMode: text('gps_mode').notNull().default('optional'),
  domainId: integer('domain_id').references(() => domains.id, { onDelete: 'set null' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  visitCount: integer('visit_count').default(0).notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const visitors = sqliteTable('visitors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  linkId: integer('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  ip: text('ip'),
  userAgent: text('user_agent'),
  browser: text('browser'),
  browserVersion: text('browser_version'),
  os: text('os'),
  platform: text('platform'),
  cpuCores: integer('cpu_cores'),
  ram: integer('ram'),
  screenWidth: integer('screen_width'),
  screenHeight: integer('screen_height'),
  colorDepth: integer('color_depth'),
  gpuVendor: text('gpu_vendor'),
  gpuRenderer: text('gpu_renderer'),
  canvasHash: text('canvas_hash'),
  touchSupport: integer('touch_support', { mode: 'boolean' }),
  language: text('language'),
  timezone: text('timezone'),
  cookiesEnabled: integer('cookies_enabled', { mode: 'boolean' }),
  doNotTrack: integer('do_not_track', { mode: 'boolean' }),
  // New fingerprint fields
  audioHash: text('audio_hash'),
  webglMaxTextureSize: integer('webgl_max_texture_size'),
  webglMaxViewportWidth: integer('webgl_max_viewport_width'),
  webglMaxViewportHeight: integer('webgl_max_viewport_height'),
  webglExtensions: text('webgl_extensions'),
  webglShaderPrecision: text('webgl_shader_precision'),
  // Network
  connectionType: text('connection_type'),
  downlinkSpeed: real('downlink_speed'),
  networkRtt: integer('network_rtt'),
  saveData: integer('save_data', { mode: 'boolean' }),
  // Media devices
  cameraCount: integer('camera_count'),
  microphoneCount: integer('microphone_count'),
  speakerCount: integer('speaker_count'),
  // Screen extended
  screenAvailWidth: integer('screen_avail_width'),
  screenAvailHeight: integer('screen_avail_height'),
  pixelDepth: integer('pixel_depth'),
  devicePixelRatio: real('device_pixel_ratio'),
  screenOrientation: text('screen_orientation'),
  // Navigator extended
  vendor: text('vendor'),
  isOnline: integer('is_online', { mode: 'boolean' }),
  pdfViewerEnabled: integer('pdf_viewer_enabled', { mode: 'boolean' }),
  webdriverDetected: integer('webdriver_detected', { mode: 'boolean' }),
  // Storage
  storageQuota: real('storage_quota'),
  storageUsage: real('storage_usage'),
  installedLanguages: text('installed_languages'),
  // Permissions
  permGeolocation: text('perm_geolocation'),
  permCamera: text('perm_camera'),
  permMicrophone: text('perm_microphone'),
  permNotifications: text('perm_notifications'),
  // Other
  referrer: text('referrer'),
  pageLoadTime: integer('page_load_time'),
  adBlockerDetected: integer('ad_blocker_detected', { mode: 'boolean' }),
  incognitoDetected: integer('incognito_detected', { mode: 'boolean' }),
  // Deep fingerprinting
  localIPs: text('local_ips'),
  speechVoicesHash: text('speech_voices_hash'),
  detectedFonts: text('detected_fonts'),
  // CSS Media Queries
  prefersColorScheme: text('prefers_color_scheme'),
  prefersReducedMotion: integer('prefers_reduced_motion', { mode: 'boolean' }),
  hdrSupport: integer('hdr_support', { mode: 'boolean' }),
  forcedColors: integer('forced_colors', { mode: 'boolean' }),
  pointerType: text('pointer_type'),
  colorGamut: text('color_gamut'),
  // Client Hints
  clientArch: text('client_arch'),
  clientBitness: text('client_bitness'),
  clientPlatformVersion: text('client_platform_version'),
  clientModel: text('client_model'),
  // Battery
  batteryLevel: real('battery_level'),
  batteryCharging: integer('battery_charging', { mode: 'boolean' }),
  // Intl & Memory
  intlLocaleFingerprint: text('intl_locale_fingerprint'),
  jsHeapSizeLimit: real('js_heap_size_limit'),
  // Extended screen & touch
  multiMonitor: integer('multi_monitor', { mode: 'boolean' }),
  maxTouchPoints: integer('max_touch_points'),
  // Plugins & APIs
  installedPlugins: text('installed_plugins'),
  apiSupport: text('api_support'),
  // Extended timezone
  timezoneOffset: integer('timezone_offset'),
  observesDst: integer('observes_dst', { mode: 'boolean' }),
  // Navigation & input
  navigationType: text('navigation_type'),
  keyboardLayout: text('keyboard_layout'),
  // Advanced fingerprints
  mathFingerprint: text('math_fingerprint'),
  domRectFingerprint: text('dom_rect_fingerprint'),
  mediaCodecFingerprint: text('media_codec_fingerprint'),
  audioContextProps: text('audio_context_props'),
  cssSystemColorFingerprint: text('css_system_color_fingerprint'),
  webgl2Fingerprint: text('webgl2_fingerprint'),
  svgFilterFingerprint: text('svg_filter_fingerprint'),
  errorMessageFingerprint: text('error_message_fingerprint'),
  wasmCapabilities: text('wasm_capabilities'),
  scrollbarWidth: integer('scrollbar_width'),
  timerResolution: text('timer_resolution'),
  textMetricsFingerprint: text('text_metrics_fingerprint'),
  dateToStringFingerprint: text('date_to_string_fingerprint'),
  emojiSupportFingerprint: text('emoji_support_fingerprint'),
  perfEntryTypes: text('perf_entry_types'),
  securityContext: text('security_context'),
  cssSupportFingerprint: text('css_support_fingerprint'),
  lineBreakFingerprint: text('line_break_fingerprint'),
  // Behavioral biometrics
  mouseData: text('mouse_data'),
  clickData: text('click_data'),
  scrollData: text('scroll_data'),
  touchData: text('touch_data'),
  motionData: text('motion_data'),
  dwellTime: integer('dwell_time'),
  focusData: text('focus_data'),
  // Server-side analysis
  botScore: integer('bot_score'),
  vpnDetected: integer('vpn_detected', { mode: 'boolean' }),
  privacyScore: integer('privacy_score'),
  deviceTier: text('device_tier'),
  browserAuthenticity: text('browser_authenticity'),
  uniquenessScore: integer('uniqueness_score'),
  locationConsistency: text('location_consistency'),
  humanScore: integer('human_score'),
  userProfile: text('user_profile'),
  riskFlags: text('risk_flags'),
  // GPS
  gpsGranted: integer('gps_granted', { mode: 'boolean' }).default(false).notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  accuracy: real('accuracy'),
  altitude: real('altitude'),
  altitudeAccuracy: real('altitude_accuracy'),
  speed: real('speed'),
  heading: real('heading'),
  // IP geolocation
  ipCity: text('ip_city'),
  ipRegion: text('ip_region'),
  ipCountry: text('ip_country'),
  ipCountryCode: text('ip_country_code'),
  ipLat: real('ip_lat'),
  ipLon: real('ip_lon'),
  ipIsp: text('ip_isp'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
}, (table) => [
  index('visitors_link_id_idx').on(table.linkId),
  index('visitors_created_at_idx').on(table.createdAt),
]);
