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
      includeAssets: ['icons/app-icon.jpg'],
      manifest: {
        name: 'MonsterDex',
        short_name: 'MonsterDex',
        description: 'Track, rate, and review every Monster Energy flavor.',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0B0C',
        theme_color: '#0B0B0C',
        // Only `any` — the master is a full-bleed squircle with no maskable safe-area
        // padding, so declaring it `maskable` would let Android clip the claw inside the
        // mask. The padded maskable PNG is deferred with the rest of the icon pipeline
        // (asset-manifest §1 / deferred-decisions.md). iOS uses the apple-touch-icon.
        icons: [
          { src: 'icons/app-icon.jpg', sizes: '1254x1254', type: 'image/jpeg', purpose: 'any' },
        ],
      },
      workbox: {
        // Precache the shell + catalog.json + bundled Anton font + glyphs + icons so the
        // app is fully functional offline from first launch (architecture §6, PRD §7).
        // The icon is `.jpg` today; `png`/`ico` are kept deliberately so the deferred
        // multi-size icon set (asset-manifest §1) precaches automatically when it lands.
        globPatterns: ['**/*.{js,css,html,json,woff2,svg,png,jpg,ico}'],
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
