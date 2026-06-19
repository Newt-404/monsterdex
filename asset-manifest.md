# MonsterDex — Asset Manifest

Every visual asset the app needs, its format, source, and status — so the
builder wires things up instead of inventing them. Pairs with
`design-tokens.md` (styling) and the PRD (behavior).

**Fidelity target:** polished, illustrated, clearly on-brand — a big step up
from the flat PRD §8 reference can. Not photoreal (that goes uncanny in SVG).
Hero flavors can use real bundled renders for an exact mockup match.

**Status legend:** `DONE` · `TO-AUTHOR` · `PENDING-RESEARCH` (needs catalog) ·
`BUILD-TIME` (generated during build from a source) · `OPTIONAL`

---

## 1. App & PWA icons
| Asset | Format | Source | Status |
|-------|--------|--------|--------|
| Master app icon | 1024px | `mockup-app-icon.png` (matte tile + green claw) | DONE (source exists) |
| `icon-192`, `icon-512` | PNG | from master | BUILD-TIME |
| `icon-512-maskable` (safe-area padded) | PNG | from master | BUILD-TIME |
| `apple-touch-icon` (180) | PNG | from master | BUILD-TIME |
| `favicon` | ICO/PNG | from master | BUILD-TIME |

---

## 2. Fonts
| Asset | Use | Source | Status |
|-------|-----|--------|--------|
| Anton (`.woff2`) | Display — headings, big numbers | Google Fonts, OFL — **bundle for offline** | TO-AUTHOR (download + self-host) |
| System stack | Body — labels, reviews | `-apple-system, system-ui, …` (no bundle, native iOS look) | DONE (no file) |

Display face is `--font-display` in the tokens. Anton ≈ 90% of the mockup
headers; swap later if a tighter match is wanted.

---

## 3. Can SVG (the core visual) — v2, illustrated
One hand-authored parametric component. Recolors per flavor; no per-flavor files.

**Inputs:** `accentColor`, `nameTop`, `nameMain`, `line`/category, auto `ink`
(near-black or white by accent luminance).

**Anatomy (upgrade over PRD §8):**
- Body shaded with a gradient derived from `accentColor` (dark edge →
  highlight band → dark edge), **luminance-aware** so white/silver/dark cans
  shade into greys, not naive lighten/darken.
- One detailed **claw path** (real-style jagged three-slash), reused on every can.
- Recessed dark **lid** with metallic rim + pull tab.
- Stacked **name lockup**: `nameTop` small, `nameMain` large (auto-fit via
  `textLength`), category beneath — mirrors the mockup typeset look.
- Soft **contact shadow** beneath.

**Status:** TO-AUTHOR. Prototype this first (highest-risk visual). PRD §8 to be
updated to v2 + the two-part name.

---

## 4. Official can renders (hybrid, hero flavors)
| Asset | Format | Source | Status |
|-------|--------|--------|--------|
| Hero-flavor renders (clean front-on, transparent bg) | PNG | manually sourced | OPTIONAL |

Per PRD §5.7/§7: bundle where they exist, background-prefetch while online.
Resolution order = user photo → bundled render → SVG can. Used for the
most-seen flavors so they match the mockup exactly; long tail uses the SVG.

---

## 5. Badge glyphs
Monochrome SVG glyphs, recolored by state (unlocked = `--accent`,
locked = `--locked`) — same recolor trick as the cans. ~21 base glyphs
cover all 79 PRD §5.11 badges via reuse + tier indicators (adds
`alc-can` for the two alcoholic ladders and `heart` for the wishlist badge).

**Base set (TO-AUTHOR):** claw · can-single · cans-3 · cans-5 · cans-pile ·
star · stars-triple · star-broken (critic) · quill (reviews) ·
infinity · globe · camera · shield (backup) · medal/laurel · unicorn · map ·
balance-scale · target · sunrise (origin).

**Badge → glyph + tier mapping:** RESOLVED — the §5.11 re-scope is done and the
mapping now lives in the **PRD §5.11 badge tables** (a `Glyph` column on every
badge). 79 badges map onto ~21 base glyphs via recolor + tier indicators. Author
the glyphs in build M4 straight from that column.

---

## 6. Celebration medal (hero badge)
Richer dedicated SVG for the unlock popup (`mockup-badge-unlock.png`): laurel-wreathed
claw medallion, ribbon, green glow (`--glow-strong`). Status: TO-AUTHOR.

---

## 7. Effects (no asset files)
- Confetti (badge unlock + birthday) → JS lib (e.g. canvas-confetti) or CSS. NONE needed.
- Glows → CSS box-shadow tokens (`--glow-active`, `--glow-strong`). NONE needed.

---

## 8. Data
| Asset | Format | Status |
|-------|--------|--------|
| Catalog | `catalog.json` (slug, line, nameTop, nameMain, accentColor, accentConfidence, markets, aliases, uncertain, alcoholic, source) | DONE — 88 flavors, 13 lines (hexes need M6 tuning) |

---

## 9. Screen → mockup map (the "image manifest")
The mockup file that is ground truth for each screen — **layout and structure
only** (every number/label in them is stale; see PRD §0a). Files live in
`/mockups/`:
- Catalog → `mockup-catalog.png`
- Flavor detail (built-in) → `mockup-flavor-detail-builtin.png`
- Flavor detail (custom, w/ Edit·Delete) → `mockup-flavor-detail-custom.png`
- Dashboard → `mockup-dashboard.png`
- Profile / achievements → `mockup-profile.png`
- Badge-unlock popup → `mockup-badge-unlock.png`
- Birthday welcome → `mockup-birthday.png`
- App icon → `mockup-app-icon.png`

---

## 10. Suggested layout (builder may adjust)
```
/assets/icons     app + pwa icons, favicon
/assets/fonts     anton.woff2
/assets/renders   optional hero-flavor PNGs
/src/can          parametric can component
/src/badges       glyph svgs + medal
/data/catalog.json
```
```
Status roll-up:
  DONE              app-icon source, body font, catalog.json
  TO-AUTHOR         anton bundle, can SVG v2 (refine M6), badge glyphs (M4), medal
  BUILD-TIME        pwa icon sizes, favicon
  RESOLVED          badge→glyph mapping (now in PRD §5.11; author in M4)
  OPTIONAL          hero-flavor renders
```
