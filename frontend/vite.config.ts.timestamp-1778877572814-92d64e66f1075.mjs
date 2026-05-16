// vite.config.ts
import { defineConfig } from "file:///app/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.19_lightningcss@1.32.0/node_modules/vite/dist/node/index.js";
import react from "file:///app/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.19_lightningcss@1.32.0_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///app/node_modules/.pnpm/@tailwindcss+vite@4.3.0_vite@5.4.21_@types+node@22.19.19_lightningcss@1.32.0_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "node:path";
var __vite_injected_original_dirname = "/app";
var backendURL = process.env.VITE_BACKEND_URL || "http://backend:8000";
var socketURL = process.env.VITE_SOCKET_URL || "http://backend:9000";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@scan": path.resolve(__vite_injected_original_dirname, "..", "scan_output")
    }
  },
  // Pre-bundle heavy runtime packages so the dev server doesn't re-transform
  // them on every cold start.  This cuts the first-page TTI significantly.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router-dom",
      "@tanstack/react-query",
      "react-hook-form",
      "frappe-react-sdk",
      "i18next",
      "react-i18next",
      "sonner",
      "lucide-react"
    ]
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Docker on Windows can't propagate native fs events to the container —
    // poll instead so HMR picks up bind-mounted edits.
    watch: { usePolling: true, interval: 500 },
    // Pre-transform a small set of shell files so first navigation is instant.
    // Do NOT include the 370+ generated pages — that overwhelms Vite on startup.
    warmup: {
      clientFiles: [
        "./src/app/*.tsx",
        "./src/components/erp/*.tsx",
        "./src/pages/*.tsx"
      ]
    },
    // Forward the original Host header so Frappe can route to the right site
    // (dev.localhost → dev.localhost site; bare localhost → default_site).
    proxy: {
      "/api": { target: backendURL, changeOrigin: false },
      "/assets": { target: backendURL, changeOrigin: false },
      "/files": { target: backendURL, changeOrigin: false },
      "/private/files": { target: backendURL, changeOrigin: false },
      "/socket.io": { target: socketURL, changeOrigin: false, ws: true }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuY29uc3QgYmFja2VuZFVSTCA9IHByb2Nlc3MuZW52LlZJVEVfQkFDS0VORF9VUkwgfHwgJ2h0dHA6Ly9iYWNrZW5kOjgwMDAnO1xuY29uc3Qgc29ja2V0VVJMID0gcHJvY2Vzcy5lbnYuVklURV9TT0NLRVRfVVJMIHx8ICdodHRwOi8vYmFja2VuZDo5MDAwJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgJ0BzY2FuJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJ3NjYW5fb3V0cHV0JyksXG4gICAgfSxcbiAgfSxcbiAgLy8gUHJlLWJ1bmRsZSBoZWF2eSBydW50aW1lIHBhY2thZ2VzIHNvIHRoZSBkZXYgc2VydmVyIGRvZXNuJ3QgcmUtdHJhbnNmb3JtXG4gIC8vIHRoZW0gb24gZXZlcnkgY29sZCBzdGFydC4gIFRoaXMgY3V0cyB0aGUgZmlyc3QtcGFnZSBUVEkgc2lnbmlmaWNhbnRseS5cbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LWRvbS9jbGllbnQnLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsXG4gICAgICAncmVhY3QtaG9vay1mb3JtJyxcbiAgICAgICdmcmFwcGUtcmVhY3Qtc2RrJyxcbiAgICAgICdpMThuZXh0JyxcbiAgICAgICdyZWFjdC1pMThuZXh0JyxcbiAgICAgICdzb25uZXInLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAvLyBEb2NrZXIgb24gV2luZG93cyBjYW4ndCBwcm9wYWdhdGUgbmF0aXZlIGZzIGV2ZW50cyB0byB0aGUgY29udGFpbmVyIFx1MjAxNFxuICAgIC8vIHBvbGwgaW5zdGVhZCBzbyBITVIgcGlja3MgdXAgYmluZC1tb3VudGVkIGVkaXRzLlxuICAgIHdhdGNoOiB7IHVzZVBvbGxpbmc6IHRydWUsIGludGVydmFsOiA1MDAgfSxcbiAgICAvLyBQcmUtdHJhbnNmb3JtIGEgc21hbGwgc2V0IG9mIHNoZWxsIGZpbGVzIHNvIGZpcnN0IG5hdmlnYXRpb24gaXMgaW5zdGFudC5cbiAgICAvLyBEbyBOT1QgaW5jbHVkZSB0aGUgMzcwKyBnZW5lcmF0ZWQgcGFnZXMgXHUyMDE0IHRoYXQgb3ZlcndoZWxtcyBWaXRlIG9uIHN0YXJ0dXAuXG4gICAgd2FybXVwOiB7XG4gICAgICBjbGllbnRGaWxlczogW1xuICAgICAgICAnLi9zcmMvYXBwLyoudHN4JyxcbiAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvZXJwLyoudHN4JyxcbiAgICAgICAgJy4vc3JjL3BhZ2VzLyoudHN4JyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICAvLyBGb3J3YXJkIHRoZSBvcmlnaW5hbCBIb3N0IGhlYWRlciBzbyBGcmFwcGUgY2FuIHJvdXRlIHRvIHRoZSByaWdodCBzaXRlXG4gICAgLy8gKGRldi5sb2NhbGhvc3QgXHUyMTkyIGRldi5sb2NhbGhvc3Qgc2l0ZTsgYmFyZSBsb2NhbGhvc3QgXHUyMTkyIGRlZmF1bHRfc2l0ZSkuXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzogeyB0YXJnZXQ6IGJhY2tlbmRVUkwsIGNoYW5nZU9yaWdpbjogZmFsc2UgfSxcbiAgICAgICcvYXNzZXRzJzogeyB0YXJnZXQ6IGJhY2tlbmRVUkwsIGNoYW5nZU9yaWdpbjogZmFsc2UgfSxcbiAgICAgICcvZmlsZXMnOiB7IHRhcmdldDogYmFja2VuZFVSTCwgY2hhbmdlT3JpZ2luOiBmYWxzZSB9LFxuICAgICAgJy9wcml2YXRlL2ZpbGVzJzogeyB0YXJnZXQ6IGJhY2tlbmRVUkwsIGNoYW5nZU9yaWdpbjogZmFsc2UgfSxcbiAgICAgICcvc29ja2V0LmlvJzogeyB0YXJnZXQ6IHNvY2tldFVSTCwgY2hhbmdlT3JpZ2luOiBmYWxzZSwgd3M6IHRydWUgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThMLFNBQVMsb0JBQW9CO0FBQzNOLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFIakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxhQUFhLFFBQVEsSUFBSSxvQkFBb0I7QUFDbkQsSUFBTSxZQUFZLFFBQVEsSUFBSSxtQkFBbUI7QUFFakQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsTUFDbEMsU0FBUyxLQUFLLFFBQVEsa0NBQVcsTUFBTSxhQUFhO0FBQUEsSUFDdEQ7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBLEVBR0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQTtBQUFBO0FBQUEsSUFHWixPQUFPLEVBQUUsWUFBWSxNQUFNLFVBQVUsSUFBSTtBQUFBO0FBQUE7QUFBQSxJQUd6QyxRQUFRO0FBQUEsTUFDTixhQUFhO0FBQUEsUUFDWDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUEsSUFHQSxPQUFPO0FBQUEsTUFDTCxRQUFRLEVBQUUsUUFBUSxZQUFZLGNBQWMsTUFBTTtBQUFBLE1BQ2xELFdBQVcsRUFBRSxRQUFRLFlBQVksY0FBYyxNQUFNO0FBQUEsTUFDckQsVUFBVSxFQUFFLFFBQVEsWUFBWSxjQUFjLE1BQU07QUFBQSxNQUNwRCxrQkFBa0IsRUFBRSxRQUFRLFlBQVksY0FBYyxNQUFNO0FBQUEsTUFDNUQsY0FBYyxFQUFFLFFBQVEsV0FBVyxjQUFjLE9BQU8sSUFBSSxLQUFLO0FBQUEsSUFDbkU7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
