# MonsterDex — Deferred Decisions & Settled Choices

Running log of choices intentionally **postponed** or **settled** during the build,
so future work and cold reviews don't re-litigate them. **Read this before flagging
"missing" / "off" UI as a bug** — many dashboard/catalog/By-Line details are
deliberate and tracked here.

Last updated: 2026-06-20 (after the M3 cold review).

---

## Deferred to a later milestone (intentional — not bugs)

### Visual / polish → M6 (final polish pass)
- **By-Line claw color** — claws render in UI-green (`--accent`) for every line.
  The mockup tints each claw its line's color. Deferred until the per-flavor /
  per-line accent colors are confirmed against real can art (M6 hex tuning). Do
  **not** tint per line until those colors are locked.
- **Off-token hardcoded px** in `dashboard.css` (the By-Line box especially: gaps,
  font-sizes 9–12px, column widths, the `60px` / `40px` big-stat sizes). To be
  reconciled into `design-tokens.md` during the M6 finalize pass.
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
_None currently._

---

## On-device verification (can't be confirmed off-device)
- Reconcile every dashboard number against Bassie's real IndexedDB data.
- By-Line layout holds at 360px (iPhone SE) — no AVG-column clipping.
- The `count = 1` seed produces a Cans Logged number that reads correctly on device.
