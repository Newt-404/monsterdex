import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// GitHub Pages project site serves under a subpath, so `base` must equal
// `/<repo>/`. It drives asset URLs and (later) the PWA scope/start_url —
// wrong value = silently broken install. Repo name pending final confirmation
// before the M5 deploy; scaffolded to `/monsterdex/` per the build decision.
export default defineConfig({
  base: '/monsterdex/',
  plugins: [preact()],
});
