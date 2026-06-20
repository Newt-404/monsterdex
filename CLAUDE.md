# CLAUDE.md — MonsterDex

Keystone context for Claude Code. Read this first, every session. The detailed
docs below are the source of truth; this file is the map and the guardrails.

## What this is
MonsterDex is an **offline-first PWA** — a personal birthday gift for one user
("Bassie") to track, rate, and review every Monster Energy flavor ("Untappd for
Monster"). **No backend, no account, no cloud.** All data lives in **IndexedDB**
on his iPhone. Static site on **GitHub Pages**, installed to the home screen.
Three tabs: Catalog, Dashboard, Profile. The mockups are the visual target.

## Stack
Preact + Vite + TypeScript. State via `@preact/signals`. Persistence via `idb`
(IndexedDB). Service worker via `vite-plugin-pwa` (Workbox). Confetti via
`canvas-confetti`. **No router** (hash-driven tab state). **No chart library**
(dashboard is hand-built CSS/SVG). Don't add dependencies beyond this set without
flagging it first. (One build-only **devDependency** was added in M6 with approval:
`sharp`, used solely by `scripts/gen-icons.mjs` to generate the PWA icon PNGs — not a
runtime/bundle dep; the build and deploy don't need it.)

## Commands
```
npm run dev       # vite dev server
npm run build     # tsc --noEmit && vite build  → dist/
npm run preview   # serve the production build locally
```
Deploy: push `dist/` to GitHub Pages (Action on push to main, or `gh-pages`).
**`vite.config.ts` `base` must equal `/<repo>/`** — it drives asset URLs, the PWA
`scope`/`start_url`, and SW registration. Wrong base = silently broken install.

## Layout
```
public/data/catalog.json · public/icons/ · src/styles/fonts/anton.woff2
src/main.tsx · src/app.tsx
src/store/{db,state,backup}.ts        # idb, signals + write-through, backup
src/badges/{defs,snapshot,engine}.ts  # §5.11 as data, derive, evaluate
src/can/                              # parametric SVG can + image resolver
src/views/  src/ui/
```

## Conventions
- **Filenames kebab-case** (`badge-tile.tsx`); components PascalCase in code.
- **Built-in slugs are immutable** once shipped — changing one orphans its user
  record. Custom slugs are `custom-{uuid}`, never hand-authored.
- **Ratings** are integers 1–10 (half-stars ×2) or `null`. Never floats, never a
  0-star — clearing returns to `null`. `tried = rating !== null || count ≥ 1`.
- **Two-part names:** `nameTop` (small) + `nameMain` (large); neither contains the
  word "Monster"; the line is a separate tag.
- **Signals store is the single source of truth** in memory; mutations are
  write-through (update signal, then persist async); hydrate from IndexedDB once
  on boot.
- Badges are **data** in `badges/defs.ts`, not bespoke code.

## Hard don't-do rules
- **No network at runtime for data or images.** Catalog is bundled; SVG cans are
  drawn from data; user photos are IndexedDB blobs; renders (future) are
  precached/prefetched, never fetched on demand.
- **Dark theme only.** No light-mode tokens.
- **`#7CFC00` is UI chrome only** (stars, active states, progress). Per-flavor can
  color comes from the catalog's `accentColor` — never mix the two.
- **Don't read photo blobs to paint the catalog grid** — use `hasPhoto` + lazy,
  viewport-scoped reads. Blobs live in their own store, split from `flavorState`.
- **Celebrations fire once** (unlock log). Never re-celebrate a re-earned badge;
  **imports/restores are silent.**
- **Latching is permanent-badges only.** Completion/mastery badges are dynamic and
  must un-light when an untried flavor appears (PRD §5.11).
- **Import must re-split** base64 photos back into the `photos` store, or photos
  vanish on restore.
- **Don't pre-build past the current milestone** (see build plan); surface drift
  out loud.

## Docs (source of truth)
- `MonsterDex-PRD-v3.md` — behavior. Trust over the mockups on conflict.
- `monsterdex-architecture.md` — stack, IndexedDB schema, SW, image resolver,
  badge engine.
- `monsterdex-build-plan.md` — M1–M6 milestones + review checkpoints.
- `design-tokens.md` — color/type/spacing (still `EST`-laden; finalize in M6).
- `asset-manifest.md` — every asset + status.
- `catalog.json` — 88 flavors, 13 lines. Colors **confirmed** (all `accentConfidence:
  verified`); 42 cans carry a `clawColor` (the can's claw color; falls back to luminance
  ink when absent).
- `deferred-decisions.md` — intentionally postponed/settled UI choices; read
  before flagging "missing"/"off" UI as a bug.
