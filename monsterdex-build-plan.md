# MonsterDex — Phased Build Plan

Ordered, dependency-aware milestones for Phase C (build with Claude Code). Each
milestone is a **review checkpoint**: build it, stop, review against the mockups
and the PRD, then proceed. Don't pre-build past the current milestone — boilerplate
is cheap to generate later, and building ahead of a dependency is how the last
attempt drifted.

Reads alongside: `MonsterDex-PRD-v3.md` (behavior), `monsterdex-architecture.md`
(how), `design-tokens.md` (style), `asset-manifest.md` (assets), `catalog.json`.

---

## M1 — Scaffold + catalog render
**Goal:** the app boots, installs nothing risky, and the Catalog tab renders all
88 flavors with the parametric SVG can.

- Vite + Preact + TS project; `base: '/<repo>/'`; tab shell + tab bar (Catalog /
  Dashboard / Profile) with hash-driven tab state; dark theme + design tokens.
- Signals store skeleton; load and type `catalog.json`.
- **Parametric SVG can v2** (PRD §8) — the highest-risk visual; build it here so
  everything else sits on a validated component. Recolors per `accentColor`,
  luminance-aware shading, claw, lid, two-part name lockup.
- Catalog **By-line** layout: open-by-default fixed-width swipe rows + per-line
  collapse; the segmented By-line / A–Z / Z–A toggle; filter chips + search UI
  (wiring can be cosmetic here, live filtering lands with data in M2).

**Decide on sight:** big-line layout for Ultra (20) — swipe row vs. wrapping grid
(deferred here per the brief; same cards either way).

**Checkpoint:** catalog matches `mockup-catalog.png` in structure; SVG cans read well at
card size; tab navigation works. *Depends on: nothing.*

---

## M2 — Detail + rating + IndexedDB
**Goal:** flavors become interactive and state persists.

- Flavor detail view (`mockup-flavor-detail-builtin.png` / `-custom.png`): rating (½-star, tap to set, Clear),
  review, counter (+1, decrement clamped at 0), wishlist; Edit/Delete for customs.
- **IndexedDB layer** (architecture §3): five stores, write-through persistence,
  hydrate on boot. Rating stored as int 1–10 / null; `tried` and "written review"
  computed per PRD §5.3; rating auto-clears wishlist.
- Add/edit/delete custom flavors (`custom-{uuid}`); catalog = built-ins ∪ customs.
- Image resolver: SVG floor + lazy user-photo upgrade (architecture §5); Replace
  photo control; photos compressed into the `photos` store.

**Checkpoint:** rate/review/count/wishlist a flavor, reload, state persists;
catalog reflects tried state and filters live; customs appear as full members.
*Depends on: M1.*

---

## M3 — Dashboard + profile stats
**Goal:** the logged data turns into the dashboard.

- Dashboard (PRD §5.8, `mockup-dashboard.png`): progress (tried X of N, %; customs
  fold into both X and N — no separate "+customs" readout),
  average rating, rating distribution bars, top flavors, by-line table (real-line
  customs fold into their line's tried + total; line-less "Other" customs go in a
  conditional **Custom** bucket row — see §5.8, and note it is *not* a masterable
  line), and (if
  counting on) total cans + most-drunk top 3. Hand-built CSS/SVG, no chart lib.
- Profile header + 2–3 headline stats (`mockup-profile.png`, minus the grid).

**Checkpoint:** every dashboard number reconciles by hand from the logged data;
counter-off hides count stats without deleting them. *Depends on: M2.*

---

## M4 — Achievements engine + glyphs
**Goal:** the 79 badges evaluate, light, and celebrate.

- Engine (architecture §4): one `Snapshot`, `evaluate`, unlock-log diff,
  dynamic vs. permanent lit state, secret reveal, celebration queue.
- Author the **~21 base glyphs** straight from the PRD §5.11 `Glyph` column
  (asset-manifest §5) + the celebration medal (asset-manifest §6).
- Achievements grid (`mockup-profile.png`) + unlock popup (`mockup-badge-unlock.png`) + confetti.

**Checkpoint:** badges light/un-light correctly (delete a rating → completion
un-lights; re-add → re-satisfies, no re-celebration); permanent badges latch on
decrement; secrets show "???"; one action earning several badges queues popups.
*Depends on: M2 (data) and M3 (shared stat derivations).*

**Watch (UX):** the dynamic state-descriptor badges (So Close, NPC Behavior,
Fence Sitter, "No one liked you…", Promises Kept, Anti AI-Slop) un-light when
their condition lapses — by design. Confirm in-app that this *feels* right at
real size: un-lighting a near-miss trophy on the very action that surpasses it
(So Close vanishing the instant you complete the dex) can read as a bug even when
it's rule-correct. The latch *type* is decided in the §5.11 table; this note is
about verifying the felt behavior, not re-deciding it.

---

## M5 — Backup/restore + offline PWA
**Goal:** the app is installable, fully offline, and the data is safe.

- Backup export (share sheet, photos→base64) and **import** with the full
  validation flow + **re-split** round-trip + orphan preservation + auto-undo
  (architecture §7); the "How backups work" guide + changes-since-backup nudge.
- PWA: `vite-plugin-pwa` autoUpdate, precache shell + catalog + font + glyphs +
  icons; install to home screen; the dormant render runtime-cache route.

**Checkpoint (on device):** install to iPhone home screen; launch fully offline;
backup → wipe → restore round-trips every rating, review, count, custom, photo,
and the unlock log with no re-celebration. *Depends on: M2–M4 (all stores exist).*

**Watch (scope):** the render tier is wired but dormant in v1 — keep it to
*wiring* (one resolver branch + one CacheFirst route, per architecture §5). If M5
starts growing an asset-ingestion pipeline, a prefetch scheduler, or
render-management UI for assets that don't exist yet, that's scope creep on a v2
feature — stop and defer.

---

## M6 — Polish
**Goal:** close the gap to the mockups; finalize the estimate-laden values.

- Can SVG v2 **visual refinement** in-app at real size with the bundled font.
- **Hex tuning** — **DONE via a post-M6 user-supplied catalog (2026-06-20), not an
  in-build estimate.** Newt provided finalized colors: 24 `accentColor` values changed,
  **all 88 flipped to `accentConfidence: verified`**, plus a new per-can `clawColor` on 42
  cans. No on-device hex pass remains; Phase D no longer needs a color-verification step.
- Birthday welcome screen (`mockup-birthday.png`) final pass + confetti; first-launch
  trigger + The Origin (architecture §8).
- Finalize `design-tokens.md` against the running app (it's still `EST`-laden).
- Glow/animation/empty-state polish.

**Checkpoint:** visual parity with the mockups; birthday flow fires once on first
launch. *Depends on: M1–M5.*

---

## Then Phase D
Device test, backup round-trip on a second install, final hex + alcoholic
verification, deliver to Bassie.

**Throughout:** surface drift out loud. If a milestone wants something a later one
owns, stop and flag it rather than building ahead.
