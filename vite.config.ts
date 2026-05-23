import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // ── PWA ──────────────────────────────────────────────────
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "placeholder.svg"],
      manifest: {
        name: "Vokabi — Ingliz tilini o'rganing",
        short_name: "Vokabi",
        description:
          "21+ o'yin, AI-powered testlar, Writing & Speaking baholash — IELTS va CEFR imtihonlariga tayyorlaning.",
        theme_color: "#6c47ff",
        background_color: "#0f0f13",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "uz",
        categories: ["education", "language"],
        icons: [
          { src: "/favicon.ico",        sizes: "64x64",   type: "image/x-icon" },
          { src: "/placeholder.svg",    sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/placeholder.svg",    sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Testlar",
            short_name: "Test",
            description: "IELTS mock testlarini boshlash",
            url: "/?start=test",
            icons: [{ src: "/favicon.ico", sizes: "96x96" }],
          },
          {
            name: "O'yinlar",
            short_name: "O'yin",
            description: "Ingliz tili o'yinlari",
            url: "/games",
            icons: [{ src: "/favicon.ico", sizes: "96x96" }],
          },
        ],
        screenshots: [
          {
            src: "https://storage.googleapis.com/gpt-engineer-file-uploads/7G7NqUyL4uWYavHRFEB4odxhxCF3/social-images/social-1773055423739-Screenshot_2026-03-09_162330.webp",
            sizes: "1280x720",
            type: "image/webp",
            form_factor: "wide",
            label: "Vokabi Dashboard",
          },
        ],
      },
      workbox: {
        // Cache strategiyasi
        globPatterns: ["**/*.{js,css,html,ico,svg}"],
        runtimeCaching: [
          {
            // Supabase API — network first (har doim yangi ma'lumot)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // YouTube thumbnails — cache first
            urlPattern: /^https:\/\/img\.youtube\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "youtube-thumbnails",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google Fonts — cache first
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // CDN (cdnjs, fonts) — cache first
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cdn-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
        // Offline fallback
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },

  // ── Build optimizatsiya ───────────────────────────────────
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting — katta kutubxonalarni ajratish
        manualChunks: {
          // React core
          "react-core": ["react", "react-dom", "react-router-dom"],
          // UI components
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
          ],
          // Animation
          "motion": ["framer-motion"],
          // 3D
          "three": ["three"],
          // Data fetching
          "query": ["@tanstack/react-query"],
          // Supabase
          "supabase": ["@supabase/supabase-js"],
        },
      },
    },
    // Chunk size ogohlantirish limiti
    chunkSizeWarningLimit: 1000,
  },

  // ── Dev server ────────────────────────────────────────────
  server: {
    port: 8080,
    host: true,
  },
}));
