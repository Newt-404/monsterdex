import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site serves under a subpath, so `base` must equal `/<repo>/`.
// It drives asset URLs AND the PWA scope/start_url (vite-plugin-pwa derives both from
// it) — wrong value = silently broken install. Repo name pending final confirmation
// before the M5 deploy; scaffolded to `/monsterdex/` per the build decision.
// NB: the apple-touch-icon href in index.html is hard-coded to this base — keep in sync.
const BASE = '/monsterdex/';

export default defineConfig({
  base: BASE,
  plugins: [
    preact(),
    VitePWA({
      // Single user → silent updates: a new build's SW activates and takes effect on
      // next launch, no "reload?" prompt (architecture §6).
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Assets referenced outside the manifest (iOS home-screen + browser tab) — kept in
      // the precache so they're available offline. The manifest icons below precache via
      // the workbox png glob.
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'MonsterDex',
        short_name: 'MonsterDex',
        description: 'Track, rate, and review every Monster Energy flavor.',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0B0C',
        theme_color: '#0B0B0C',
        // Optimized PNG set generated in M6 from the master (`npm run gen:icons`,
        // asset-manifest §1). `any` carries the full-bleed squircle at 192/512; the
        // dedicated `maskable` 512 insets the claw into the safe area so Android's mask
        // can't clip it. iOS uses the apple-touch-icon in index.html.
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the shell + catalog.json + bundled Anton font + glyphs + the PNG icon
        // set so the app is fully functional offline from first launch (architecture §6,
        // PRD §7). `jpg` is intentionally excluded so the build-only master `app-icon.jpg`
        // (the gen-icons source) isn't precached; `ico` stays for a possible future favicon.ico.
        globPatterns: ['**/*.{js,css,html,json,woff2,svg,png,ico}'],
        // Dormant render tier (architecture §5/§6): a CacheFirst route for future bundled
        // /renders/*.png. No assets serve it in v1 — wired, not used.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/renders/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'renders',
              expiration: { maxEntries: 200 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
