export function renderNotFoundTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 40px;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #e8e8e8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 40px; height: 40px; fill: #999; }
    h1 { font-size: 24px; font-weight: 500; margin-bottom: 12px; }
    p { font-size: 16px; color: #666; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
    </div>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been removed.</p>
  </div>
</body>
</html>`;
}
