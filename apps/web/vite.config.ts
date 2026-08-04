import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const workspaceRoot = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, workspaceRoot, '');
  const apiUrl = env.BASE_URL || 'http://localhost:3000';
  const websocketUrl = apiUrl.replace(/^http/, 'ws');

  return {
    root: __dirname,
    envDir: workspaceRoot,
    plugins: [react()],
    resolve: {
      alias: {
        '@netlogger/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': apiUrl,
        '/c': apiUrl,
        '/t': apiUrl,
        '/ws': {
          target: websocketUrl,
          ws: true,
        },
      },
    },
    build: {
      outDir: path.resolve(workspaceRoot, 'apps/api/static/web'),
      emptyOutDir: true,
    },
  };
});
