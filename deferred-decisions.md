# MonsterDex — Deferred Decisions & Settled Choices

Running log of choices intentionally **postponed** or **settled** during the build,
so future work and cold reviews don't re-litigate them. **Read this before flagging
"missing" / "off" UI as a bug** — many dashboard/catalog/By-Line details are
deliberate and tracked here.

Last updated: 2026-06-20 (after M5 — backup/restore + offline PWA).

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

- **PWA icons = the master JPEG referenced directly, no generation step (yet).**
  `public/icons/app-icon.jpg` is a byte-copy of `mockups/mockup-app-icon.png` (which is
  actually JPEG bytes — a clean 1254×1254 square: black squircle + green claw). The
  manifest references it for `any` only (no `maskable` — the unpadded full-bleed master
  would clip on Android; the padded maskable PNG is deferred below), and `index.html`
  uses it as the iOS `apple-touch-icon`. **The optimized multi-size PNG set (192/512/maskable-padded/
  apple-touch) that asset-manifest §1 marks `BUILD-TIME` is deferred** — generating it
  needs an image-resize tool (sharp / `@vite-pwa/assets-generator`), a new dependency,
  and CLAUDE.md says flag deps first. The direct JPEG gives a correct home-screen install
  now (iOS accepts JPEG apple-touch-icons); the PNG pipeline is an M6 / device-test polish
  item. **Surfaced, not silently skipped.**
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

### Visual / polish → M6 (final polish pass)
- **By-Line claw color** — claws render in UI-green (`--accent`) for every line.
  The mockup tints each claw its line's color. Deferred until the per-flavor /
  per-line accent colors are confirmed against real can art (M6 hex tuning). Do
  **not** tint per line until those colors are locked.
- **Badge glyph visual refinement** (M4 → M6) — the ~21 base glyphs in `glyphs.tsx`
  are functional but rough in places (the **infinity** glyph path especially); the
  per-tier indicators / crowned / loop / per-line claw tint are also unbuilt (see
  the M4 section). Refine glyph shapes + add tier differentiation in the M6 polish
  pass, at real size with the bundled font.
- **Off-token hardcoded px** in `dashboard.css` (the By-Line box especially: gaps,
  font-sizes 9–12px, column widths, the `60px` / `40px` big-stat sizes) **and in
  `profile.css` / `badge-unlock.css`** (achievements grid + unlock popup: type sizes
  `11–34px`, tile `min-height:138px`, art `52px`, check chip `22px`). To be
  reconciled into a real type-scale in `design-tokens.md` during the M6 finalize
  pass. (`--accent-rgb` was tokenised in M4; type sizes are the remaining gap.)
- **Fragile `margin-right:-6px` nudge** on `.byline-tried` (pulls TRIED toward
  AVG) — depends on exact column widths; fine now, revisit with a sturdier
  approach if digit counts / fonts change.

### Features to add later
- **Top Flavors per-row stars** — the mockup shows a ½-star row under each
  top-flavor name; current rows show the number only. To be added later (will also
  retire the now-vestigial `.dash-top .rank-val` CSS in `dashboard.css` at that time).
- **"View all top flavors" link** — currently an inert label (`cursor:default`,
  no handler). To be wired to a destination later (no target screen in v1 yet).
- **"By rating" sort** — `SortMode` includes `'rating'` and `catalogSorted` handles
  it, but no segmented-control button exposes it. Decide later: surface it or
  remove the dead branch.

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

## Pending a decision (not yet resolved)
- **Connoisseur (and other avg-gated) locked-tile progress → decide in M6.** M4
  shows a `current / target` progress line only on integer-count ladders; avg- and
  boolean-gated badges show their requirement text with no progress number. But
  `mockup-profile.png` explicitly renders **"4.3 / 4.5"** under a locked Connoisseur
  tile (a fractional running-average progress). Decide in M6 whether to restore
  fractional-avg progress (Connoisseur, Impossible to Please) to match the mockup,
  or keep the integer-ladder-only rule and accept the divergence. Flagged by the M4
  cold review so it isn't silently dropped.
- **Import: merge vs. overwrite the lifecycle keys (`firstLaunchDate` /
  `birthdaySeen`) → decide when M6 wires first-launch (Newt's call, deferred 2026-06-20).**
  M5 import currently **overwrites** them with the backup's meta (architecture §7
  step 6 restores meta as-is). Harmless today — nothing sets them in ≤M5. But once M6
  records `firstLaunchDate` / sets `birthdaySeen=true` on a device, restoring an older
  backup whose meta has `birthdaySeen:false` would **replay the birthday overlay**, and
  `firstLaunchDate:null` would briefly un-satisfy The Origin (it stays *lit* — permanent
  + restored log). Fix direction when M6 lands: merge (keep the local value if already
  set) rather than overwrite. Flagged by the M5 cold review. *Reset already keeps these
  keys — see the M5 settled section; this is only about the import path.*

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
