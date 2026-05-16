import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const backendURL = process.env.VITE_BACKEND_URL || 'http://backend:8000';
const socketURL = process.env.VITE_SOCKET_URL || 'http://backend:9000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@scan': path.resolve(__dirname, '..', 'scan_output'),
    },
  },
  // Force Vite to prebundle every shared dependency at startup. Without this,
  // the first navigation to a page that imports one of these triggers
  // "new dependencies optimized, reloading…" — a full page reload that's the
  // main reason routes feel sluggish.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'frappe-react-sdk',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod',
      'i18next',
      'react-i18next',
      'i18next-http-backend',
      'sonner',
      'lucide-react',
      'echarts',
      'echarts-for-react',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Docker on Windows can't propagate native fs events to the container —
    // poll instead so HMR picks up bind-mounted edits. 500ms × 949 generated
    // files = constant IO; 2000ms is plenty for human edit cadence and cuts
    // watcher CPU by ~75%.
    watch: {
      usePolling: true,
      interval: 2000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    // Pre-transform the top-of-funnel files before the browser asks for them
    // so first paint and first nav don't pay transform cost on the critical path.
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/app/router.tsx',
        './src/app/AppShell.tsx',
        './src/app/providers.tsx',
        './src/components/erp/Sidebar.tsx',
        './src/components/erp/Topbar.tsx',
        './src/components/erp/Footer.tsx',
        './src/components/erp/PageShell.tsx',
        './src/components/erp/DataTable.tsx',
        './src/components/erp/ModuleHub.tsx',
        './src/pages/Dashboard.tsx',
        './src/lib/i18n/index.ts',
      ],
    },
    // Forward the original Host header so Frappe can route to the right site
    // (dev.localhost → dev.localhost site; bare localhost → default_site).
    proxy: {
      '/api': { target: backendURL, changeOrigin: false },
      '/assets': { target: backendURL, changeOrigin: false },
      '/files': { target: backendURL, changeOrigin: false },
      '/private/files': { target: backendURL, changeOrigin: false },
      '/socket.io': { target: socketURL, changeOrigin: false, ws: true },
    },
  },
});
