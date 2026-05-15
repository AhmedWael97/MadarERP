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
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Docker on Windows can't propagate native fs events to the container —
    // poll instead so HMR picks up bind-mounted edits.
    watch: { usePolling: true, interval: 500 },
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
