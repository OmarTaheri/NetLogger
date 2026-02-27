"use strict";
(() => {
  // server/src/collector/behavior-tracker.js
  var BehaviorTracker = function() {
    var startTime = Date.now();
    var mouseSamples = [];
    var clickSamples = [];
    var scrollSamples = [];
    var touchSamples = [];
    var motionSamples = [];
    var blurCount = 0;
    var totalBlurTimeMs = 0;
    var lastBlurTime = null;
    var lastMouseTime = 0;
    var lastMouseX = 0;
    var lastMouseY = 0;
    var lastSpeed = 0;
    var MAX_MOUSE = 500;
    var MAX_SCROLL = 200;
    var MAX_TOUCH = 200;
    var MAX_MOTION = 200;
    try {
      document.addEventListener("mousemove", function(e) {
        if (mouseSamples.length >= MAX_MOUSE)
          return;
        var now = Date.now();
        var dt = now - lastMouseTime;
        if (dt < 16)
          return;
        var dx = e.clientX - lastMouseX;
        var dy = e.clientY - lastMouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var speed = dt > 0 ? dist / dt : 0;
        var accel = dt > 0 ? Math.abs(speed - lastSpeed) / dt : 0;
        var angle = Math.atan2(dy, dx);
        mouseSamples.push({ speed, accel, angle, dist });
        lastMouseTime = now;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        lastSpeed = speed;
      }, { passive: true });
    } catch (e) {
    }
    try {
      document.addEventListener("mousedown", function(e) {
        clickSamples.push({ time: Date.now(), x: e.clientX, y: e.clientY });
      }, { passive: true });
    } catch (e) {
    }
    try {
      var lastScrollTime = 0;
      var lastScrollY = 0;
      window.addEventListener("scroll", function() {
        if (scrollSamples.length >= MAX_SCROLL)
          return;
        var now = Date.now();
        var dt = now - lastScrollTime;
        if (dt < 50)
          return;
        var sy = window.scrollY || window.pageYOffset || 0;
        var maxH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        var depth = maxH > 0 ? sy / maxH * 100 : 0;
        var scrollSpeed = dt > 0 ? Math.abs(sy - lastScrollY) / dt : 0;
        var dir = sy > lastScrollY ? 1 : sy < lastScrollY ? -1 : 0;
        scrollSamples.push({ depth, speed: scrollSpeed, dir });
        lastScrollTime = now;
        lastScrollY = sy;
      }, { passive: true });
    } catch (e) {
    }
    var activeTouches = {};
    try {
      document.addEventListener("touchstart", function(e) {
        if (touchSamples.length >= MAX_TOUCH)
          return;
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          activeTouches[t.identifier] = { startTime: Date.now(), pressure: t.force || 0, radiusX: t.radiusX || 0, radiusY: t.radiusY || 0 };
        }
      }, { passive: true });
      document.addEventListener("touchend", function(e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          var start = activeTouches[t.identifier];
          if (start) {
            touchSamples.push({ pressure: start.pressure, radiusX: start.radiusX, radiusY: start.radiusY, duration: Date.now() - start.startTime });
            delete activeTouches[t.identifier];
          }
        }
      }, { passive: true });
    } catch (e) {
    }
    try {
      window.addEventListener("deviceorientation", function(e) {
        if (motionSamples.length >= MAX_MOTION)
          return;
        motionSamples.push({ type: "orient", alpha: e.alpha, beta: e.beta, gamma: e.gamma });
      }, { passive: true });
      window.addEventListener("devicemotion", function(e) {
        if (motionSamples.length >= MAX_MOTION)
          return;
        var a = e.accelerationIncludingGravity || {};
        motionSamples.push({ type: "motion", x: a.x, y: a.y, z: a.z });
      }, { passive: true });
    } catch (e) {
    }
    try {
      window.addEventListener("blur", function() {
        blurCount++;
        lastBlurTime = Date.now();
      }, { passive: true });
      window.addEventListener("focus", function() {
        if (lastBlurTime) {
          totalBlurTimeMs += Date.now() - lastBlurTime;
          lastBlurTime = null;
        }
      }, { passive: true });
      document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
          if (!lastBlurTime) {
            blurCount++;
            lastBlurTime = Date.now();
          }
        } else {
          if (lastBlurTime) {
            totalBlurTimeMs += Date.now() - lastBlurTime;
            lastBlurTime = null;
          }
        }
      }, { passive: true });
    } catch (e) {
    }
    return {
      summarize: function() {
        var result = {};
        result.dwellTime = Date.now() - startTime;
        if (mouseSamples.length > 0) {
          var totalSpeed = 0, maxSpd = 0, totalAccel = 0;
          var dirs = [0, 0, 0, 0, 0, 0, 0, 0];
          var totalDist = 0;
          for (var i = 0; i < mouseSamples.length; i++) {
            var s = mouseSamples[i];
            totalSpeed += s.speed;
            if (s.speed > maxSpd)
              maxSpd = s.speed;
            totalAccel += s.accel;
            totalDist += s.dist;
            var bucket = Math.floor((s.angle + Math.PI) / (2 * Math.PI) * 8) % 8;
            dirs[bucket]++;
          }
          var n = mouseSamples.length;
          var avgSpeed = totalSpeed / n;
          var speedVar = 0;
          for (var j = 0; j < n; j++) {
            var diff = mouseSamples[j].speed - avgSpeed;
            speedVar += diff * diff;
          }
          var jitter = Math.sqrt(speedVar / n);
          var straightDev = totalDist > 0 ? n > 1 ? 1 - Math.sqrt(Math.pow(lastMouseX, 2) + Math.pow(lastMouseY, 2)) / totalDist : 0 : 0;
          if (straightDev < 0)
            straightDev = 0;
          var entropy = 0;
          for (var d = 0; d < 8; d++) {
            if (dirs[d] > 0) {
              var p = dirs[d] / n;
              entropy -= p * Math.log2(p);
            }
          }
          result.mouseData = JSON.stringify({
            totalMoves: n,
            avgSpeed: Math.round(avgSpeed * 1e3) / 1e3,
            maxSpeed: Math.round(maxSpd * 1e3) / 1e3,
            avgAcceleration: Math.round(totalAccel / n * 1e3) / 1e3,
            jitterScore: Math.round(jitter * 1e3) / 1e3,
            straightLineDeviation: Math.round(straightDev * 1e3) / 1e3,
            directionEntropy: Math.round(entropy * 1e3) / 1e3
          });
        } else {
          result.mouseData = null;
        }
        if (clickSamples.length > 0) {
          var intervals = [];
          var dblClicks = 0;
          for (var ci = 1; ci < clickSamples.length; ci++) {
            var gap = clickSamples[ci].time - clickSamples[ci - 1].time;
            intervals.push(gap);
            if (gap < 400)
              dblClicks++;
          }
          var avgInterval = intervals.length > 0 ? intervals.reduce(function(a, b) {
            return a + b;
          }, 0) / intervals.length : 0;
          result.clickData = JSON.stringify({
            totalClicks: clickSamples.length,
            avgTimeBetweenClicks: Math.round(avgInterval),
            doubleClickCount: dblClicks
          });
        } else {
          result.clickData = null;
        }
        if (scrollSamples.length > 0) {
          var maxDepth = 0, totalScrollSpeed = 0, dirChanges = 0, prevDir = 0;
          var scrollSpeeds = [];
          for (var si = 0; si < scrollSamples.length; si++) {
            var ss = scrollSamples[si];
            if (ss.depth > maxDepth)
              maxDepth = ss.depth;
            totalScrollSpeed += ss.speed;
            scrollSpeeds.push(ss.speed);
            if (si > 0 && ss.dir !== 0 && prevDir !== 0 && ss.dir !== prevDir)
              dirChanges++;
            if (ss.dir !== 0)
              prevDir = ss.dir;
          }
          var avgScrollSpd = totalScrollSpeed / scrollSamples.length;
          var scrollSpeedVar = 0;
          for (var sv = 0; sv < scrollSpeeds.length; sv++) {
            var sdiff = scrollSpeeds[sv] - avgScrollSpd;
            scrollSpeedVar += sdiff * sdiff;
          }
          var smoothness = 100 - Math.min(100, Math.sqrt(scrollSpeedVar / scrollSpeeds.length) * 50);
          result.scrollData = JSON.stringify({
            totalScrollEvents: scrollSamples.length,
            maxScrollDepth: Math.round(maxDepth * 10) / 10,
            avgScrollSpeed: Math.round(avgScrollSpd * 1e3) / 1e3,
            directionChanges: dirChanges,
            smoothnessScore: Math.round(smoothness * 10) / 10
          });
        } else {
          result.scrollData = null;
        }
        if (touchSamples.length > 0) {
          var totalPressure = 0, totalRX = 0, totalRY = 0, totalDur = 0;
          for (var ti = 0; ti < touchSamples.length; ti++) {
            totalPressure += touchSamples[ti].pressure;
            totalRX += touchSamples[ti].radiusX;
            totalRY += touchSamples[ti].radiusY;
            totalDur += touchSamples[ti].duration;
          }
          var tn = touchSamples.length;
          result.touchData = JSON.stringify({
            avgPressure: Math.round(totalPressure / tn * 1e3) / 1e3,
            avgRadiusX: Math.round(totalRX / tn * 100) / 100,
            avgRadiusY: Math.round(totalRY / tn * 100) / 100,
            touchCount: tn,
            avgTouchDuration: Math.round(totalDur / tn)
          });
        } else {
          result.touchData = null;
        }
        var orientSamples = [];
        var accelSamples = [];
        for (var mi = 0; mi < motionSamples.length; mi++) {
          if (motionSamples[mi].type === "orient")
            orientSamples.push(motionSamples[mi]);
          else
            accelSamples.push(motionSamples[mi]);
        }
        if (orientSamples.length > 0 || accelSamples.length > 0) {
          var mData = { hasGyro: orientSamples.length > 0, hasAccel: accelSamples.length > 0 };
          if (orientSamples.length > 0) {
            var aSum = 0, bSum = 0, gSum = 0;
            for (var oi = 0; oi < orientSamples.length; oi++) {
              aSum += orientSamples[oi].alpha || 0;
              bSum += orientSamples[oi].beta || 0;
              gSum += orientSamples[oi].gamma || 0;
            }
            mData.avgAlpha = Math.round(aSum / orientSamples.length * 100) / 100;
            mData.avgBeta = Math.round(bSum / orientSamples.length * 100) / 100;
            mData.avgGamma = Math.round(gSum / orientSamples.length * 100) / 100;
          }
          if (accelSamples.length > 0) {
            var xSum = 0, ySum = 0, zSum = 0;
            for (var ai = 0; ai < accelSamples.length; ai++) {
              xSum += accelSamples[ai].x || 0;
              ySum += accelSamples[ai].y || 0;
              zSum += accelSamples[ai].z || 0;
            }
            mData.avgAccelX = Math.round(xSum / accelSamples.length * 100) / 100;
            mData.avgAccelY = Math.round(ySum / accelSamples.length * 100) / 100;
            mData.avgAccelZ = Math.round(zSum / accelSamples.length * 100) / 100;
          }
          result.motionData = JSON.stringify(mData);
        } else {
          result.motionData = null;
        }
        if (lastBlurTime) {
          totalBlurTimeMs += Date.now() - lastBlurTime;
          lastBlurTime = null;
        }
        result.focusData = JSON.stringify({
          blurCount,
          totalBlurTimeMs,
          avgBlurDurationMs: blurCount > 0 ? Math.round(totalBlurTimeMs / blurCount) : 0
        });
        return result;
      }
    };
  }();

  // server/src/collector/fingerprint-collectors.js
  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  function parseUA(ua) {
    if (typeof UAParser !== "undefined") {
      var parser = new UAParser(ua);
      var b = parser.getBrowser();
      var o = parser.getOS();
      return {
        browser: b.name || "Unknown",
        browserVersion: b.version || "",
        os: o.name ? o.name + (o.version ? " " + o.version : "") : "Unknown"
      };
    }
    var browser = "Unknown", browserVersion = "", os = "Unknown";
    if (/Edg\/(\d+[\.\d]*)/.test(ua)) {
      browser = "Edge";
      browserVersion = RegExp.$1;
    } else if (/OPR\/(\d+[\.\d]*)/.test(ua)) {
      browser = "Opera";
      browserVersion = RegExp.$1;
    } else if (/Chrome\/(\d+[\.\d]*)/.test(ua)) {
      browser = "Chrome";
      browserVersion = RegExp.$1;
    } else if (/Firefox\/(\d+[\.\d]*)/.test(ua)) {
      browser = "Firefox";
      browserVersion = RegExp.$1;
    } else if (/Safari\/(\d+[\.\d]*)/.test(ua) && /Version\/(\d+[\.\d]*)/.test(ua)) {
      browser = "Safari";
      browserVersion = RegExp.$1;
    }
    if (/Windows NT 10/.test(ua))
      os = "Windows 10/11";
    else if (/Windows NT/.test(ua))
      os = "Windows";
    else if (/Mac OS X (\d+[._]\d+)/.test(ua))
      os = "macOS " + RegExp.$1.replace(/_/g, ".");
    else if (/Android (\d+[\.\d]*)/.test(ua))
      os = "Android " + RegExp.$1;
    else if (/iPhone OS (\d+[_\d]*)/.test(ua))
      os = "iOS " + RegExp.$1.replace(/_/g, ".");
    else if (/iPad/.test(ua))
      os = "iPadOS";
    else if (/Linux/.test(ua))
      os = "Linux";
    else if (/CrOS/.test(ua))
      os = "Chrome OS";
    return { browser, browserVersion, os };
  }
  function collectAudioFingerprint() {
    return new Promise(function(resolve) {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          resolve(null);
          return;
        }
        var ctx = new AudioCtx();
        var oscillator = ctx.createOscillator();
        var analyser = ctx.createAnalyser();
        var gain = ctx.createGain();
        var processor = ctx.createScriptProcessor(4096, 1, 1);
        gain.gain.value = 0;
        oscillator.type = "triangle";
        oscillator.frequency.value = 1e4;
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
          ctx.close().catch(function() {
          });
          var str = audioData.map(function(v) {
            return v.toFixed(2);
          }).join(",");
          resolve(hashString(str));
        };
        oscillator.start(0);
        setTimeout(function() {
          try {
            oscillator.disconnect();
            processor.disconnect();
            gain.disconnect();
            ctx.close().catch(function() {
            });
          } catch (e) {
          }
          if (audioData.length === 0)
            resolve(null);
        }, 1e3);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function collectMediaDevices() {
    return new Promise(function(resolve) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        resolve({ cameraCount: null, microphoneCount: null, speakerCount: null });
        return;
      }
      navigator.mediaDevices.enumerateDevices().then(function(devices) {
        var cameras = 0, mics = 0, speakers = 0;
        devices.forEach(function(d) {
          if (d.kind === "videoinput")
            cameras++;
          else if (d.kind === "audioinput")
            mics++;
          else if (d.kind === "audiooutput")
            speakers++;
        });
        resolve({ cameraCount: cameras, microphoneCount: mics, speakerCount: speakers });
      }).catch(function() {
        resolve({ cameraCount: null, microphoneCount: null, speakerCount: null });
      });
    });
  }
  function collectStorageEstimate() {
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
  function collectPermissions() {
    return new Promise(function(resolve) {
      if (!navigator.permissions || !navigator.permissions.query) {
        resolve({ permGeolocation: null, permCamera: null, permMicrophone: null, permNotifications: null });
        return;
      }
      var names = ["geolocation", "camera", "microphone", "notifications"];
      var results = { permGeolocation: null, permCamera: null, permMicrophone: null, permNotifications: null };
      var keys = ["permGeolocation", "permCamera", "permMicrophone", "permNotifications"];
      var promises = names.map(function(name, i) {
        return navigator.permissions.query({ name }).then(function(s) {
          results[keys[i]] = s.state;
        }).catch(function() {
        });
      });
      Promise.all(promises).then(function() {
        resolve(results);
      });
    });
  }
  function detectAdBlocker() {
    return new Promise(function(resolve) {
      try {
        var div = document.createElement("div");
        div.innerHTML = "&nbsp;";
        div.className = "adsbox ad-banner ad-placement pub_300x250 pub_300x250m pub_728x90";
        div.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;";
        document.body.appendChild(div);
        setTimeout(function() {
          var detected = div.offsetHeight === 0 || div.clientHeight === 0 || window.getComputedStyle(div).display === "none";
          document.body.removeChild(div);
          resolve(detected);
        }, 100);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function detectIncognito() {
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
  function collectWebRTCIPs() {
    return new Promise(function(resolve) {
      try {
        var RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTC) {
          resolve(null);
          return;
        }
        var pc = new RTC({ iceServers: [] });
        var ips = {};
        pc.createDataChannel("");
        pc.createOffer().then(function(offer) {
          pc.setLocalDescription(offer);
        }).catch(function() {
          resolve(null);
        });
        pc.onicecandidate = function(e) {
          if (!e || !e.candidate || !e.candidate.candidate)
            return;
          var parts = e.candidate.candidate.split(" ");
          var ip = parts[4];
          if (ip && ip.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
            ips[ip] = true;
          }
        };
        setTimeout(function() {
          try {
            pc.close();
          } catch (ex) {
          }
          var found = Object.keys(ips);
          resolve(found.length > 0 ? found.join(",") : null);
        }, 2e3);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function collectSpeechVoices() {
    return new Promise(function(resolve) {
      try {
        if (!window.speechSynthesis) {
          resolve(null);
          return;
        }
        var voices = speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          var str = voices.map(function(v) {
            return v.name + "|" + v.lang;
          }).join(",");
          resolve(hashString(str));
          return;
        }
        speechSynthesis.onvoiceschanged = function() {
          var v2 = speechSynthesis.getVoices();
          if (v2 && v2.length > 0) {
            var str2 = v2.map(function(v) {
              return v.name + "|" + v.lang;
            }).join(",");
            resolve(hashString(str2));
          } else {
            resolve(null);
          }
        };
        setTimeout(function() {
          resolve(null);
        }, 1500);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function collectBattery() {
    return new Promise(function(resolve) {
      try {
        if (!navigator.getBattery) {
          resolve({ batteryLevel: null, batteryCharging: null });
          return;
        }
        navigator.getBattery().then(function(b) {
          resolve({
            batteryLevel: b.level != null ? Math.round(b.level * 100) : null,
            batteryCharging: b.charging != null ? b.charging : null
          });
        }).catch(function() {
          resolve({ batteryLevel: null, batteryCharging: null });
        });
      } catch (e) {
        resolve({ batteryLevel: null, batteryCharging: null });
      }
    });
  }
  function collectClientHints() {
    return new Promise(function(resolve) {
      try {
        if (!navigator.userAgentData || !navigator.userAgentData.getHighEntropyValues) {
          resolve({ clientArch: null, clientBitness: null, clientPlatformVersion: null, clientModel: null });
          return;
        }
        navigator.userAgentData.getHighEntropyValues([
          "architecture",
          "bitness",
          "platformVersion",
          "model"
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
      } catch (e) {
        resolve({ clientArch: null, clientBitness: null, clientPlatformVersion: null, clientModel: null });
      }
    });
  }
  function collectKeyboardLayout() {
    return new Promise(function(resolve) {
      try {
        if (!navigator.keyboard || !navigator.keyboard.getLayoutMap) {
          resolve(null);
          return;
        }
        navigator.keyboard.getLayoutMap().then(function(layoutMap) {
          var keys = ["KeyQ", "KeyW", "KeyA", "KeyZ", "KeyY", "KeyM"];
          var vals = keys.map(function(k) {
            return k + ":" + (layoutMap.get(k) || "?");
          }).join(",");
          resolve(hashString(vals));
        }).catch(function() {
          resolve(null);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }
  function collectSVGFilterFingerprint() {
    return new Promise(function(resolve) {
      try {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="t"><feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="42" result="turb"/><feColorMatrix type="saturate" values="3" in="turb"/></filter><rect width="200" height="200" filter="url(#t)"/></svg>';
        var blob = new Blob([svg], { type: "image/svg+xml" });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function() {
          try {
            var canvas = document.createElement("canvas");
            canvas.width = 200;
            canvas.height = 200;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            var dataUrl = canvas.toDataURL();
            resolve(hashString(dataUrl));
          } catch (e) {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };
        img.onerror = function() {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
        setTimeout(function() {
          resolve(null);
        }, 3e3);
      } catch (e) {
        resolve(null);
      }
    });
  }
  function collectMediaQueries() {
    var result = {
      prefersColorScheme: null,
      prefersReducedMotion: null,
      hdrSupport: null,
      forcedColors: null,
      pointerType: null,
      colorGamut: null
    };
    try {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches)
        result.prefersColorScheme = "dark";
      else if (window.matchMedia("(prefers-color-scheme: light)").matches)
        result.prefersColorScheme = "light";
      else
        result.prefersColorScheme = "no-preference";
      result.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      result.hdrSupport = window.matchMedia("(dynamic-range: high)").matches;
      result.forcedColors = window.matchMedia("(forced-colors: active)").matches;
      if (window.matchMedia("(pointer: fine)").matches)
        result.pointerType = "fine";
      else if (window.matchMedia("(pointer: coarse)").matches)
        result.pointerType = "coarse";
      else
        result.pointerType = "none";
      if (window.matchMedia("(color-gamut: rec2020)").matches)
        result.colorGamut = "rec2020";
      else if (window.matchMedia("(color-gamut: p3)").matches)
        result.colorGamut = "p3";
      else if (window.matchMedia("(color-gamut: srgb)").matches)
        result.colorGamut = "srgb";
    } catch (e) {
    }
    return result;
  }
  function collectIntlDetails() {
    try {
      var date = new Date(2024, 0, 15, 13, 45, 30);
      var dateStr = new Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      }).format(date);
      var numStr = new Intl.NumberFormat(void 0, {
        style: "currency",
        currency: "USD"
      }).format(123456789e-2);
      return hashString(dateStr + "|" + numStr);
    } catch (e) {
      return null;
    }
  }
  function collectFonts() {
    try {
      var testFonts = [
        "Arial",
        "Arial Black",
        "Arial Narrow",
        "Bookman Old Style",
        "Calibri",
        "Cambria",
        "Cambria Math",
        "Century",
        "Century Gothic",
        "Comic Sans MS",
        "Consolas",
        "Constantia",
        "Copperplate",
        "Courier",
        "Courier New",
        "Didot",
        "Franklin Gothic Medium",
        "Futura",
        "Garamond",
        "Geneva",
        "Georgia",
        "Gill Sans",
        "Helvetica",
        "Helvetica Neue",
        "Impact",
        "Lucida Bright",
        "Lucida Console",
        "Lucida Grande",
        "Lucida Sans Unicode",
        "Microsoft Sans Serif",
        "Monaco",
        "Monotype Corsiva",
        "MS Gothic",
        "MS PGothic",
        "MS Reference Sans Serif",
        "MS Sans Serif",
        "MS Serif",
        "Palatino",
        "Palatino Linotype",
        "Segoe Print",
        "Segoe Script",
        "Segoe UI",
        "Tahoma",
        "Times",
        "Times New Roman",
        "Trebuchet MS",
        "Verdana",
        "Wingdings",
        "Wingdings 2",
        "Wingdings 3",
        "Andale Mono",
        "Baskerville",
        "Bodoni MT",
        "Book Antiqua",
        "Brush Script MT",
        "Candara",
        "Charcoal",
        "Corbel",
        "Ebrima",
        "Euphemia",
        "Gadget",
        "Haettenschweiler",
        "Harlow Solid Italic",
        "Harrington",
        "Herculanum",
        "Hoefler Text",
        "Informal Roman",
        "Javanese Text",
        "Leelawadee",
        "Malgun Gothic",
        "Meiryo",
        "Microsoft Himalaya",
        "MingLiU",
        "Nirmala UI",
        "Optima",
        "Papyrus",
        "Perpetua",
        "Rockwell"
      ];
      var baseFonts = ["monospace", "sans-serif", "serif"];
      var testString = "mmmmmmmmmmlli";
      var testSize = "72px";
      var canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      var ctx = canvas.getContext("2d");
      var baseWidths = {};
      baseFonts.forEach(function(bf) {
        ctx.font = testSize + " " + bf;
        baseWidths[bf] = ctx.measureText(testString).width;
      });
      var detected = [];
      testFonts.forEach(function(font) {
        var found = false;
        baseFonts.forEach(function(bf) {
          ctx.font = testSize + " '" + font + "'," + bf;
          var w = ctx.measureText(testString).width;
          if (w !== baseWidths[bf])
            found = true;
        });
        if (found)
          detected.push(font);
      });
      return detected.join(",");
    } catch (e) {
      return null;
    }
  }
  function collectTimezoneExtended() {
    try {
      var jan = new Date(2024, 0, 1).getTimezoneOffset();
      var jul = new Date(2024, 6, 1).getTimezoneOffset();
      return {
        timezoneOffset: (/* @__PURE__ */ new Date()).getTimezoneOffset(),
        observesDst: jan !== jul
      };
    } catch (e) {
      return { timezoneOffset: null, observesDst: null };
    }
  }
  function collectAPIPresence() {
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
    } catch (e) {
      return null;
    }
  }
  function collectWebGLExtended(gl) {
    var result = {
      webglMaxTextureSize: null,
      webglMaxViewportWidth: null,
      webglMaxViewportHeight: null,
      webglExtensions: null,
      webglShaderPrecision: null
    };
    if (!gl)
      return result;
    try {
      result.webglMaxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      var vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      if (vp) {
        result.webglMaxViewportWidth = vp[0];
        result.webglMaxViewportHeight = vp[1];
      }
      var exts = gl.getSupportedExtensions();
      if (exts)
        result.webglExtensions = exts.join(",");
      try {
        var hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (hp)
          result.webglShaderPrecision = hp.precision + "/" + hp.rangeMin + "/" + hp.rangeMax;
      } catch (e) {
      }
    } catch (e) {
    }
    return result;
  }
  function collectNetworkInfo() {
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
  function collectScreenExtended() {
    return {
      screenAvailWidth: screen.availWidth || null,
      screenAvailHeight: screen.availHeight || null,
      pixelDepth: screen.pixelDepth || null,
      devicePixelRatio: window.devicePixelRatio || null,
      screenOrientation: screen.orientation && screen.orientation.type ? screen.orientation.type : null
    };
  }
  function collectNavigatorExtended() {
    return {
      vendor: navigator.vendor || null,
      isOnline: navigator.onLine,
      pdfViewerEnabled: navigator.pdfViewerEnabled != null ? navigator.pdfViewerEnabled : null,
      webdriverDetected: navigator.webdriver === true
    };
  }
  function collectMathFingerprint() {
    try {
      var results = [
        Math.tan(-1e300),
        Math.sinh(1),
        Math.cosh(1),
        Math.tanh(0.5),
        Math.expm1(1),
        Math.log1p(0.5),
        Math.cbrt(2),
        Math.hypot(3, 4),
        Math.fround(0.1),
        Math.clz32(1),
        Math.log2(7),
        Math.log10(3),
        Math.trunc(-1.5),
        Math.sign(-5),
        Math.atanh(0.5),
        Math.asinh(1),
        Math.acosh(2)
      ];
      return hashString(results.map(function(v) {
        return String(v);
      }).join(","));
    } catch (e) {
      return null;
    }
  }
  function collectDOMRectFingerprint() {
    try {
      var div = document.createElement("div");
      div.style.cssText = "position:absolute;left:-9999px;top:-9999px;font-size:16px;font-family:Arial,sans-serif;";
      var spans = ["Hello", "World", "\u4E16\u754C", "fi", "WMMW"];
      spans.forEach(function(text) {
        var span = document.createElement("span");
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
        vals.push(r.x.toFixed(4) + "," + r.y.toFixed(4) + "," + r.width.toFixed(4) + "," + r.height.toFixed(4));
      }
      document.body.removeChild(div);
      return hashString(vals.join("|"));
    } catch (e) {
      return null;
    }
  }
  function collectMediaCodecs() {
    try {
      var video = document.createElement("video");
      var codecs = [
        'video/mp4; codecs="avc1.42E01E"',
        'video/mp4; codecs="avc1.4D401E"',
        'video/mp4; codecs="avc1.64001E"',
        'video/mp4; codecs="hev1.1.6.L93.B0"',
        'video/mp4; codecs="hvc1.1.6.L93.B0"',
        'video/mp4; codecs="av01.0.01M.08"',
        'video/webm; codecs="vp8"',
        'video/webm; codecs="vp9"',
        'video/webm; codecs="av01.0.04M.08"',
        'video/ogg; codecs="theora"',
        'audio/mp4; codecs="mp4a.40.2"',
        'audio/mp4; codecs="ac-3"',
        'audio/mp4; codecs="ec-3"',
        'audio/mp4; codecs="flac"',
        'audio/webm; codecs="opus"',
        'audio/webm; codecs="vorbis"',
        'audio/ogg; codecs="opus"',
        'audio/ogg; codecs="vorbis"',
        "audio/mpeg",
        "audio/wav"
      ];
      var results = codecs.map(function(c) {
        return video.canPlayType(c);
      });
      if (typeof MediaSource !== "undefined" && MediaSource.isTypeSupported) {
        var msTypes = [
          'video/mp4; codecs="avc1.42E01E"',
          'video/webm; codecs="vp9"',
          'video/mp4; codecs="av01.0.01M.08"',
          'video/webm; codecs="vp8"'
        ];
        msTypes.forEach(function(t) {
          results.push(MediaSource.isTypeSupported(t) ? "y" : "n");
        });
      }
      return hashString(results.join(","));
    } catch (e) {
      return null;
    }
  }
  function collectAudioContextProps() {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx)
        return null;
      var ctx = new AudioCtx();
      var props = {
        sampleRate: ctx.sampleRate,
        baseLatency: ctx.baseLatency || null,
        outputLatency: ctx.outputLatency || null
      };
      ctx.close().catch(function() {
      });
      return JSON.stringify(props);
    } catch (e) {
      return null;
    }
  }
  function collectCSSSystemColors() {
    try {
      var colors = [
        "Canvas",
        "CanvasText",
        "LinkText",
        "VisitedText",
        "ActiveText",
        "ButtonFace",
        "ButtonText",
        "ButtonBorder",
        "Field",
        "FieldText",
        "Highlight",
        "HighlightText",
        "SelectedItem",
        "SelectedItemText",
        "Mark",
        "MarkText",
        "GrayText",
        "AccentColor",
        "AccentColorText"
      ];
      var div = document.createElement("div");
      div.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
      document.body.appendChild(div);
      var vals = colors.map(function(c) {
        div.style.color = c;
        var computed = window.getComputedStyle(div).color;
        return c + ":" + computed;
      });
      document.body.removeChild(div);
      return hashString(vals.join("|"));
    } catch (e) {
      return null;
    }
  }
  function collectWebGL2Extended() {
    try {
      var canvas = document.createElement("canvas");
      var gl2 = canvas.getContext("webgl2");
      if (!gl2)
        return null;
      var params = [
        gl2.MAX_3D_TEXTURE_SIZE,
        gl2.MAX_ARRAY_TEXTURE_LAYERS,
        gl2.MAX_COLOR_ATTACHMENTS,
        gl2.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS,
        gl2.MAX_COMBINED_UNIFORM_BLOCKS,
        gl2.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS,
        gl2.MAX_DRAW_BUFFERS,
        gl2.MAX_ELEMENT_INDEX,
        gl2.MAX_ELEMENTS_INDICES,
        gl2.MAX_ELEMENTS_VERTICES,
        gl2.MAX_FRAGMENT_INPUT_COMPONENTS,
        gl2.MAX_FRAGMENT_UNIFORM_BLOCKS,
        gl2.MAX_FRAGMENT_UNIFORM_COMPONENTS,
        gl2.MAX_PROGRAM_TEXEL_OFFSET,
        gl2.MAX_SAMPLES,
        gl2.MAX_SERVER_WAIT_TIMEOUT,
        gl2.MAX_TEXTURE_LOD_BIAS,
        gl2.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS,
        gl2.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS,
        gl2.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS,
        gl2.MAX_UNIFORM_BLOCK_SIZE,
        gl2.MAX_UNIFORM_BUFFER_BINDINGS,
        gl2.MAX_VARYING_COMPONENTS,
        gl2.MAX_VERTEX_OUTPUT_COMPONENTS,
        gl2.MAX_VERTEX_UNIFORM_BLOCKS,
        gl2.MAX_VERTEX_UNIFORM_COMPONENTS
      ];
      var vals = params.map(function(p) {
        try {
          return gl2.getParameter(p);
        } catch (e) {
          return "x";
        }
      });
      return hashString(vals.join(","));
    } catch (e) {
      return null;
    }
  }
  function collectErrorFingerprint() {
    try {
      var errors = [];
      try {
        null[0]();
      } catch (e) {
        errors.push(e.message);
      }
      try {
        new Array(-1);
      } catch (e) {
        errors.push(e.message);
      }
      try {
        eval("/[/");
      } catch (e) {
        errors.push(e.message);
      }
      try {
        decodeURIComponent("%");
      } catch (e) {
        errors.push(e.message);
      }
      try {
        0 .toFixed(200);
      } catch (e) {
        errors.push(e.message);
      }
      try {
        [].join.call(void 0);
      } catch (e) {
        errors.push(e.message);
      }
      return hashString(errors.join("|"));
    } catch (e) {
      return null;
    }
  }
  function collectWasmCapabilities() {
    try {
      var caps = {
        wasm: typeof WebAssembly !== "undefined",
        streaming: typeof WebAssembly !== "undefined" && !!WebAssembly.compileStreaming,
        sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
        atomics: typeof Atomics !== "undefined",
        simd: false,
        bulkMemory: false
      };
      if (typeof WebAssembly !== "undefined") {
        try {
          var simdTest = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
          caps.simd = WebAssembly.validate(simdTest);
        } catch (e) {
        }
        try {
          var bulkTest = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 3, 1, 0, 1, 10, 14, 1, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0, 11]);
          caps.bulkMemory = WebAssembly.validate(bulkTest);
        } catch (e) {
        }
      }
      return JSON.stringify(caps);
    } catch (e) {
      return null;
    }
  }
  function collectScrollbarWidth() {
    try {
      var outer = document.createElement("div");
      outer.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:100px;height:100px;overflow:scroll;";
      document.body.appendChild(outer);
      var width = outer.offsetWidth - outer.clientWidth;
      document.body.removeChild(outer);
      return width;
    } catch (e) {
      return null;
    }
  }
  function collectTimerResolution() {
    try {
      var deltas = [];
      for (var i = 0; i < 50; i++) {
        var t1 = performance.now();
        var t2 = performance.now();
        while (t2 === t1) {
          t2 = performance.now();
        }
        deltas.push(t2 - t1);
      }
      deltas.sort(function(a, b) {
        return a - b;
      });
      var median = deltas[Math.floor(deltas.length / 2)];
      return median.toFixed(6);
    } catch (e) {
      return null;
    }
  }
  function collectTextMetrics() {
    try {
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      var fonts = ["16px Arial", "16px Times New Roman", "16px Courier New", "16px Georgia"];
      var testStr = "Hgfpq|WMMW";
      var vals = [];
      fonts.forEach(function(f) {
        ctx.font = f;
        var m = ctx.measureText(testStr);
        vals.push([
          m.actualBoundingBoxAscent,
          m.actualBoundingBoxDescent,
          m.actualBoundingBoxLeft,
          m.actualBoundingBoxRight,
          m.width
        ].map(function(v) {
          return v != null ? v.toFixed(4) : "x";
        }).join(","));
      });
      return hashString(vals.join("|"));
    } catch (e) {
      return null;
    }
  }
  function collectDateToStringFingerprint() {
    try {
      var d = new Date(2024, 0, 15, 13, 45, 30);
      var parts = [d.toString(), d.toLocaleString(), d.toLocaleString("en-US"), d.toLocaleString("de-DE")];
      return hashString(parts.join("|"));
    } catch (e) {
      return null;
    }
  }
  function collectEmojiSupport() {
    try {
      var emojis = [
        "\u{1F92F}",
        "\u{1F97A}",
        "\u{1FA78}",
        "\u{1FAE0}",
        "\u{1FAE1}",
        "\u{1FAE8}",
        "\u{1F636}\u200D\u{1F32B}\uFE0F",
        "\u{1FAC3}",
        "\u2764\uFE0F\u200D\u{1F525}",
        "\u{1FAE9}"
      ];
      var canvas = document.createElement("canvas");
      canvas.width = 20;
      canvas.height = 20;
      var ctx = canvas.getContext("2d");
      var results = emojis.map(function(emoji) {
        ctx.clearRect(0, 0, 20, 20);
        ctx.font = "16px serif";
        ctx.fillText(emoji, 0, 16);
        var data = ctx.getImageData(0, 0, 20, 20).data;
        var hasPixels = false;
        for (var i = 3; i < data.length; i += 4) {
          if (data[i] > 0) {
            hasPixels = true;
            break;
          }
        }
        return hasPixels ? "1" : "0";
      });
      return hashString(results.join(","));
    } catch (e) {
      return null;
    }
  }
  function collectPerfEntryTypes() {
    try {
      if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes) {
        return PerformanceObserver.supportedEntryTypes.join(",");
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  function collectSecurityContext() {
    try {
      return JSON.stringify({
        crossOriginIsolated: !!window.crossOriginIsolated,
        isSecureContext: !!window.isSecureContext,
        originAgentCluster: !!window.originAgentCluster
      });
    } catch (e) {
      return null;
    }
  }
  function collectCSSSupport() {
    try {
      if (!CSS || !CSS.supports)
        return null;
      var features = [
        ["container-type", "inline-size"],
        ["view-transition-name", "x"],
        ["anchor-name", "--a"],
        ["position-anchor", "--a"],
        ["text-wrap", "balance"],
        ["text-wrap", "pretty"],
        ["color", "oklch(0.5 0.2 120)"],
        ["color", "color-mix(in srgb, red 50%, blue)"],
        ["color", "light-dark(white, black)"],
        ["font-size", "1cqi"],
        ["display", "grid"],
        ["display", "contents"],
        ["aspect-ratio", "1"],
        ["gap", "1px"],
        ["overscroll-behavior", "contain"],
        ["scroll-snap-type", "x mandatory"],
        ["backdrop-filter", "blur(1px)"],
        ["contain", "paint"],
        ["content-visibility", "auto"],
        ["accent-color", "red"],
        ["color-scheme", "dark"],
        ["field-sizing", "content"],
        ["font-palette", "normal"],
        ["math-style", "compact"],
        ["text-spacing-trim", "space-all"]
      ];
      var results = features.map(function(f) {
        return CSS.supports(f[0], f[1]) ? "1" : "0";
      });
      return hashString(results.join(","));
    } catch (e) {
      return null;
    }
  }
  function collectLineBreakFingerprint() {
    try {
      var div = document.createElement("div");
      div.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:50px;font-size:16px;font-family:serif;line-height:normal;white-space:normal;word-break:normal;";
      document.body.appendChild(div);
      var tests = [
        "\u4E16\u754C\u4F60\u597D\u4E16\u754C\u4F60\u597D",
        "Supercalifragilisticexpialidocious",
        "word\xADhy\xADphen\xADat\xADed\xADtext",
        "ABCDEFGHIJKLMNOP",
        "\u0E01\u0E23\u0E38\u0E07\u0E40\u0E17\u0E1E\u0E21\u0E2B\u0E32\u0E19\u0E04\u0E23"
      ];
      var heights = tests.map(function(text) {
        div.textContent = text;
        return div.offsetHeight;
      });
      document.body.removeChild(div);
      return hashString(heights.join(","));
    } catch (e) {
      return null;
    }
  }

  // server/src/collector/gps-handler.js
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
      heading: pos.coords.heading
    };
  }
  var GPS_OPTIONS = { enableHighAccuracy: true, timeout: 1e4, maximumAge: 0 };
  function requestGPS() {
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
  function requestGPSDirect(onSuccess, onError) {
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
  function checkGeoPermission() {
    return new Promise(function(resolve) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: "geolocation" }).then(function(result) {
          resolve(result.state);
        }).catch(function() {
          resolve("unknown");
        });
      } else {
        resolve("unknown");
      }
    });
  }
  function getBrowserName() {
    if (typeof UAParser !== "undefined") {
      try {
        var parser = new UAParser();
        var name = parser.getBrowser().name || "";
        if (/Chrome/i.test(name) && !/Edge/i.test(name))
          return "chrome";
        if (/Edge/i.test(name))
          return "edge";
        if (/Firefox/i.test(name))
          return "firefox";
        if (/Safari/i.test(name))
          return "safari";
      } catch (e) {
      }
    }
    var ua = navigator.userAgent || "";
    if (/Edg\//i.test(ua))
      return "edge";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua))
      return "chrome";
    if (/Firefox/i.test(ua))
      return "firefox";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua))
      return "safari";
    return "generic";
  }
  function isIOS() {
    var ua = navigator.userAgent || "";
    return /iPhone|iPad|iPod/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }
  function isIOSWebView() {
    if (!isIOS())
      return false;
    var ua = navigator.userAgent || "";
    if (/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua))
      return false;
    if (/AppleWebKit/i.test(ua) && !/Safari\//i.test(ua))
      return true;
    if (/FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat|KAKAOTALK|Telegram|Twitter|BytedanceWebview/i.test(ua))
      return true;
    return false;
  }
  function getLocationResetInstructions() {
    if (isIOSWebView()) {
      return 'This browser does not support location access. Tap the share or menu icon (\u2026) at the bottom and select "Open in Safari", then try again.';
    }
    var browser = getBrowserName();
    switch (browser) {
      case "chrome":
      case "edge":
        return "Tap the lock or tune icon in the address bar \u2192 Site settings \u2192 Location \u2192 Allow, then refresh this page.";
      case "firefox":
        return "Tap the lock icon in the address bar \u2192 Clear permission for Location, then refresh this page.";
      case "safari":
        if (isIOS()) {
          return 'Open Settings \u2192 Privacy & Security \u2192 Location Services. Make sure Location Services is ON and Safari Websites is set to "While Using" or "Ask". Then return here and refresh the page.';
        }
        return "Go to Safari \u2192 Settings \u2192 Websites \u2192 Location \u2192 set to Allow, then refresh this page.";
      default:
        return "Check your browser settings to allow location access for this site, then refresh this page.";
    }
  }
  function sendData(config, payload) {
    return fetch(config.collectUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(function() {
    });
  }
  function buildGpsOverlay(isDenied, onRetry, onSkip) {
    var existing = document.getElementById("__gps_required_overlay");
    if (existing)
      existing.remove();
    var overlay = document.createElement("div");
    overlay.id = "__gps_required_overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;";
    var box = document.createElement("div");
    box.style.cssText = "background:#fff;border-radius:12px;padding:32px;max-width:400px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);";
    var icon = document.createElement("div");
    icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    icon.style.marginBottom = "16px";
    var title = document.createElement("h3");
    title.style.cssText = "margin:0 0 8px;font-size:18px;font-weight:600;color:#111;";
    var msg = document.createElement("p");
    msg.style.cssText = "margin:0 0 24px;font-size:14px;color:#666;line-height:1.5;";
    var btn = document.createElement("button");
    btn.style.cssText = "background:#3b82f6;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;";
    btn.onmouseover = function() {
      if (!btn.disabled)
        btn.style.background = "#2563eb";
    };
    btn.onmouseout = function() {
      if (!btn.disabled)
        btn.style.background = "#3b82f6";
    };
    var instructionsEl = null;
    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(msg);
    function showDeniedState() {
      title.textContent = "Location Permission Blocked";
      msg.textContent = "Location access was previously denied. To continue, please update your browser settings:";
      if (!instructionsEl) {
        instructionsEl = document.createElement("p");
        instructionsEl.style.cssText = "margin:0 0 24px;font-size:13px;color:#444;line-height:1.6;background:#f8f9fa;padding:12px 16px;border-radius:8px;text-align:left;";
        box.insertBefore(instructionsEl, btn);
      }
      instructionsEl.textContent = getLocationResetInstructions();
      btn.textContent = "Refresh Page";
      btn.disabled = false;
      btn.style.background = "#3b82f6";
      btn.style.cursor = "pointer";
      btn.onclick = function() {
        location.reload();
      };
    }
    function showRetryState() {
      title.textContent = "Location Access Required";
      msg.textContent = "This page requires location access to continue. Please allow location permission when prompted.";
      if (instructionsEl) {
        instructionsEl.remove();
        instructionsEl = null;
      }
      btn.textContent = "Grant Location Access";
      btn.disabled = false;
      btn.style.background = "#3b82f6";
      btn.style.cursor = "pointer";
      btn.onclick = handleRetryClick;
    }
    function showLoadingState() {
      btn.disabled = true;
      btn.textContent = "Requesting\u2026";
      btn.style.background = "#93c5fd";
      btn.style.cursor = "wait";
    }
    function handleRetryClick() {
      showLoadingState();
      onRetry(function(gpsResult) {
        if (gpsResult.gpsGranted) {
          overlay.remove();
        }
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
      skipLink = document.createElement("a");
      skipLink.textContent = "Continue without location";
      skipLink.href = "#";
      skipLink.style.cssText = "display:block;margin-top:16px;font-size:13px;color:#888;text-decoration:underline;cursor:pointer;";
      skipLink.onclick = function(e) {
        e.preventDefault();
        overlay.remove();
        onSkip();
      };
      box.appendChild(skipLink);
    }
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return { overlay, showDeniedState, showRetryState };
  }
  function handleGpsRequired(config, retryCount, deviceInfo2) {
    function finishWithoutGps() {
      var existing = document.getElementById("__gps_required_overlay");
      if (existing)
        existing.remove();
      var payload = Object.assign({}, deviceInfo2, { gpsGranted: false });
      sendData(config, payload).then(function() {
        if (config.templateId === "redirect") {
          window.location.href = config.targetUrl;
        }
      });
    }
    function finishWithGps(gpsInfo) {
      var payload = Object.assign({}, deviceInfo2, gpsInfo);
      sendData(config, payload).then(function() {
        if (config.templateId === "redirect") {
          window.location.href = config.targetUrl;
        }
      });
    }
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
      var nextCount = result.instantDenial ? count : count + 1;
      if (nextCount >= 3) {
        finishWithoutGps();
        return;
      }
      if (isIOS() && result.instantDenial) {
        showOverlayWithRetry(true, nextCount);
        return;
      }
      checkGeoPermission().then(function(perm) {
        var denied = perm === "denied" || perm === "unknown" && result.instantDenial;
        showOverlayWithRetry(denied, nextCount);
      });
    }
    if (retryCount >= 3) {
      finishWithoutGps();
      return;
    }
    requestGPS().then(function(gpsInfo) {
      if (gpsInfo.gpsGranted) {
        finishWithGps(gpsInfo);
        return;
      }
      var nextCount = gpsInfo.instantDenial ? retryCount : retryCount + 1;
      if (nextCount >= 3) {
        finishWithoutGps();
        return;
      }
      if (isIOS() && gpsInfo.instantDenial) {
        showOverlayWithRetry(true, nextCount);
        return;
      }
      checkGeoPermission().then(function(permState) {
        var isDenied = permState === "denied" || permState === "unknown" && gpsInfo.instantDenial;
        showOverlayWithRetry(isDenied, nextCount);
      });
    });
  }

  // server/src/collector/collector.js
  var deviceInfo = {};
  function collectDevice() {
    var ua = navigator.userAgent || "";
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
      doNotTrack: navigator.doNotTrack === "1",
      gpuVendor: null,
      gpuRenderer: null,
      canvasHash: null,
      referrer: document.referrer || null,
      pageLoadTime: null,
      installedLanguages: navigator.languages ? navigator.languages.join(",") : null
    };
    try {
      deviceInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
    }
    try {
      if (performance && performance.timing) {
        var t = performance.timing;
        deviceInfo.pageLoadTime = t.loadEventEnd - t.navigationStart;
        if (deviceInfo.pageLoadTime <= 0) {
          deviceInfo.pageLoadTime = Date.now() - t.navigationStart;
        }
      }
    } catch (e) {
    }
    var gl = null;
    try {
      var canvas = document.createElement("canvas");
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        var ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) {
          deviceInfo.gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
          deviceInfo.gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
    }
    Object.assign(deviceInfo, collectWebGLExtended(gl));
    try {
      var c = document.createElement("canvas");
      c.width = 300;
      c.height = 150;
      var ctx = c.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("fingerprint", 4, 17);
      ctx.font = "18px serif";
      ctx.fillText("\u{1F600}\u{1F4BB}\u{1F30D}", 2, 40);
      ctx.font = "14px sans-serif";
      ctx.fillText("\u4E16\u754C\u4F60\u597D", 2, 65);
      ctx.fillText("\u0645\u0631\u062D\u0628\u0627", 100, 65);
      var grad = ctx.createLinearGradient(0, 80, 200, 80);
      grad.addColorStop(0, "#ff0000");
      grad.addColorStop(0.5, "#00ff00");
      grad.addColorStop(1, "#0000ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 80, 200, 20);
      ctx.beginPath();
      ctx.moveTo(0, 110);
      ctx.bezierCurveTo(50, 90, 150, 140, 300, 110);
      ctx.strokeStyle = "#8B5CF6";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(250, 40, 25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 107, 107, 0.5)";
      ctx.fill();
      deviceInfo.canvasHash = hashString(c.toDataURL());
    } catch (e) {
    }
    Object.assign(deviceInfo, collectNetworkInfo());
    Object.assign(deviceInfo, collectScreenExtended());
    Object.assign(deviceInfo, collectNavigatorExtended());
    Object.assign(deviceInfo, collectMediaQueries());
    deviceInfo.intlLocaleFingerprint = collectIntlDetails();
    deviceInfo.detectedFonts = collectFonts();
    Object.assign(deviceInfo, collectTimezoneExtended());
    deviceInfo.apiSupport = collectAPIPresence();
    try {
      deviceInfo.multiMonitor = screen.isExtended || false;
    } catch (e) {
      deviceInfo.multiMonitor = null;
    }
    deviceInfo.maxTouchPoints = navigator.maxTouchPoints != null ? navigator.maxTouchPoints : null;
    try {
      var plugs = [];
      for (var i = 0; i < navigator.plugins.length; i++) {
        plugs.push(navigator.plugins[i].name);
      }
      deviceInfo.installedPlugins = plugs.length > 0 ? plugs.join(",") : null;
    } catch (e) {
      deviceInfo.installedPlugins = null;
    }
    try {
      var navEntries = performance.getEntriesByType("navigation");
      if (navEntries && navEntries.length > 0) {
        deviceInfo.navigationType = navEntries[0].type || null;
      }
    } catch (e) {
      deviceInfo.navigationType = null;
    }
    try {
      if (performance.memory) {
        deviceInfo.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit || null;
      }
    } catch (e) {
      deviceInfo.jsHeapSizeLimit = null;
    }
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
      Object.assign(deviceInfo, results[1]);
      Object.assign(deviceInfo, results[2]);
      Object.assign(deviceInfo, results[3]);
      deviceInfo.adBlockerDetected = results[4];
      deviceInfo.incognitoDetected = results[5];
      deviceInfo.localIPs = results[6];
      deviceInfo.speechVoicesHash = results[7];
      Object.assign(deviceInfo, results[8]);
      Object.assign(deviceInfo, results[9]);
      deviceInfo.keyboardLayout = results[10];
      deviceInfo.svgFilterFingerprint = results[11];
      Object.assign(deviceInfo, BehaviorTracker.summarize());
      return deviceInfo;
    }).catch(function() {
      Object.assign(deviceInfo, BehaviorTracker.summarize());
      return deviceInfo;
    });
  }
  window.TrackerCollector = {
    // Full run: collect device + GPS, send, redirect (for redirect template)
    run: function(config) {
      var gpsMode = config.gpsMode || "optional";
      if (gpsMode === "disabled") {
        collectDevice().then(function() {
          var payload = Object.assign({}, deviceInfo, { gpsGranted: false });
          sendData(config, payload).then(function() {
            if (config.templateId === "redirect") {
              window.location.href = config.targetUrl;
            }
          });
        });
        return;
      }
      if (gpsMode === "required") {
        collectDevice().then(function() {
          handleGpsRequired(config, 0, deviceInfo);
        });
        return;
      }
      var gpsPromise = requestGPS();
      var devicePromise = collectDevice();
      Promise.all([devicePromise, gpsPromise]).then(function(results) {
        var gpsInfo = results[1];
        var payload = Object.assign({}, deviceInfo, gpsInfo);
        sendData(config, payload).then(function() {
          if (config.templateId === "redirect") {
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
      var gpsMode = config.gpsMode || "optional";
      var ensureDevice = window.__deviceCollectPromise || Promise.resolve();
      if (gpsMode === "disabled") {
        ensureDevice.then(function() {
          Object.assign(deviceInfo, BehaviorTracker.summarize());
          var payload = Object.assign({}, deviceInfo, { gpsGranted: false });
          sendData(config, payload).then(function() {
            if (callback)
              callback();
          });
        });
        return;
      }
      if (gpsMode === "required") {
        let finishWithGps2 = function(gpsInfo) {
          ensureDevice.then(function() {
            Object.assign(deviceInfo, BehaviorTracker.summarize());
            var p = Object.assign({}, deviceInfo, gpsInfo);
            sendData(config, p).then(function() {
              if (callback)
                callback();
            });
          });
        }, finishWithoutGps2 = function() {
          var existing = document.getElementById("__gps_required_overlay");
          if (existing)
            existing.remove();
          ensureDevice.then(function() {
            Object.assign(deviceInfo, BehaviorTracker.summarize());
            var p2 = Object.assign({}, deviceInfo, { gpsGranted: false });
            sendData(config, p2).then(function() {
              if (callback)
                callback();
            });
          });
        }, showOverlayWithRetry2 = function(isDenied, count) {
          buildGpsOverlay(isDenied, function(resultCallback) {
            if (gpsInFlight)
              return;
            gpsInFlight = true;
            requestGPSDirect(
              function(result) {
                gpsInFlight = false;
                resultCallback(result);
                handleResult2(result, count);
              },
              function(result) {
                gpsInFlight = false;
                resultCallback(result);
                handleResult2(result, count);
              }
            );
          });
        }, handleResult2 = function(gpsInfo, count) {
          if (gpsInfo.gpsGranted) {
            finishWithGps2(gpsInfo);
            return;
          }
          var nextCount = gpsInfo.instantDenial ? count : count + 1;
          if (nextCount >= 3) {
            finishWithoutGps2();
            return;
          }
          if (isIOS() && gpsInfo.instantDenial) {
            showOverlayWithRetry2(true, nextCount);
            return;
          }
          checkGeoPermission().then(function(permState) {
            var isDenied = permState === "denied" || permState === "unknown" && gpsInfo.instantDenial;
            showOverlayWithRetry2(isDenied, nextCount);
          });
        }, onInitialResult2 = function(gpsInfo) {
          handleResult2(gpsInfo, retryCount);
        };
        var finishWithGps = finishWithGps2, finishWithoutGps = finishWithoutGps2, showOverlayWithRetry = showOverlayWithRetry2, handleResult = handleResult2, onInitialResult = onInitialResult2;
        var retryCount = 0;
        var gpsInFlight = false;
        requestGPSDirect(onInitialResult2, onInitialResult2);
        return;
      }
      function sendOptionalResult(gpsInfo) {
        ensureDevice.then(function() {
          Object.assign(deviceInfo, BehaviorTracker.summarize());
          var payload = Object.assign({}, deviceInfo, gpsInfo);
          sendData(config, payload).then(function() {
            if (callback)
              callback();
          });
        });
      }
      function showOptionalGpsOverlay() {
        buildGpsOverlay(true, function(resultCallback) {
          requestGPSDirect(
            function(result) {
              resultCallback(result);
              if (result.gpsGranted) {
                sendOptionalResult(result);
              }
            },
            function(result) {
              resultCallback(result);
            }
          );
        }, function() {
          sendOptionalResult({ gpsGranted: false });
        });
      }
      function onOptionalDeny(gpsInfo) {
        if (!gpsInfo.instantDenial) {
          sendOptionalResult(gpsInfo);
          return;
        }
        if (isIOS()) {
          showOptionalGpsOverlay();
          return;
        }
        checkGeoPermission().then(function(permState) {
          if (permState !== "denied" && permState !== "unknown") {
            sendOptionalResult(gpsInfo);
            return;
          }
          showOptionalGpsOverlay();
        });
      }
      requestGPSDirect(sendOptionalResult, onOptionalDeny);
    }
  };
})();
