import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base URL untuk deployment (mis. GitHub Pages)
  base: mode === "production" ? "./" : "/",


  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      manifest: false,
      devOptions: { enabled: false },
      filename: "sw.js",
      workbox: {
        importScripts: ["push-handler.js"],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: { cacheName: "html-pages", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes("/assets/"),
            handler: "CacheFirst",
            options: { cacheName: "app-assets", expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query", "@supabase/supabase-js"],
          "vendor-charts": ["recharts"],
        },
      },
    },
  },
}));
