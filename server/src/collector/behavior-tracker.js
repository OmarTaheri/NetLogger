// --- Behavioral Biometrics Tracker ---
export var BehaviorTracker = (function() {
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

  // Mouse tracking
  try {
    document.addEventListener('mousemove', function(e) {
      if (mouseSamples.length >= MAX_MOUSE) return;
      var now = Date.now();
      var dt = now - lastMouseTime;
      if (dt < 16) return; // throttle ~60fps
      var dx = e.clientX - lastMouseX;
      var dy = e.clientY - lastMouseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var speed = dt > 0 ? dist / dt : 0;
      var accel = dt > 0 ? Math.abs(speed - lastSpeed) / dt : 0;
      var angle = Math.atan2(dy, dx);
      mouseSamples.push({ speed: speed, accel: accel, angle: angle, dist: dist });
      lastMouseTime = now;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      lastSpeed = speed;
    }, { passive: true });
  } catch(e) {}

  // Click tracking
  try {
    document.addEventListener('mousedown', function(e) {
      clickSamples.push({ time: Date.now(), x: e.clientX, y: e.clientY });
    }, { passive: true });
  } catch(e) {}

  // Scroll tracking
  try {
    var lastScrollTime = 0;
    var lastScrollY = 0;
    window.addEventListener('scroll', function() {
      if (scrollSamples.length >= MAX_SCROLL) return;
      var now = Date.now();
      var dt = now - lastScrollTime;
      if (dt < 50) return;
      var sy = window.scrollY || window.pageYOffset || 0;
      var maxH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
      var depth = maxH > 0 ? (sy / maxH) * 100 : 0;
      var scrollSpeed = dt > 0 ? Math.abs(sy - lastScrollY) / dt : 0;
      var dir = sy > lastScrollY ? 1 : (sy < lastScrollY ? -1 : 0);
      scrollSamples.push({ depth: depth, speed: scrollSpeed, dir: dir });
      lastScrollTime = now;
      lastScrollY = sy;
    }, { passive: true });
  } catch(e) {}

  // Touch tracking
  var activeTouches = {};
  try {
    document.addEventListener('touchstart', function(e) {
      if (touchSamples.length >= MAX_TOUCH) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        activeTouches[t.identifier] = { startTime: Date.now(), pressure: t.force || 0, radiusX: t.radiusX || 0, radiusY: t.radiusY || 0 };
      }
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var start = activeTouches[t.identifier];
        if (start) {
          touchSamples.push({ pressure: start.pressure, radiusX: start.radiusX, radiusY: start.radiusY, duration: Date.now() - start.startTime });
          delete activeTouches[t.identifier];
        }
      }
    }, { passive: true });
  } catch(e) {}

  // Device motion/orientation
  try {
    window.addEventListener('deviceorientation', function(e) {
      if (motionSamples.length >= MAX_MOTION) return;
      motionSamples.push({ type: 'orient', alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    }, { passive: true });
    window.addEventListener('devicemotion', function(e) {
      if (motionSamples.length >= MAX_MOTION) return;
      var a = e.accelerationIncludingGravity || {};
      motionSamples.push({ type: 'motion', x: a.x, y: a.y, z: a.z });
    }, { passive: true });
  } catch(e) {}

  // Focus/blur tracking
  try {
    window.addEventListener('blur', function() {
      blurCount++;
      lastBlurTime = Date.now();
    }, { passive: true });
    window.addEventListener('focus', function() {
      if (lastBlurTime) {
        totalBlurTimeMs += Date.now() - lastBlurTime;
        lastBlurTime = null;
      }
    }, { passive: true });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        if (!lastBlurTime) { blurCount++; lastBlurTime = Date.now(); }
      } else {
        if (lastBlurTime) { totalBlurTimeMs += Date.now() - lastBlurTime; lastBlurTime = null; }
      }
    }, { passive: true });
  } catch(e) {}

  return {
    summarize: function() {
      var result = {};

      // Dwell time
      result.dwellTime = Date.now() - startTime;

      // Mouse data
      if (mouseSamples.length > 0) {
        var totalSpeed = 0, maxSpd = 0, totalAccel = 0;
        var dirs = [0,0,0,0,0,0,0,0]; // 8 direction buckets
        var totalDist = 0;
        for (var i = 0; i < mouseSamples.length; i++) {
          var s = mouseSamples[i];
          totalSpeed += s.speed;
          if (s.speed > maxSpd) maxSpd = s.speed;
          totalAccel += s.accel;
          totalDist += s.dist;
          var bucket = Math.floor(((s.angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
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
        var straightDev = totalDist > 0 ? (n > 1 ? 1 - (Math.sqrt(Math.pow(lastMouseX, 2) + Math.pow(lastMouseY, 2)) / totalDist) : 0) : 0;
        if (straightDev < 0) straightDev = 0;
        var entropy = 0;
        for (var d = 0; d < 8; d++) {
          if (dirs[d] > 0) {
            var p = dirs[d] / n;
            entropy -= p * Math.log2(p);
          }
        }
        result.mouseData = JSON.stringify({
          totalMoves: n,
          avgSpeed: Math.round(avgSpeed * 1000) / 1000,
          maxSpeed: Math.round(maxSpd * 1000) / 1000,
          avgAcceleration: Math.round((totalAccel / n) * 1000) / 1000,
          jitterScore: Math.round(jitter * 1000) / 1000,
          straightLineDeviation: Math.round(straightDev * 1000) / 1000,
          directionEntropy: Math.round(entropy * 1000) / 1000
        });
      } else {
        result.mouseData = null;
      }

      // Click data
      if (clickSamples.length > 0) {
        var intervals = [];
        var dblClicks = 0;
        for (var ci = 1; ci < clickSamples.length; ci++) {
          var gap = clickSamples[ci].time - clickSamples[ci - 1].time;
          intervals.push(gap);
          if (gap < 400) dblClicks++;
        }
        var avgInterval = intervals.length > 0 ? intervals.reduce(function(a, b) { return a + b; }, 0) / intervals.length : 0;
        result.clickData = JSON.stringify({
          totalClicks: clickSamples.length,
          avgTimeBetweenClicks: Math.round(avgInterval),
          doubleClickCount: dblClicks
        });
      } else {
        result.clickData = null;
      }

      // Scroll data
      if (scrollSamples.length > 0) {
        var maxDepth = 0, totalScrollSpeed = 0, dirChanges = 0, prevDir = 0;
        var scrollSpeeds = [];
        for (var si = 0; si < scrollSamples.length; si++) {
          var ss = scrollSamples[si];
          if (ss.depth > maxDepth) maxDepth = ss.depth;
          totalScrollSpeed += ss.speed;
          scrollSpeeds.push(ss.speed);
          if (si > 0 && ss.dir !== 0 && prevDir !== 0 && ss.dir !== prevDir) dirChanges++;
          if (ss.dir !== 0) prevDir = ss.dir;
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
          avgScrollSpeed: Math.round(avgScrollSpd * 1000) / 1000,
          directionChanges: dirChanges,
          smoothnessScore: Math.round(smoothness * 10) / 10
        });
      } else {
        result.scrollData = null;
      }

      // Touch data
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
          avgPressure: Math.round((totalPressure / tn) * 1000) / 1000,
          avgRadiusX: Math.round((totalRX / tn) * 100) / 100,
          avgRadiusY: Math.round((totalRY / tn) * 100) / 100,
          touchCount: tn,
          avgTouchDuration: Math.round(totalDur / tn)
        });
      } else {
        result.touchData = null;
      }

      // Motion data
      var orientSamples = [];
      var accelSamples = [];
      for (var mi = 0; mi < motionSamples.length; mi++) {
        if (motionSamples[mi].type === 'orient') orientSamples.push(motionSamples[mi]);
        else accelSamples.push(motionSamples[mi]);
      }
      if (orientSamples.length > 0 || accelSamples.length > 0) {
        var mData = { hasGyro: orientSamples.length > 0, hasAccel: accelSamples.length > 0 };
        if (orientSamples.length > 0) {
          var aSum = 0, bSum = 0, gSum = 0;
          for (var oi = 0; oi < orientSamples.length; oi++) {
            aSum += (orientSamples[oi].alpha || 0);
            bSum += (orientSamples[oi].beta || 0);
            gSum += (orientSamples[oi].gamma || 0);
          }
          mData.avgAlpha = Math.round((aSum / orientSamples.length) * 100) / 100;
          mData.avgBeta = Math.round((bSum / orientSamples.length) * 100) / 100;
          mData.avgGamma = Math.round((gSum / orientSamples.length) * 100) / 100;
        }
        if (accelSamples.length > 0) {
          var xSum = 0, ySum = 0, zSum = 0;
          for (var ai = 0; ai < accelSamples.length; ai++) {
            xSum += (accelSamples[ai].x || 0);
            ySum += (accelSamples[ai].y || 0);
            zSum += (accelSamples[ai].z || 0);
          }
          mData.avgAccelX = Math.round((xSum / accelSamples.length) * 100) / 100;
          mData.avgAccelY = Math.round((ySum / accelSamples.length) * 100) / 100;
          mData.avgAccelZ = Math.round((zSum / accelSamples.length) * 100) / 100;
        }
        result.motionData = JSON.stringify(mData);
      } else {
        result.motionData = null;
      }

      // Focus data
      if (lastBlurTime) {
        totalBlurTimeMs += Date.now() - lastBlurTime;
        lastBlurTime = null;
      }
      result.focusData = JSON.stringify({
        blurCount: blurCount,
        totalBlurTimeMs: totalBlurTimeMs,
        avgBlurDurationMs: blurCount > 0 ? Math.round(totalBlurTimeMs / blurCount) : 0
      });

      return result;
    }
  };
})();
