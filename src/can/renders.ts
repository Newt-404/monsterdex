// Bundled official-render tier (architecture §5 / PRD §5.7). Renders live at the
// conventional path /renders/{slug}.png and, when present, are PRECACHED by the
// service worker (M5's Workbox CacheFirst route) — never fetched on demand
// (CLAUDE.md hard rule: no network at runtime for images).
//
// v1 ships no renders, so this manifest is empty and the resolver's render branch
// is dormant: `hasRender` is always false, nothing points at /renders, no request
// is ever made. When real renders are dropped into `public/renders/` and their
// slugs listed here, the middle tier lights up with no other code change.

export const RENDER_MANIFEST: ReadonlySet<string> = new Set<string>();

/** Whether a bundled render exists for this slug (drives the resolver's middle tier). */
export function hasRender(slug: string): boolean {
  return RENDER_MANIFEST.has(slug);
}

/** Conventional render path (resolved against the PWA base). Only ever used for a
 *  slug already in {@link RENDER_MANIFEST}, so it never points at a missing file. */
export function renderUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}renders/${slug}.png`;
}
