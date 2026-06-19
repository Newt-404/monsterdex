# MonsterDex — Design Tokens

The single source of truth for color, type, spacing, and component styling.
Anything that builds the app reads from here instead of eyeballing the mockups.

**Provenance:** values are either `PINNED` (fixed by PRD v2) or `EST`
(sampled by eye from the mockups — fine-tune freely, they are approximations).
Where the mockups disagree with each other, the canonical choice is noted in
**§8 Open items**.

---

## 1. Color

```css
:root {
  /* Base surfaces */
  --bg:           #0B0B0C; /* PINNED — matte near-black app background */
  --surface-1:    #161617; /* EST  — cards (stat blocks, progress, badge tiles) */
  --surface-2:    #1E1F21; /* EST  — nested controls (review box, +1 bar, wishlist row) */
  --surface-3:    #232427; /* EST  — can thumbnail bg, unselected chip fill */
  --border:       #2A2B2E; /* EST  — hairline borders / dividers */

  /* Accent (UI green — distinct from per-flavor can color) */
  --accent:       #7CFC00; /* PINNED — stars, active states, progress, unlocks */
  --accent-press: #6FE000; /* EST  — pressed/active darker step */
  --on-accent:    #0B0B0C; /* PINNED — text/icons sitting ON a green fill */

  /* Text */
  --text-1:       #F4F5F4; /* EST  — primary / display headings, big numbers */
  --text-2:       #9A9CA0; /* EST  — secondary labels ("YOUR PROGRESS", body) */
  --text-3:       #6A6C70; /* EST  — tertiary ("/90+", locked requirement text) */

  /* States */
  --star-empty:   #3C3D40; /* EST  — empty/outline star */
  --locked:       #54565A; /* EST  — locked badge icon + lock glyph */
  --danger:       #FF453A; /* EST  — destructive (Delete custom flavor) */
  --check:        var(--accent); /* tried check */
  --track:        var(--border);  /* progress / distribution bar track */
}
```

**Per-flavor color is separate.** Each can's body color comes from the
catalog's `accentColor` field and is applied at runtime to the SVG can
(see PRD §8). It is *not* a token here — `--accent` (the green) is the UI
chrome; `accentColor` is per-flavor data.

The small line/category dot on catalog cards uses that same per-flavor
`accentColor`; the word beside it ("ENERGY", "JUICE", "COFFEE") is the
sub-category label in `--text-2`.

---

## 2. Typography

```css
:root {
  /* Display — bundled .woff2 for offline (PRD §8). Heavy condensed. */
  --font-display: "Anton", "Oswald", sans-serif;
  /* Body — native stack, no bundle, reads native on iOS */
  --font-body: -apple-system, "SF Pro Text", system-ui, "Inter", sans-serif;
}
```

| Role            | Font           | Size (EST) | Weight | Notes |
|-----------------|----------------|-----------:|--------|-------|
| Screen title    | display        | 40–48px    | 800    | UPPERCASE, tight tracking (~-0.01em) |
| Big stat number | display        | 56–72px    | 800    | e.g. `3.88`, `147`, `162` |
| Card title      | display / body | 17–18px    | 700    | flavor names, section headers |
| Body / review   | body           | 15–16px    | 400–500| |
| Label / caption | body           | 12–13px    | 600    | UPPERCASE, +tracking (~0.06em) — "YOUR PROGRESS" |

Display font note: Anton gets ~90% of the mockup look. The mockups add
extra letter-tightening and a faint grain texture on some headers (e.g. the
birthday screen) — those are flourishes, not the base face. Swap the display
face later if you want a closer match; everything else stays the same.

---

## 3. Spacing & radii

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;

  --r-tile:   16px; /* badge tiles */
  --r-card:   18px; /* stat / progress cards */
  --r-input:  14px; /* review box, +1 bar, wishlist row */
  --r-button: 14px; /* primary buttons */
  --r-chip:   999px;/* pill: filter chips, segmented toggle */
}
```
Card interior padding: `--space-4` to `--space-5`. Generous, per PRD §9.

---

## 4. Elevation & glow

Surfaces are mostly flat on black; depth comes from the surface-shade ramp,
not drop shadows. Green glow appears **only** on active/interactive elements
(PRD §9).

```css
:root {
  --shadow-can:   0 6px 18px rgba(0,0,0,0.5);          /* under SVG cans */
  --glow-active:  0 0 16px rgba(124,252,0,0.35);       /* buttons, active tab, unlocked tiles */
  --glow-strong:  0 0 28px rgba(124,252,0,0.55);       /* unlock celebration medal */
}
```

---

## 5. Component tokens

**Stars** — filled `--accent`, half = 50% fill, empty = `--star-empty`
outline. ~20px in catalog rows, ~44px on the detail screen.

**Progress / distribution bars** — height ~10px, track `--track`, fill
`--accent` (+ faint `--glow-active`), pill radius.

**Filter chips & segmented toggle**
- Selected: fill `--accent`, text `--on-accent`.
- Unselected: fill transparent, 1px `--border`, text `--text-2`.

**Tab bar** — active icon + label `--accent` with a top indicator line;
inactive `--text-2`.

**Buttons**
- Primary: fill `--accent`, text `--on-accent`, `--r-button`, `--glow-active`. (TAP IN, AWESOME!)
- Ghost: transparent, 1px `--border`, text `--text-1`. (Replace photo)
- Destructive: text + 1px border in `--danger`. (Delete custom)

**Badge tile states**
- Unlocked: `--surface-1`, 1px `--accent` border, colored icon, `--glow-active`, check chip.
- Locked (standard): `--surface-1`, icon in `--locked`, lock glyph, requirement text in `--text-3`.
- Secret: `--surface-1`, `???` in `--locked`, lock glyph.

---

## 6. Iconography (summary — full set lives in the asset manifest)

Badge icons are monochrome SVG glyphs recolored by state (same recolor trick
as the cans): one glyph, tinted `--accent` when unlocked / `--locked` when
not. Motifs match the mockups: claw, single/stacked cans, star(s), trophy,
infinity, globe, camera, etc.

---

## 7. Mode

Dark theme only (PRD §9). No light-mode tokens.

---

## 8. Resolved decisions (was "open items")

1. **Filter-chip "selected" style → RESOLVED: solid `#7CFC00` fill** for any
   selected chip/toggle (consistent everywhere; the mockup's outline "Tried"
   chip is not canonical).
2. **Card surface shade** drifts slightly across screens; canonical values
   are the `--surface-*` ramp in §1.
3. **Display face → RESOLVED: Anton** (bundled `.woff2`), for v1. Revisit only
   if it reads wrong in the real app.

> Status: these values are still **estimate-laden** (the `EST` colors in §1 and
> the type sizes are eyeballed from the mockups). Treat as a working draft —
> finalize against the real app during build polish (M6).
