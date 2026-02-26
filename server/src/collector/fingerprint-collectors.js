// --- Utility ---

export function hashString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function parseUA(ua) {
  if (typeof UAParser !== 'undefined') {
    var parser = new UAParser(ua);
    var b = parser.getBrowser();
    var o = parser.getOS();
    return {
      browser: b.name || 'Unknown',
      browserVersion: b.version || '',
      os: o.name ? (o.name + (o.version ? ' ' + o.version : '')) : 'Unknown'
    };
  }
  var browser = 'Unknown', browserVersion = '', os = 'Unknown';
  if (/Edg\/(\d+[\.\d]*)/.test(ua)) { browser = 'Edge'; browserVersion = RegExp.$1; }
  else if (/OPR\/(\d+[\.\d]*)/.test(ua)) { browser = 'Opera'; browserVersion = RegExp.$1; }
  else if (/Chrome\/(\d+[\.\d]*)/.test(ua)) { browser = 'Chrome'; browserVersion = RegExp.$1; }
  else if (/Firefox\/(\d+[\.\d]*)/.test(ua)) { browser = 'Firefox'; browserVersion = RegExp.$1; }
  else if (/Safari\/(\d+[\.\d]*)/.test(ua) && /Version\/(\d+[\.\d]*)/.test(ua)) { browser = 'Safari'; browserVersion = RegExp.$1; }
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X (\d+[._]\d+)/.test(ua)) os = 'macOS ' + RegExp.$1.replace(/_/g, '.');
  else if (/Android (\d+[\.\d]*)/.test(ua)) os = 'Android ' + RegExp.$1;
  else if (/iPhone OS (\d+[_\d]*)/.test(ua)) os = 'iOS ' + RegExp.$1.replace(/_/g, '.');
  else if (/iPad/.test(ua)) os = 'iPadOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/CrOS/.test(ua)) os = 'Chrome OS';
  return { browser: browser, browserVersion: browserVersion, os: os };
}

// --- Async collectors ---

export function collectAudioFingerprint() {
  return new Promise(function(resolve) {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { resolve(null); return; }
      var ctx = new AudioCtx();
      var oscillator = ctx.createOscillator();
      var analyser = ctx.createAnalyser();
      var gain = ctx.createGain();
      var processor = ctx.createScriptProcessor(4096, 1, 1);
      gain.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      oscillator.connect(analyser);
      analyser.connect(processor);
      processor.connect(gain);
      gain.connect(ctx.destination);
      var audioData = [];
      processor.onaudioprocess = function(e) {
        var data = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(data);
        audioData.push.apply(audioData, Array.from(data.slice(0, 30)));
        oscillator.disconnect();
        processor.disconnect();
        gain.disconnect();
        ctx.close().catch(function(){});
        var str = audioData.map(function(v) { return v.toFixed(2); }).join(',');
        resolve(hashString(str));
      };
      oscillator.start(0);
      setTimeout(function() {
        try { oscillator.disconnect(); processor.disconnect(); gain.disconnect(); ctx.close().catch(function(){}); } catch(e) {}
        if (audioData.length === 0) resolve(null);
      }, 1000);
    } catch(e) {
      resolve(null);
    }
  });
}

export function collectMediaDevices() {
  return new Promise(function(resolve) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      resolve({ cameraCount: null, microphoneCount: null, speakerCount: null });
      return;
    }
    navigator.mediaDevices.enumerateDevices().then(function(devices) {
      var cameras = 0, mics = 0, speakers = 0;
      devices.forEach(function(d) {
        if (d.kind === 'videoinput') cameras++;
        else if (d.kind === 'audioinput') mics++;
        else if (d.kind === 'audiooutput') speakers++;
      });
      resolve({ cameraCount: cameras, microphoneCount: mics, speakerCount: speakers });
    }).catch(function() {
      resolve({ cameraCount: null, microphoneCount: null, speakerCount: null });
    });
  });
}

export function collectStorageEstimate() {
  return new Promise(function(resolve) {
    if (!navigator.storage || !navigator.storage.estimate) {
      resolve({ storageQuota: null, storageUsage: null });
      return;
    }
    navigator.storage.estimate().then(function(est) {
      resolve({
        storageQuota: est.quota || null,
        storageUsage: est.usage || null
      });
    }).catch(function() {
      resolve({ storageQuota: null, storageUsage: null });
    });
  });
}

export function collectPermissions() {
  return new Promise(function(resolve) {
    if (!navigator.permissions || !navigator.permissions.query) {
      resolve({ permGeolocation: null, permCamera: null, permMicrophone: null, permNotifications: null });
      return;
    }
    var names = ['geolocation', 'camera', 'microphone', 'notifications'];
    var results = { permGeolocation: null, permCamera: null, permMicrophone: null, permNotifications: null };
    var keys = ['permGeolocation', 'permCamera', 'permMicrophone', 'permNotifications'];
    var promises = names.map(function(name, i) {
      return navigator.permissions.query({ name: name }).then(function(s) {
        results[keys[i]] = s.state;
      }).catch(function() {});
    });
    Promise.all(promises).then(function() { resolve(results); });
  });
}

export function detectAdBlocker() {
  return new Promise(function(resolve) {
    try {
      var div = document.createElement('div');
      div.innerHTML = '&nbsp;';
      div.className = 'adsbox ad-banner ad-placement pub_300x250 pub_300x250m pub_728x90';
      div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
      document.body.appendChild(div);
      setTimeout(function() {
        var detected = div.offsetHeight === 0 || div.clientHeight === 0 ||
          window.getComputedStyle(div).display === 'none';
        document.body.removeChild(div);
        resolve(detected);
      }, 100);
    } catch(e) {
      resolve(null);
    }
  });
}

export function detectIncognito() {
  return new Promise(function(resolve) {
    if (!navigator.storage || !navigator.storage.estimate) {
      resolve(null);
      return;
    }
    navigator.storage.estimate().then(function(est) {
      var quota = est.quota || 0;
      resolve(quota > 0 && quota < 200 * 1024 * 1024);
    }).catch(function() {
      resolve(null);
    });
  });
}

export function collectWebRTCIPs() {
  return new Promise(function(resolve) {
    try {
      var RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      if (!RTC) { resolve(null); return; }
      var pc = new RTC({ iceServers: [] });
      var ips = {};
      pc.createDataChannel('');
      pc.createOffer().then(function(offer) {
        pc.setLocalDescription(offer);
      }).catch(function() { resolve(null); });
      pc.onicecandidate = function(e) {
        if (!e || !e.candidate || !e.candidate.candidate) return;
        var parts = e.candidate.candidate.split(' ');
        var ip = parts[4];
        if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
          ips[ip] = true;
        }
      };
      setTimeout(function() {
        try { pc.close(); } catch(ex) {}
        var found = Object.keys(ips);
        resolve(found.length > 0 ? found.join(',') : null);
      }, 2000);
    } catch(e) {
      resolve(null);
    }
  });
}

export function collectSpeechVoices() {
  return new Promise(function(resolve) {
    try {
      if (!window.speechSynthesis) { resolve(null); return; }
      var voices = speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        var str = voices.map(function(v) { return v.name + '|' + v.lang; }).join(',');
        resolve(hashString(str));
        return;
      }
      speechSynthesis.onvoiceschanged = function() {
        var v2 = speechSynthesis.getVoices();
        if (v2 && v2.length > 0) {
          var str2 = v2.map(function(v) { return v.name + '|' + v.lang; }).join(',');
          resolve(hashString(str2));
        } else {
          resolve(null);
        }
      };
      setTimeout(function() { resolve(null); }, 1500);
    } catch(e) {
      resolve(null);
    }
  });
}

export function collectBattery() {
  return new Promise(function(resolve) {
    try {
      if (!navigator.getBattery) { resolve({ batteryLevel: null, batteryCharging: null }); return; }
      navigator.getBattery().then(function(b) {
        resolve({
          batteryLevel: b.level != null ? Math.round(b.level * 100) : null,
          batteryCharging: b.charging != null ? b.charging : null
        });
      }).catch(function() {
        resolve({ batteryLevel: null, batteryCharging: null });
      });
    } catch(e) {
      resolve({ batteryLevel: null, batteryCharging: null });
    }
  });
}

export function collectClientHints() {
  return new Promise(function(resolve) {
    try {
      if (!navigator.userAgentData || !navigator.userAgentData.getHighEntropyValues) {
        resolve({ clientArch: null, clientBitness: null, clientPlatformVersion: null, clientModel: null });
        return;
      }
      navigator.userAgentData.getHighEntropyValues([
        'architecture', 'bitness', 'platformVersion', 'model'
      ]).then(function(ua) {
        resolve({
          clientArch: ua.architecture || null,
          clientBitness: ua.bitness || null,
          clientPlatformVersion: ua.platformVersion || null,
          clientModel: ua.model || null
        });
      }).catch(function() {
        resolve({ clientArch: null, clientBitness: null, clientPlatformVersion: null, clientModel: null });
      });
    } catch(e) {
      resolve({ clientArch: null, clientBitness: null, clientPlatformVersion: null, clientModel: null });
    }
  });
}

export function collectKeyboardLayout() {
  return new Promise(function(resolve) {
    try {
      if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) { resolve(null); return; }
      navigator.keyboard.getLayoutMap().then(function(layoutMap) {
        var keys = ['KeyQ', 'KeyW', 'KeyA', 'KeyZ', 'KeyY', 'KeyM'];
        var vals = keys.map(function(k) { return k + ':' + (layoutMap.get(k) || '?'); }).join(',');
        resolve(hashString(vals));
      }).catch(function() {
        resolve(null);
      });
    } catch(e) {
      resolve(null);
    }
  });
}

export function collectSVGFilterFingerprint() {
  return new Promise(function(resolve) {
    try {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
        '<filter id="t"><feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="42" result="turb"/>' +
        '<feColorMatrix type="saturate" values="3" in="turb"/></filter>' +
        '<rect width="200" height="200" filter="url(#t)"/></svg>';
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function() {
        try {
          var canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 200;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          var dataUrl = canvas.toDataURL();
          resolve(hashString(dataUrl));
        } catch(e) {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
      setTimeout(function() { resolve(null); }, 3000);
    } catch(e) { resolve(null); }
  });
}

// --- Sync collectors ---

export function collectMediaQueries() {
  var result = {
    prefersColorScheme: null,
    prefersReducedMotion: null,
    hdrSupport: null,
    forcedColors: null,
    pointerType: null,
    colorGamut: null
  };
  try {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) result.prefersColorScheme = 'dark';
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) result.prefersColorScheme = 'light';
    else result.prefersColorScheme = 'no-preference';
    result.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    result.hdrSupport = window.matchMedia('(dynamic-range: high)').matches;
    result.forcedColors = window.matchMedia('(forced-colors: active)').matches;
    if (window.matchMedia('(pointer: fine)').matches) result.pointerType = 'fine';
    else if (window.matchMedia('(pointer: coarse)').matches) result.pointerType = 'coarse';
    else result.pointerType = 'none';
    if (window.matchMedia('(color-gamut: rec2020)').matches) result.colorGamut = 'rec2020';
    else if (window.matchMedia('(color-gamut: p3)').matches) result.colorGamut = 'p3';
    else if (window.matchMedia('(color-gamut: srgb)').matches) result.colorGamut = 'srgb';
  } catch(e) {}
  return result;
}

export function collectIntlDetails() {
  try {
    var date = new Date(2024, 0, 15, 13, 45, 30);
    var dateStr = new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(date);
    var numStr = new Intl.NumberFormat(undefined, {
      style: 'currency', currency: 'USD'
    }).format(1234567.89);
    return hashString(dateStr + '|' + numStr);
  } catch(e) {
    return null;
  }
}

export function collectFonts() {
  try {
    var testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Bookman Old Style', 'Calibri', 'Cambria',
      'Cambria Math', 'Century', 'Century Gothic', 'Comic Sans MS', 'Consolas', 'Constantia',
      'Copperplate', 'Courier', 'Courier New', 'Didot', 'Franklin Gothic Medium', 'Futura',
      'Garamond', 'Geneva', 'Georgia', 'Gill Sans', 'Helvetica', 'Helvetica Neue',
      'Impact', 'Lucida Bright', 'Lucida Console', 'Lucida Grande', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Monaco', 'Monotype Corsiva', 'MS Gothic', 'MS PGothic',
      'MS Reference Sans Serif', 'MS Sans Serif', 'MS Serif', 'Palatino', 'Palatino Linotype',
      'Segoe Print', 'Segoe Script', 'Segoe UI', 'Tahoma', 'Times', 'Times New Roman',
      'Trebuchet MS', 'Verdana', 'Wingdings', 'Wingdings 2', 'Wingdings 3',
      'Andale Mono', 'Baskerville', 'Bodoni MT', 'Book Antiqua', 'Brush Script MT',
      'Candara', 'Charcoal', 'Corbel', 'Ebrima', 'Euphemia', 'Gadget', 'Haettenschweiler',
      'Harlow Solid Italic', 'Harrington', 'Herculanum', 'Hoefler Text', 'Informal Roman',
      'Javanese Text', 'Leelawadee', 'Malgun Gothic', 'Meiryo', 'Microsoft Himalaya',
      'MingLiU', 'Nirmala UI', 'Optima', 'Papyrus', 'Perpetua', 'Rockwell'
    ];
    var baseFonts = ['monospace', 'sans-serif', 'serif'];
    var testString = 'mmmmmmmmmmlli';
    var testSize = '72px';
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    var ctx = canvas.getContext('2d');
    var baseWidths = {};
    baseFonts.forEach(function(bf) {
      ctx.font = testSize + ' ' + bf;
      baseWidths[bf] = ctx.measureText(testString).width;
    });
    var detected = [];
    testFonts.forEach(function(font) {
      var found = false;
      baseFonts.forEach(function(bf) {
        ctx.font = testSize + " '" + font + "'," + bf;
        var w = ctx.measureText(testString).width;
        if (w !== baseWidths[bf]) found = true;
      });
      if (found) detected.push(font);
    });
    return detected.join(',');
  } catch(e) {
    return null;
  }
}

export function collectTimezoneExtended() {
  try {
    var jan = new Date(2024, 0, 1).getTimezoneOffset();
    var jul = new Date(2024, 6, 1).getTimezoneOffset();
    return {
      timezoneOffset: new Date().getTimezoneOffset(),
      observesDst: jan !== jul
    };
  } catch(e) {
    return { timezoneOffset: null, observesDst: null };
  }
}

export function collectAPIPresence() {
  try {
    var apis = {
      bluetooth: !!navigator.bluetooth,
      usb: !!navigator.usb,
      hid: !!navigator.hid,
      serial: !!navigator.serial,
      midi: !!navigator.requestMIDIAccess,
      webShare: !!navigator.share,
      paymentRequest: !!window.PaymentRequest,
      credentials: !!navigator.credentials,
      trustedTypes: !!window.trustedTypes,
      webGPU: !!navigator.gpu,
      webXR: !!navigator.xr,
      speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      wakeLock: !!navigator.wakeLock
    };
    return JSON.stringify(apis);
  } catch(e) {
    return null;
  }
}

export function collectWebGLExtended(gl) {
  var result = {
    webglMaxTextureSize: null,
    webglMaxViewportWidth: null,
    webglMaxViewportHeight: null,
    webglExtensions: null,
    webglShaderPrecision: null
  };
  if (!gl) return result;
  try {
    result.webglMaxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    var vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    if (vp) {
      result.webglMaxViewportWidth = vp[0];
      result.webglMaxViewportHeight = vp[1];
    }
    var exts = gl.getSupportedExtensions();
    if (exts) result.webglExtensions = exts.join(',');
    try {
      var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (hp) result.webglShaderPrecision = hp.precision + '/' + hp.rangeMin + '/' + hp.rangeMax;
    } catch(e) {}
  } catch(e) {}
  return result;
}

export function collectNetworkInfo() {
  var result = { connectionType: null, downlinkSpeed: null, networkRtt: null, saveData: null };
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    result.connectionType = conn.effectiveType || null;
    result.downlinkSpeed = conn.downlink != null ? conn.downlink : null;
    result.networkRtt = conn.rtt != null ? conn.rtt : null;
    result.saveData = conn.saveData != null ? conn.saveData : null;
  }
  return result;
}

export function collectScreenExtended() {
  return {
    screenAvailWidth: screen.availWidth || null,
    screenAvailHeight: screen.availHeight || null,
    pixelDepth: screen.pixelDepth || null,
    devicePixelRatio: window.devicePixelRatio || null,
    screenOrientation: (screen.orientation && screen.orientation.type) ? screen.orientation.type : null
  };
}

export function collectNavigatorExtended() {
  return {
    vendor: navigator.vendor || null,
    isOnline: navigator.onLine,
    pdfViewerEnabled: navigator.pdfViewerEnabled != null ? navigator.pdfViewerEnabled : null,
    webdriverDetected: navigator.webdriver === true
  };
}

export function collectMathFingerprint() {
  try {
    var results = [
      Math.tan(-1e300), Math.sinh(1), Math.cosh(1), Math.tanh(0.5),
      Math.expm1(1), Math.log1p(0.5), Math.cbrt(2), Math.hypot(3, 4),
      Math.fround(0.1), Math.clz32(1), Math.log2(7), Math.log10(3),
      Math.trunc(-1.5), Math.sign(-5), Math.atanh(0.5), Math.asinh(1), Math.acosh(2)
    ];
    return hashString(results.map(function(v) { return String(v); }).join(','));
  } catch(e) { return null; }
}

export function collectDOMRectFingerprint() {
  try {
    var div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;font-size:16px;font-family:Arial,sans-serif;';
    var spans = ['Hello', 'World', '\u4E16\u754C', 'fi', 'WMMW'];
    spans.forEach(function(text) {
      var span = document.createElement('span');
      span.textContent = text;
      div.appendChild(span);
    });
    document.body.appendChild(div);
    var range = document.createRange();
    range.selectNodeContents(div);
    var rects = range.getClientRects();
    var vals = [];
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      vals.push(r.x.toFixed(4) + ',' + r.y.toFixed(4) + ',' + r.width.toFixed(4) + ',' + r.height.toFixed(4));
    }
    document.body.removeChild(div);
    return hashString(vals.join('|'));
  } catch(e) { return null; }
}

export function collectMediaCodecs() {
  try {
    var video = document.createElement('video');
    var codecs = [
      'video/mp4; codecs="avc1.42E01E"', 'video/mp4; codecs="avc1.4D401E"',
      'video/mp4; codecs="avc1.64001E"', 'video/mp4; codecs="hev1.1.6.L93.B0"',
      'video/mp4; codecs="hvc1.1.6.L93.B0"', 'video/mp4; codecs="av01.0.01M.08"',
      'video/webm; codecs="vp8"', 'video/webm; codecs="vp9"',
      'video/webm; codecs="av01.0.04M.08"', 'video/ogg; codecs="theora"',
      'audio/mp4; codecs="mp4a.40.2"', 'audio/mp4; codecs="ac-3"',
      'audio/mp4; codecs="ec-3"', 'audio/mp4; codecs="flac"',
      'audio/webm; codecs="opus"', 'audio/webm; codecs="vorbis"',
      'audio/ogg; codecs="opus"', 'audio/ogg; codecs="vorbis"',
      'audio/mpeg', 'audio/wav'
    ];
    var results = codecs.map(function(c) { return video.canPlayType(c); });
    if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported) {
      var msTypes = [
        'video/mp4; codecs="avc1.42E01E"', 'video/webm; codecs="vp9"',
        'video/mp4; codecs="av01.0.01M.08"', 'video/webm; codecs="vp8"'
      ];
      msTypes.forEach(function(t) { results.push(MediaSource.isTypeSupported(t) ? 'y' : 'n'); });
    }
    return hashString(results.join(','));
  } catch(e) { return null; }
}

export function collectAudioContextProps() {
  try {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    var ctx = new AudioCtx();
    var props = {
      sampleRate: ctx.sampleRate,
      baseLatency: ctx.baseLatency || null,
      outputLatency: ctx.outputLatency || null
    };
    ctx.close().catch(function(){});
    return JSON.stringify(props);
  } catch(e) { return null; }
}

export function collectCSSSystemColors() {
  try {
    var colors = [
      'Canvas', 'CanvasText', 'LinkText', 'VisitedText', 'ActiveText',
      'ButtonFace', 'ButtonText', 'ButtonBorder', 'Field', 'FieldText',
      'Highlight', 'HighlightText', 'SelectedItem', 'SelectedItemText',
      'Mark', 'MarkText', 'GrayText', 'AccentColor', 'AccentColorText'
    ];
    var div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(div);
    var vals = colors.map(function(c) {
      div.style.color = c;
      var computed = window.getComputedStyle(div).color;
      return c + ':' + computed;
    });
    document.body.removeChild(div);
    return hashString(vals.join('|'));
  } catch(e) { return null; }
}

export function collectWebGL2Extended() {
  try {
    var canvas = document.createElement('canvas');
    var gl2 = canvas.getContext('webgl2');
    if (!gl2) return null;
    var params = [
      gl2.MAX_3D_TEXTURE_SIZE, gl2.MAX_ARRAY_TEXTURE_LAYERS, gl2.MAX_COLOR_ATTACHMENTS,
      gl2.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS, gl2.MAX_COMBINED_UNIFORM_BLOCKS,
      gl2.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS, gl2.MAX_DRAW_BUFFERS,
      gl2.MAX_ELEMENT_INDEX, gl2.MAX_ELEMENTS_INDICES, gl2.MAX_ELEMENTS_VERTICES,
      gl2.MAX_FRAGMENT_INPUT_COMPONENTS, gl2.MAX_FRAGMENT_UNIFORM_BLOCKS,
      gl2.MAX_FRAGMENT_UNIFORM_COMPONENTS, gl2.MAX_PROGRAM_TEXEL_OFFSET,
      gl2.MAX_SAMPLES, gl2.MAX_SERVER_WAIT_TIMEOUT, gl2.MAX_TEXTURE_LOD_BIAS,
      gl2.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS, gl2.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS,
      gl2.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS, gl2.MAX_UNIFORM_BLOCK_SIZE,
      gl2.MAX_UNIFORM_BUFFER_BINDINGS, gl2.MAX_VARYING_COMPONENTS,
      gl2.MAX_VERTEX_OUTPUT_COMPONENTS, gl2.MAX_VERTEX_UNIFORM_BLOCKS,
      gl2.MAX_VERTEX_UNIFORM_COMPONENTS
    ];
    var vals = params.map(function(p) { try { return gl2.getParameter(p); } catch(e) { return 'x'; } });
    return hashString(vals.join(','));
  } catch(e) { return null; }
}

export function collectErrorFingerprint() {
  try {
    var errors = [];
    try { null[0](); } catch(e) { errors.push(e.message); }
    try { new Array(-1); } catch(e) { errors.push(e.message); }
    try { eval('/[/'); } catch(e) { errors.push(e.message); }
    try { decodeURIComponent('%'); } catch(e) { errors.push(e.message); }
    try { (0).toFixed(200); } catch(e) { errors.push(e.message); }
    try { [].join.call(undefined); } catch(e) { errors.push(e.message); }
    return hashString(errors.join('|'));
  } catch(e) { return null; }
}

export function collectWasmCapabilities() {
  try {
    var caps = {
      wasm: typeof WebAssembly !== 'undefined',
      streaming: typeof WebAssembly !== 'undefined' && !!WebAssembly.compileStreaming,
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      atomics: typeof Atomics !== 'undefined',
      simd: false,
      bulkMemory: false
    };
    if (typeof WebAssembly !== 'undefined') {
      try {
        var simdTest = new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]);
        caps.simd = WebAssembly.validate(simdTest);
      } catch(e) {}
      try {
        var bulkTest = new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,3,1,0,1,10,14,1,12,0,65,0,65,0,65,0,252,10,0,0,11]);
        caps.bulkMemory = WebAssembly.validate(bulkTest);
      } catch(e) {}
    }
    return JSON.stringify(caps);
  } catch(e) { return null; }
}

export function collectScrollbarWidth() {
  try {
    var outer = document.createElement('div');
    outer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:100px;height:100px;overflow:scroll;';
    document.body.appendChild(outer);
    var width = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
    return width;
  } catch(e) { return null; }
}

export function collectTimerResolution() {
  try {
    var deltas = [];
    for (var i = 0; i < 50; i++) {
      var t1 = performance.now();
      var t2 = performance.now();
      while (t2 === t1) { t2 = performance.now(); }
      deltas.push(t2 - t1);
    }
    deltas.sort(function(a, b) { return a - b; });
    var median = deltas[Math.floor(deltas.length / 2)];
    return median.toFixed(6);
  } catch(e) { return null; }
}

export function collectTextMetrics() {
  try {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fonts = ['16px Arial', '16px Times New Roman', '16px Courier New', '16px Georgia'];
    var testStr = 'Hgfpq|WMMW';
    var vals = [];
    fonts.forEach(function(f) {
      ctx.font = f;
      var m = ctx.measureText(testStr);
      vals.push([
        m.actualBoundingBoxAscent, m.actualBoundingBoxDescent,
        m.actualBoundingBoxLeft, m.actualBoundingBoxRight, m.width
      ].map(function(v) { return v != null ? v.toFixed(4) : 'x'; }).join(','));
    });
    return hashString(vals.join('|'));
  } catch(e) { return null; }
}

export function collectDateToStringFingerprint() {
  try {
    var d = new Date(2024, 0, 15, 13, 45, 30);
    var parts = [d.toString(), d.toLocaleString(), d.toLocaleString('en-US'), d.toLocaleString('de-DE')];
    return hashString(parts.join('|'));
  } catch(e) { return null; }
}

export function collectEmojiSupport() {
  try {
    var emojis = [
      '\uD83E\uDD2F', '\uD83E\uDD7A', '\uD83E\uDE78', '\uD83E\uDEE0',
      '\uD83E\uDEE1', '\uD83E\uDEE8', '\uD83D\uDE36\u200D\uD83C\uDF2B\uFE0F',
      '\uD83E\uDEC3', '\u2764\uFE0F\u200D\uD83D\uDD25', '\uD83E\uDEE9'
    ];
    var canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    var ctx = canvas.getContext('2d');
    var results = emojis.map(function(emoji) {
      ctx.clearRect(0, 0, 20, 20);
      ctx.font = '16px serif';
      ctx.fillText(emoji, 0, 16);
      var data = ctx.getImageData(0, 0, 20, 20).data;
      var hasPixels = false;
      for (var i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { hasPixels = true; break; }
      }
      return hasPixels ? '1' : '0';
    });
    return hashString(results.join(','));
  } catch(e) { return null; }
}

export function collectPerfEntryTypes() {
  try {
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes) {
      return PerformanceObserver.supportedEntryTypes.join(',');
    }
    return null;
  } catch(e) { return null; }
}

export function collectSecurityContext() {
  try {
    return JSON.stringify({
      crossOriginIsolated: !!window.crossOriginIsolated,
      isSecureContext: !!window.isSecureContext,
      originAgentCluster: !!window.originAgentCluster
    });
  } catch(e) { return null; }
}

export function collectCSSSupport() {
  try {
    if (!CSS || !CSS.supports) return null;
    var features = [
      ['container-type', 'inline-size'], ['view-transition-name', 'x'],
      ['anchor-name', '--a'], ['position-anchor', '--a'],
      ['text-wrap', 'balance'], ['text-wrap', 'pretty'],
      ['color', 'oklch(0.5 0.2 120)'], ['color', 'color-mix(in srgb, red 50%, blue)'],
      ['color', 'light-dark(white, black)'], ['font-size', '1cqi'],
      ['display', 'grid'], ['display', 'contents'],
      ['aspect-ratio', '1'], ['gap', '1px'],
      ['overscroll-behavior', 'contain'], ['scroll-snap-type', 'x mandatory'],
      ['backdrop-filter', 'blur(1px)'], ['contain', 'paint'],
      ['content-visibility', 'auto'], ['accent-color', 'red'],
      ['color-scheme', 'dark'], ['field-sizing', 'content'],
      ['font-palette', 'normal'], ['math-style', 'compact'],
      ['text-spacing-trim', 'space-all']
    ];
    var results = features.map(function(f) { return CSS.supports(f[0], f[1]) ? '1' : '0'; });
    return hashString(results.join(','));
  } catch(e) { return null; }
}

export function collectLineBreakFingerprint() {
  try {
    var div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:50px;font-size:16px;font-family:serif;line-height:normal;white-space:normal;word-break:normal;';
    document.body.appendChild(div);
    var tests = [
      '\u4E16\u754C\u4F60\u597D\u4E16\u754C\u4F60\u597D',
      'Supercalifragilisticexpialidocious',
      'word\u00ADhy\u00ADphen\u00ADat\u00ADed\u00ADtext',
      'ABCDEFGHIJKLMNOP',
      '\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23'
    ];
    var heights = tests.map(function(text) {
      div.textContent = text;
      return div.offsetHeight;
    });
    document.body.removeChild(div);
    return hashString(heights.join(','));
  } catch(e) { return null; }
}
