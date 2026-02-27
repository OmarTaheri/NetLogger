// --- GPS Handler ---
// Shared GPS result object construction, overlay UI, and retry logic.

function buildGpsResult(pos) {
  return {
    gpsGranted: true,
    instantDenial: false,
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    altitudeAccuracy: pos.coords.altitudeAccuracy,
    speed: pos.coords.speed,
    heading: pos.coords.heading,
  };
}

var GPS_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

export function requestGPS() {
  return new Promise(function(resolve) {
    if (!navigator.geolocation) {
      resolve({ gpsGranted: false, instantDenial: false });
      return;
    }
    var startTime = Date.now();
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        resolve(buildGpsResult(pos));
      },
      function() {
        var elapsed = Date.now() - startTime;
        resolve({ gpsGranted: false, instantDenial: elapsed < 200 });
      },
      GPS_OPTIONS
    );
  });
}

// Non-Promise wrapper — keeps getCurrentPosition() in the synchronous call
// chain from a user gesture so iOS Safari doesn't silently block the prompt.
export function requestGPSDirect(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError({ gpsGranted: false, instantDenial: false });
    return;
  }
  var startTime = Date.now();
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      onSuccess(buildGpsResult(pos));
    },
    function() {
      var elapsed = Date.now() - startTime;
      onError({ gpsGranted: false, instantDenial: elapsed < 200 });
    },
    GPS_OPTIONS
  );
}

export function checkGeoPermission() {
  return new Promise(function(resolve) {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
        resolve(result.state); // 'granted' | 'denied' | 'prompt'
      }).catch(function() {
        resolve('unknown');
      });
    } else {
      resolve('unknown');
    }
  });
}

function getBrowserName() {
  if (typeof UAParser !== 'undefined') {
    try {
      var parser = new UAParser();
      var name = parser.getBrowser().name || '';
      if (/Chrome/i.test(name) && !/Edge/i.test(name)) return 'chrome';
      if (/Edge/i.test(name)) return 'edge';
      if (/Firefox/i.test(name)) return 'firefox';
      if (/Safari/i.test(name)) return 'safari';
    } catch(e) {}
  }
  var ua = navigator.userAgent || '';
  if (/Edg\//i.test(ua)) return 'edge';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'chrome';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari';
  return 'generic';
}

function isIOS() {
  var ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getLocationResetInstructions() {
  var browser = getBrowserName();
  switch (browser) {
    case 'chrome':
    case 'edge':
      return 'Tap the lock or tune icon in the address bar \u2192 Site settings \u2192 Location \u2192 Allow, then refresh this page.';
    case 'firefox':
      return 'Tap the lock icon in the address bar \u2192 Clear permission for Location, then refresh this page.';
    case 'safari':
      if (isIOS()) {
        return 'Open Settings \u2192 Privacy & Security \u2192 Location Services. Make sure Location Services is ON and Safari Websites is set to "While Using" or "Ask". Then return here and refresh the page.';
      }
      return 'Go to Safari \u2192 Settings \u2192 Websites \u2192 Location \u2192 set to Allow, then refresh this page.';
    default:
      return 'Check your browser settings to allow location access for this site, then refresh this page.';
  }
}

export function sendData(config, payload) {
  return fetch(config.collectUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(function() {});
}

// Shared overlay builder — used by both redirect and gdrive GPS-required flows.
// onRetry(resultCallback) is called with a callback that receives the GPS result.
export function buildGpsOverlay(isDenied, onRetry, onSkip) {
  // Remove existing overlay if any
  var existing = document.getElementById('__gps_required_overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = '__gps_required_overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;';

  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:12px;padding:32px;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);';

  var icon = document.createElement('div');
  icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  icon.style.marginBottom = '16px';

  var title = document.createElement('h3');
  title.style.cssText = 'margin:0 0 8px;font-size:18px;font-weight:600;color:#111;';

  var msg = document.createElement('p');
  msg.style.cssText = 'margin:0 0 24px;font-size:14px;color:#666;line-height:1.5;';

  var btn = document.createElement('button');
  btn.style.cssText = 'background:#3b82f6;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;';
  btn.onmouseover = function() { if (!btn.disabled) btn.style.background = '#2563eb'; };
  btn.onmouseout = function() { if (!btn.disabled) btn.style.background = '#3b82f6'; };

  var instructionsEl = null;

  box.appendChild(icon);
  box.appendChild(title);
  box.appendChild(msg);

  function showDeniedState() {
    title.textContent = 'Location Permission Blocked';
    msg.textContent = 'Location access was previously denied. To continue, please update your browser settings:';

    if (!instructionsEl) {
      instructionsEl = document.createElement('p');
      instructionsEl.style.cssText = 'margin:0 0 24px;font-size:13px;color:#444;line-height:1.6;background:#f8f9fa;padding:12px 16px;border-radius:8px;text-align:left;';
      box.insertBefore(instructionsEl, btn);
    }
    instructionsEl.textContent = getLocationResetInstructions();

    btn.textContent = 'Refresh Page';
    btn.disabled = false;
    btn.style.background = '#3b82f6';
    btn.style.cursor = 'pointer';
    btn.onclick = function() { location.reload(); };
  }

  function showRetryState() {
    title.textContent = 'Location Access Required';
    msg.textContent = 'This page requires location access to continue. Please allow location permission when prompted.';

    if (instructionsEl) {
      instructionsEl.remove();
      instructionsEl = null;
    }

    btn.textContent = 'Grant Location Access';
    btn.disabled = false;
    btn.style.background = '#3b82f6';
    btn.style.cursor = 'pointer';
    btn.onclick = handleRetryClick;
  }

  function showLoadingState() {
    btn.disabled = true;
    btn.textContent = 'Requesting\u2026';
    btn.style.background = '#93c5fd';
    btn.style.cursor = 'wait';
  }

  function handleRetryClick() {
    showLoadingState();
    onRetry(function(gpsResult) {
      if (gpsResult.gpsGranted) {
        overlay.remove();
      }
      // If not granted, the caller handles transitioning overlay state
      // via a new buildGpsOverlay call or showDeniedState/showRetryState
    });
  }

  if (isDenied) {
    showDeniedState();
  } else {
    showRetryState();
  }

  box.appendChild(btn);

  var skipLink = null;
  if (onSkip) {
    skipLink = document.createElement('a');
    skipLink.textContent = 'Continue without location';
    skipLink.href = '#';
    skipLink.style.cssText = 'display:block;margin-top:16px;font-size:13px;color:#888;text-decoration:underline;cursor:pointer;';
    skipLink.onclick = function(e) {
      e.preventDefault();
      overlay.remove();
      onSkip();
    };
    box.appendChild(skipLink);
  }

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Return controls so callers can update the overlay in-place
  return { overlay: overlay, showDeniedState: showDeniedState, showRetryState: showRetryState };
}

export function handleGpsRequired(config, retryCount, deviceInfo) {
  function finishWithoutGps() {
    var existing = document.getElementById('__gps_required_overlay');
    if (existing) existing.remove();
    var payload = Object.assign({}, deviceInfo, { gpsGranted: false });
    sendData(config, payload).then(function() {
      if (config.templateId === 'redirect') {
        window.location.href = config.targetUrl;
      }
    });
  }

  function finishWithGps(gpsInfo) {
    var payload = Object.assign({}, deviceInfo, gpsInfo);
    sendData(config, payload).then(function() {
      if (config.templateId === 'redirect') {
        window.location.href = config.targetUrl;
      }
    });
  }

  // Show overlay and handle retries via button clicks.
  // count = number of real user-initiated denials so far.
  function showOverlayWithRetry(isDenied, count) {
    buildGpsOverlay(isDenied, function(resultCallback) {
      requestGPSDirect(
        function(result) {
          resultCallback(result);
          handleRetryResult(result, count);
        },
        function(result) {
          resultCallback(result);
          handleRetryResult(result, count);
        }
      );
    });
  }

  function handleRetryResult(result, count) {
    if (result.gpsGranted) {
      finishWithGps(result);
      return;
    }

    // Instant denial = OS-level block, don't count as a user-initiated retry
    var nextCount = result.instantDenial ? count : count + 1;

    if (nextCount >= 3) {
      finishWithoutGps();
      return;
    }

    checkGeoPermission().then(function(perm) {
      var denied = perm === 'denied' || (perm === 'unknown' && result.instantDenial);
      showOverlayWithRetry(denied, nextCount);
    });
  }

  if (retryCount >= 3) {
    finishWithoutGps();
    return;
  }

  // Initial GPS attempt (page load / first entry)
  requestGPS().then(function(gpsInfo) {
    if (gpsInfo.gpsGranted) {
      finishWithGps(gpsInfo);
      return;
    }

    // Don't count instant denial as a retry
    var nextCount = gpsInfo.instantDenial ? retryCount : retryCount + 1;

    if (nextCount >= 3) {
      finishWithoutGps();
      return;
    }

    checkGeoPermission().then(function(permState) {
      var isDenied = permState === 'denied' || (permState === 'unknown' && gpsInfo.instantDenial);
      showOverlayWithRetry(isDenied, nextCount);
    });
  });
}
