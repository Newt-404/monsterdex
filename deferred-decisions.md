# MonsterDex — Deferred Decisions & Settled Choices

Running log of choices intentionally **postponed** or **settled** during the build,
so future work and cold reviews don't re-litigate them. **Read this before flagging
"missing" / "off" UI as a bug** — many dashboard/catalog/By-Line details are
deliberate and tracked here.

Last updated: 2026-06-20 (after M6 — polish: birthday/first-launch, type-scale finalize,
glyph mods, PWA icons; hex tuning + claw tint deferred to Phase D).

---

## M4 — Achievements engine (settled choices — do NOT re-flag)

- **Alcoholic badges are NOT secret** (deliberate PRD override, Newt's call). The 9
  alcoholic badges (5 "flavors tried" + 4 "cans logged") are marked `secret: true`
  in PRD §5.11, but are shown openly in the grid (`secret: false` in `defs.ts`) so
  the alcoholic ladders are visible rather than hidden behind "???". Latch types are
  unchanged. This drops the total secret count from 27 → **18**. The other 18
  funny/secret badges remain hidden as designed.

- **Latch types follow the §5.11 table verbatim.** The build-plan "Watch (UX)"
  note groups So Close / NPC Behavior / Fence Sitter / "No one liked you…" with the
  un-lighting *dynamic* descriptors, but that same note explicitly says the latch
  *type* is decided in the §5.11 table — and the table marks all four `perm`. So
  they **latch** (stay lit after earning, e.g. So Close does NOT vanish on dex
  completion). Only **Promises Kept** and **Anti AI-Slop** in that list are `dyn`.
- **Three badges are wired but dormant** (same pattern as the render tier): **The
  Origin** (needs `firstLaunchDate`, owned by the M6 first-launch flow,
  architecture §8), **Better Safe** / **Hoarder** (need `backupCount`, owned by M5
  backup). Their predicates read snapshot fields that nothing increments in M4, so
  they sit locked/secret until their owning milestone lights them. Not a bug.
- **Glyphs are the ~21 base set only** (asset-manifest §5). Per-tier indicators
  (`+ tier`, `crowned`, `loop`, `"3"`, `all-lines`, per-line claw tint) from the
  PRD `Glyph` column are **not** drawn yet — every badge shows its base glyph.
  Tier/crown/tint differentiation is M6 visual polish.
- **Grid order is PRD §5.11 table order** (groups in sequence; secrets last), not
  the mockup's "unlocked-first" arrangement — stable positions are less jarring as
  badges unlock. The mockup tile *styling* is matched; only the ordering differs.
- **Locked-tile progress is integer count ladders only** (e.g. "19 / 25"). Avg- and
  boolean-gated badges (Connoisseur, Final Verdict-style, completion) show their
  requirement text without a `current / target` line — the mockup's "4.3 / 4.5" on
  Connoisseur (a fractional-avg progress) is deferred.
- **Promises Kept semantics:** satisfied when `wishlistedCount ≥ 5` AND
  `wishlistOpenCount === 0` (≥5 flavors flagged wishlist, none still untried).
  Resolves the architecture §4 `wishlistOpen/Satisfied` fields; reachable via the
  +1 ("Had it") path since rating auto-clears the wishlist flag.
- **Badges evaluate on raw logged data regardless of the counter toggle.** The
  can-count badges read `totalCans` even if the counter UI is hidden (the data still
  exists, per the M3 `count=1`-seed decision). Counter has no Settings UI until M5,
  so this is moot in practice now; revisit if M5 surfaces a reason to gate them.

---

## M5 — Backup/restore + offline PWA (settled choices — do NOT re-flag)

- **PWA icons → RESOLVED in M6: optimized PNG set generated** (the dependency was flagged
  and approved — Newt's call, 2026-06-20). `scripts/gen-icons.mjs` (run via
  `npm run gen:icons`) uses **`sharp`** (a *dev*Dependency) to derive `icon-192`,
  `icon-512`, `icon-512-maskable` (master inset ~78% on the app bg so Android's mask
  can't clip the claw), `apple-touch-icon` (180), and `favicon-32` from the master
  `public/icons/app-icon.jpg`. The PNGs are **committed static files**, so the build
  (`tsc && vite build`) and the GitHub Pages deploy need no image tooling — only
  regeneration does. The manifest now lists the 192/512/maskable PNGs; `index.html`
  points the apple-touch-icon + favicon at the PNGs. The master jpg stays as the source.
  The maskable safe-area inset is **78%** (no doc pins the exact %); fine as chosen,
  revisit only if the claw looks tight inside Android's mask on a real device.
- **`apple-touch-icon` href is hard-coded to the `/monsterdex/` base** in `index.html`
  (Safari ignores the web manifest for the home-screen icon, and Vite doesn't rewrite
  arbitrary `<link>` hrefs). It must track `base` in `vite.config.ts` — both carry a
  comment saying so. Re-confirm when the repo name is finalized pre-deploy.
- **Cancelling the iOS share sheet on export is a silent no-op** — `backupCount` /
  `lastBackupAt` / the change-nudge are bumped only after a *successful* share (or the
  `<a download>` fallback). So Better Safe / Hoarder light on a real saved backup, never
  on a dismissed share sheet.
- **Cancelling the auto-undo export aborts the whole import** ("Import cancelled — your
  data is unchanged"). The one-tap-undo (architecture §7 step 4) is treated as mandatory:
  if the user dismisses its share sheet, nothing is overwritten.
- **Reset data keeps `firstLaunchDate` + `birthdaySeen`** (clears ratings/reviews/counts/
  customs/photos/unlock-log + backup meta). Wiping the lifecycle keys would replay the M6
  birthday overlay on next boot; reset is about the *collection*, not first-launch state.
  Reset re-evaluates silently (suppressed), so emptying the dex throws no confetti.
- **Confirm/validation dialogs use native `window.confirm` / `alert`** (Settings sheet).
  Adequate for a single-user gift app; a styled in-app dialog is not built. The *validation*
  itself is full and specific (architecture §7 steps 1–2) — only the chrome is native.
- **Backup payload `meta.backupCount` / `lastBackupAt` embed the POST-backup values**
  (the new count + timestamp this export creates), so a round-trip restore preserves the
  true count. The undo export embeds current (pre-overwrite) meta verbatim.
- **Desktop `<a download>` fallback always counts a backup** (no cancel signal exists
  for a download, unlike the iOS share sheet). So on desktop, `backupCount` — and thus
  Better Safe / Hoarder — can be "farmed" by repeated downloads. **Accepted, out of
  scope (Newt's call, 2026-06-20):** the target is a single-user iPhone PWA that always
  takes the share-sheet path; the download fallback is a dev/desktop convenience only.

---

## Deferred to a later milestone (intentional — not bugs)

### Visual / polish → M6
- **Catalog colors are now CONFIRMED (post-M6 user update, 2026-06-20).** Newt supplied a
  finalized catalog: 24 `accentColor` values changed, **all 88 flipped to
  `accentConfidence: "verified"`**, plus a new per-can **`clawColor`** field on 42 cans
  (the claw is rendered in `clawColor` when present, else the luminance ink — see
  `can.tsx` `--claw`). **Hex tuning is no longer a Phase-D item.**
- **By-Line claw color (the dashboard table's per-line claw glyph)** — STILL not tinted
  (renders UI-green `--accent` for every line); the mockup tints each per its line color.
  This was blocked on locked colors; now **unblocked** (colors confirmed above) but **not
  requested** in the post-M6 change set, so left as-is. Note: this is the small claw in the
  By-Line dashboard rows — distinct from the per-can `clawColor` (which IS applied).
- **Badge glyph visual refinement** — DONE in M6 (partial-by-design): the **infinity**
  glyph was rebuilt as a clean lemniscate, and the **distinctive named indicators** from
  the PRD §5.11 Glyph column are now drawn via an optional `glyphMod` — **crown**
  (Connoisseur, Apex Predator), **loop** (Regular, One-Track Mind), **"3"** dots (Line
  Hunter), **all-lines ring** (Jack of All Cans). The numeric **"+tier" pips** on the long
  ladders (Decisive, Gold Standard, Hater, …) are **intentionally NOT drawn** — they aren't
  shown in `mockup-profile.png` and have no precise visual spec; the base glyph already
  differs per family. Adding tier pips later is a pure nicety, not a parity gap. Per-line
  claw tint stays with the colors (above).
- **Off-token hardcoded px** — DONE in M6. A finalized type scale (`--fs-*`) lives in
  `tokens.css` and is documented in `design-tokens.md §2`; `dashboard.css`, `profile.css`,
  `badge-unlock.css` (+ the new `birthday.css` and `global.css`) reference the tokens
  instead of literals (values unchanged, except the unlock title 21→22px to share the
  section-title step). The deliberately-dense By-Line micro sizes are now `--fs-micro`
  (11) / `--fs-2xs` (10) — still compact by design. Other views (catalog, detail,
  settings, custom-form) sit on the same ramp and can adopt tokens incrementally.
- **Fragile `margin-right:-6px` nudge** on `.byline-tried` (pulls TRIED toward
  AVG) — depends on exact column widths; fine now, revisit with a sturdier
  approach if digit counts / fonts change.

### Features to add later
- **Top Flavors per-row stars** — the mockup shows a ½-star row under each
  top-flavor name; current rows show the number only. To be added later. (The
  `.dash-top .rank-val` CSS is still live — Top Flavors rows show a value — so it is NOT
  vestigial after the changes below.)

### Resolved in the post-M6 user change set (2026-06-20) — do NOT re-flag
- **"View all top flavors" link → REMOVED; list uncapped.** The inert "view all" label is
  gone and `topFlavors` is no longer sliced to 5 (`stats.ts`) — Top Flavors now shows every
  rated flavor, ranked, and the list fills the card height (`.dash-top .rank-list`
  `flex:1; space-between`) beside the taller By-Line table (changes.md item 4). Most Drunk
  stays top-3 per PRD §5.8.
- **"By rating" sort → RESOLVED: KEPT, moved into the filter-chip row.** No longer in the
  segmented control (which is back to the three PRD §5.1 sorts: By line / A–Z / Z–A). It's
  now a toggle chip beside Tried / Not-tried / Wishlist (`catalog.tsx`): toggles
  `sortMode` between `'rating'` and `'by-line'`, coexists with the filters. PRD §5.1 should
  be updated to mention the rating sort as a chip (doc follow-up; the divergence is now an
  intentional, Newt-approved feature).

---

## Settled — keep as-is (do NOT re-flag as a mockup mismatch)
- **By-Line header "AVG"** (shortened from the mockup's "AVG RATING") — the full
  label didn't fit the narrow column; the number + column convey it's a rating.
- **"Most Drunk"** header (mockup: "Most Drunk (by tries)") — shortened.
- **By-Line per-row avg stars removed** — removed to free width for line names;
  number-only is intentional.
- **By-Line line names wrap to 2 lines** — long names (Killer Brew, Dragon Tea,
  The Beast Unleashed, Nasty Beast) wrap rather than truncate; those rows are
  intentionally taller.
- **By-Line line names use the body font (weight 500)**, not the heavy Anton
  display face — a deliberately lighter look for this table.
- **Right dashboard column wider than left** (`grid-template-columns: 1fr 1.2fr`) —
  intentional, to give the denser right-side panels more room.
- **`setRating` seeds `count = 1`** on a first rating (`state.ts`) — **kept**
  (Newt's call, 2026-06-20). Rationale: you can't rate a flavor you never had, so a
  first rating implies ≥1 can; "Cans Logged" is a best-estimate of cans drunk, not a
  pure tally of +1 taps. **Mitigation:** when the counter is **disabled**, the
  Cans Logged and Most Drunk cards (and the profile Cans Logged headline stat) are
  hidden anyway, so the seeded counts never surface — the count data is preserved,
  just not shown (PRD §5.4 hide-not-delete). Only seeds from count 0; never bumps an
  existing tally; clearing a rating leaves the count alone.

---

## Pending a decision (RESOLVED in M6)
- **Connoisseur (and other avg-gated) locked-tile progress → RESOLVED in M6: restore
  fractional-avg progress** (Newt's call, 2026-06-20). Connoisseur and Impossible to
  Please now carry a `progress` returning `{current: avgRating, target}` (4.5 / 2.5).
  `badge-tile.tsx` renders a non-integer `target` to one decimal ("4.3 / 4.5") while
  integer ladders stay whole ("19 / 25") — one `progress` shape, no format flag. Other
  boolean/completion badges still show requirement text only (unchanged).
- **Import: merge vs. overwrite the lifecycle keys → RESOLVED in M6: merge** (keep local
  if already set). `importBackup` now reads the live `firstLaunchDate` / `birthdaySeen`
  signals before the restore and writes `local ?? backup` / `local || backup`, so
  restoring an older backup never replays the birthday overlay and never un-satisfies
  The Origin. *Reset already keeps these keys (M5 settled section).*

---

## On-device verification (can't be confirmed off-device)
- Reconcile every dashboard number against Bassie's real IndexedDB data.
- By-Line layout holds at 360px (iPhone SE) — no AVG-column clipping.
- The `count = 1` seed produces a Cans Logged number that reads correctly on device.

### M4 — achievements (engine behavior is unit-verified; visuals/feel are not)
- **"Watch (UX)" felt-behavior:** confirm the latching `perm` near-miss trophies
  (So Close, NPC Behavior, Fence Sitter, "No one liked you…") *feel* right when they
  latch on the action that surpasses them — rule-correct per the §5.11 table, but a
  subjective call (build-plan M4 note).
- **Lit-tile appearance + confetti** — accent border / glow / colored glyph / check
  chip and the unlock-popup confetti are verified only from code + mockup, never on a
  real canvas. Watch one badge actually light + celebrate on device.
- **Badge grid at 360px (iPhone SE)** — the 3-up grid + tile text fit without
  clipping column 3 or overflowing on the narrowest screen.
