# MonsterDex — Catalog 82→88 Drift-Fix Log

Date: 2026-06-18. Trigger: the catalog grew from 82 to 88 flavors (slugs + count
now **final**); the five spec docs still referenced 82. This log records every doc
edit made to reconcile them. **No code or catalog data was changed** — docs only.

## Catalog facts (the source of truth all edits derive from)
- **N = 88** built-ins, **13 lines**, **77 energy + 11 alcoholic** (alcoholic unchanged).
- Per-line: Original 14 · Ultra 20 · Juice 14 · Punch 1 · Java 11 · Killer Brew 2 ·
  Rehab 4 · Reserve 4 · Nitro 2 · Hydro 3 · Dragon Tea 2 · The Beast Unleashed 7 ·
  Nasty Beast 4.
- Deltas vs the old 82 table: **Java 5→11, Reserve 5→4, Dragon Tea 1→2** (net +6).
- `accentConfidence`: **17 verified / 71 estimated** (was 65 estimated).
- `uncertain`: **0 entries flagged** (field retained, all `false`).
- Badge set unchanged at **79 badges / ~21 glyphs** (catalog size grew, badge set didn't).

## Decisions locked this session
1. **`uncertain` cleared intentionally** → dropped the uncertain-first prioritization
   from build-plan M6 and the PRD §6 field note. No re-check list to rebuild.
2. **Percentage-milestone rounding = `floor(p·N)`** (Newt's call: floor, easier to earn).
   "Almost There" fires at ⌊0.9·88⌋ = **79/88**. Rule now stated in PRD §5.11 engine rules.

## Edits by file

### CLAUDE.md
- Docs list: `catalog.json — 82 flavors` → **88 flavors**.

### monsterdex-architecture.md
- §2 layout comment: `catalog.json # 82 built-ins` → **88 built-ins**.
- §5 grid scale: "never read 82 blobs" → **88 blobs**.
- (Kept "79 live-evaluated badges" — unchanged.)

### monsterdex-build-plan.md
- M1 goal: "renders all 82 flavors" → **88 flavors**.
- M6 hex-tuning paragraph **rewritten**: 65→**71 estimated**; dropped the
  `uncertain` / "23 flagged" / "3 uncertain-but-verified" prioritization;
  new priority = 11 alcoholic first, then the remaining 60 (Java now 11).
- (Kept "79 badges" in M4 — unchanged.)

### asset-manifest.md
- §8 Data row: `DONE — 82 flavors` → **88 flavors**.
- (Kept "79 PRD §5.11 badges" / "~21 base glyphs" — unchanged.)

### MonsterDex-PRD-v3.md
- §0a: `82 built-in flavors (71 energy + 11 alcoholic)` → **88 (77 energy + 11 alcoholic)**;
  `N = 82` → **N = 88**.
- §0a re-scope note: `82-flavor catalog` / `re-anchored to 82` → **88**.
- §5.11 intro: `82 flavors … 71 energy` → **88 … 77 energy**.
- §5.11 engine rules: added explicit **`floor(p·N)`** rounding for percentage milestones.
- §5.11 per-flavor cap: "top tiers sit at/under 82" → **88**.
- §5.11 badge tables:
  - Halfway Beast 50% **(41 → 44)**
  - Almost There 90% **(74 → ⌊0.9·N⌋ = 79)**
  - Completionist 100% **(82 → 88)**
  - Final Verdict / Who Asked? / Anti AI-Slop "every flavor" **(82 → 88)**
  - High-praise / Critic / Reviews cap headers **(≤ 82 → ≤ 88)**
  - (Last Call "all 11 alcoholic" unchanged.)
- §6 intro: `Compiled: 82 flavors` → **88**.
- §6 `uncertain` field note **rewritten** → "currently unused, all false, retained for compat."
- §6 Totals + per-line table **rebuilt** to the 88-flavor counts above.
- §5.4 progress-string example **fixed**: "tried 105 · 34% of catalog · +3 custom"
  was internally impossible (implied N≈309). Replaced with "tried 50 · 55% of
  catalog" (50 of N = 91 = 88 + 3 customs) — and the **"+N custom" suffix was
  dropped**, since v3 (§0a / §5.5 reversal) folds customs into both the tried
  count and N rather than displaying them separately. Same suffix removed from
  build-plan M3 dashboard line ("+customs" → folded in). Pre-existing drift, not
  82→88 drift, but corrected in the same pass.

### catalog.json
- Unchanged (re-exported under its proper project filename `catalog.json`).

## Not touched (verify if you disagree)
- Mockup placeholder numbers in §0a (94/98/62/47, 312/90+, 162/37, 147/105) — already
  flagged as stale-by-design; left as the historical "these are wrong" list.
- `design-tokens.md` — no catalog count present; nothing to change.
- Badge **count** (79) and glyph count (~21) — unaffected by catalog size.

## Still open (not this session's scope)
- M6 hex tuning of the 71 estimated colors (hexes don't matter for M2).
- M4 will implement the `floor(p·N)` rule when the badge engine is built.
