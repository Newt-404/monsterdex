# MonsterDex — Architecture

Lean architecture for the build. Pairs with `MonsterDex-PRD-v3.md` (behavior) and
the asset manifest / design tokens (visuals). Scope: the decisions Claude Code
needs to build correctly without re-deriving them — stack, data model, and the
four systems the handoff brief calls out (service worker, IndexedDB +
backup/restore, image resolution, badge engine).

---

## 1. Stack & rationale

**Preact + Vite + TypeScript.**

- **Preact** (~3 KB) gives a component + reactivity model where it pays off most —
  the 79 live-evaluated badges, the live catalog filters, and the dashboard all
  re-render from state changes for free, instead of hand-wired DOM updates.
- **`@preact/signals`** for state. Fine-grained reactivity means a single rating
  change recomputes only the badge snapshot and the tiles that depend on it — the
  "un-light on change" behavior (PRD §5.11) falls out of the model rather than
  being coded per badge.
- **Vite** for dev/build; **TypeScript** to make the data model (ratings as
  half-star ints, nullable, slug-keyed) self-checking.

**Dependencies — deliberately small (offline-first):**

| Dep | Why |
|-----|-----|
| `vite-plugin-pwa` (Workbox) | Service worker, precache manifest, auto-update |
| `idb` | Tiny promise wrapper over IndexedDB |
| `@preact/signals` | Reactive store |
| `canvas-confetti` | Badge-unlock + birthday confetti (PRD asset-manifest §7) |

No router (3 tabs = hash-driven tab state in the store, so the iOS back gesture
works without a routing lib). No chart library — the dashboard bars and by-line
table are hand-built CSS/SVG (design-tokens §5).

**GitHub Pages footgun (pin this):** a project site serves under a subpath, so set
Vite `base: '/<repo>/'`. Asset URLs, the PWA `scope`/`start_url`, and the SW
registration path all derive from it; getting this wrong breaks the installed PWA
silently. The manifest `display: standalone`, dark theme color, and icons come
from asset-manifest §1.

---

## 2. Project layout

```
monsterdex/
├─ index.html
├─ vite.config.ts            # base, vite-plugin-pwa config
├─ public/
│  ├─ data/catalog.json      # 88 built-ins (precached)
│  └─ icons/                 # pwa icons, favicon (asset-manifest §1)
├─ src/
│  ├─ main.tsx
│  ├─ app.tsx                # tab shell + tab bar
│  ├─ store/                 # signals store + IndexedDB persistence
│  │  ├─ db.ts               # idb open/upgrade, typed accessors
│  │  ├─ state.ts            # signals, hydrate, mutations (write-through)
│  │  └─ backup.ts           # export / validate / import
│  ├─ badges/
│  │  ├─ defs.ts             # BadgeDef[] (the §5.11 table as data)
│  │  ├─ snapshot.ts         # derive aggregate snapshot from state
│  │  └─ engine.ts           # evaluate + unlock-log diff + celebration queue
│  ├─ can/                   # parametric SVG can (PRD §8) + image resolver
│  ├─ views/                 # Catalog, FlavorDetail, Dashboard, Profile, Settings
│  ├─ ui/                    # stars, chips, progress bar, badge tile, popups
│  └─ styles/fonts/anton.woff2  # bundled display font — in src (not public) so
│                            # Vite fingerprints it + emits a base-correct URL
```

---

## 3. Data model (IndexedDB)

One database `monsterdex`, opened via `idb`. The PRD pins the logical record
(§5.3) and backup payload (§5.10); this is how it lands physically.

| Store | Key | Holds |
|-------|-----|-------|
| `flavorState` | `slug` | `{ rating: int 1–10 \| null, review: string, count: int≥0, wishlist: bool, hasPhoto: bool }` — blob-free |
| `photos` | `slug` | `Blob` (compressed/resized user photo) — separate so the grid never reads blobs |
| `customs` | `slug` | custom definition `{ slug, nameMain, nameTop, line, accentColor, alcoholic }` |
| `unlockLog` | `badgeId` | `{ firstEarnedDate }` |
| `kv` | key | settings + meta (below) |

**Key decisions:**

- **Photos split out of `flavorState`.** This is the one deviation from the PRD's
  single logical record, and it's what makes the SVG-first grid (§5) cheap: the
  grid reads only the light `flavorState`, sees `hasPhoto`, and fetches the blob
  lazily for visible cards. Export recombines them into the PRD's payload shape.
- **`flavorState` is sparse** — only flavors the user has touched get a record.
  No record = untried, unrated, count 0. `tried = rating !== null || count ≥ 1`
  (PRD §5.3) is computed, never stored.
- **Catalog at runtime = built-ins (`catalog.json`) ∪ `customs`.** Customs are
  full members (PRD §5.5); the denominator `N` and every badge read this union.
- **`kv` meta:** `schemaVersion`, `counterEnabled`, `firstLaunchDate`,
  `birthdaySeen`, `backupCount`, `lastBackupAt`, `changesSinceBackup` (PRD §5.10).

**Reactivity:** mutations are **write-through** — update the signal store
optimistically (UI reacts instantly), persist to IndexedDB async. On boot,
hydrate signals from the stores once, then run the badge engine silently to set
initial lit state.

---

## 4. Dynamic-badge engine

The §5.11 table is **data, not code** (`badges/defs.ts`). Each badge:

```ts
interface BadgeDef {
  id: string;
  group: BadgeGroup;
  title: string;
  requirement: string;            // human text shown when locked
  secret: boolean;                // "???" until first earned
  kind: 'dynamic' | 'permanent';  // dynamic = lit follows current state; permanent = latches on first earn
  glyph: GlyphId;
  isSatisfied(s: Snapshot): boolean;
}
```

**Evaluation is two-phase and runs after any mutating action** (rate, review,
count, wishlist, add/edit/delete custom, replace photo, backup):

1. **Build one `Snapshot`** — a derived aggregate computed once, so no badge
   scans all flavors. It carries: `triedCount`, `catalogN`, per-line
   `{tried,total}`, `ratedCount`, `fiveStarCount`, `oneStarCount`, `avgRating`,
   `reviewCount`, `reviewLenMax/Min` (over **trimmed non-empty** reviews only —
   per §5.3's "written review"; otherwise "Bare Minimum"'s ≤5-char floor fires on
   any unwritten 0-length review), `totalCans`, `maxSingleFlavorCount`,
   `alcoholicTried`, `alcoholicCans`, `customsCount`, `photoCount`,
   `wishlistOpen/Satisfied`, `everyFlavorRated`, `allRatingsGTE4 / LTE2`. The single pass also derives the
   **coupled per-flavor predicates** that scalar aggregates can't express:
   `hasHateDrinkFlavor` (some flavor with `count ≥ 10` **and** `rating ≤ 2★`),
   `distinctHalfStarValues` (set of ½-star values used → Balanced Palate), and an
   `allRatedWithin(lo,hi)` helper (→ Fence Sitter's 2.5–3.5★ band) — computed once
   here, never by per-badge scans.
2. **Evaluate + diff.** `satisfiedNow = defs.filter(d => d.isSatisfied(snapshot))`.
   For each newly-satisfied badge **not already in `unlockLog`** → write
   `{firstEarnedDate: now}` and **enqueue a celebration**.

**Display vs. celebration — two separate concepts (this is the subtle part):**

- **`unlockLog`** = first-earned dates. Governs (a) celebrate-once and (b) the lit
  state of **permanent** badges.
- **`satisfiedNow`** = current truth. Governs the lit state of **dynamic** badges,
  which un-light when their condition lapses (delete a rating, add an untried
  custom) and re-light on catch-up — **without** re-celebrating, because the log
  entry already exists (PRD §5.11).
- **Secret** badges show "???" until they appear in `unlockLog` once; after that
  they show their title, with lit state following their `kind`.
- **Permanent latching** also covers the count-decrement edge: decrementing a can
  count below a logged threshold does **not** un-light Dedicated/Tower/etc.
  **Latching is scoped to `kind: permanent` only.** Completion and mastery badges
  are `dynamic` and **must** un-light when an untried flavor appears (PRD §5.11) —
  that is a separate, deliberate mechanism and latch logic never touches them.

**Celebration queue:** multiple badges earned from one action show as sequential
popups (asset-manifest §6 medal), never stacked. **Bulk import is silent** — the
restored log is written as-is and the post-import re-evaluation enqueues nothing
(PRD §5.11).

---

## 5. Image resolution

**Priority (which source wins, PRD §5.7):** user photo → bundled render → SVG can.

**Paint strategy (the part the PRD didn't specify):**

- **SVG is the synchronous floor** — drawn from `accentColor` + names with no
  network and no decode wait, so every card paints instantly and works offline
  from the first frame. Never an empty box or spinner.
- **Upgrade in place** to the highest-priority available source as it resolves,
  into a **fixed-aspect container** (zero layout shift). When the better source is
  warm (cached render / decoded photo) the swap lands within a frame and is
  imperceptible; a short crossfade applies only on a cold first decode.
- **Grid scale:** never read 88 blobs to paint the catalog. The grid uses
  `hasPhoto` to know which few cards to upgrade and reads the blob lazily for
  cards near the viewport (IntersectionObserver). The detail view always resolves
  fully (one can).

**Render tier is wired but dormant in v1** (decision: SVG-only now, official
photos later with no rework). The resolver already checks a render path and a
Workbox **CacheFirst** runtime route + idle background-prefetch (PRD §7) exist for
it — they simply have no assets to serve until renders are dropped into
`/renders` and referenced. No code change needed when they arrive.

---

## 6. Service worker / PWA

- **`vite-plugin-pwa`, `registerType: 'autoUpdate'`** (Workbox `generateSW`).
  Silent update: a new build's SW activates (`skipWaiting` + `clientsClaim`) and
  takes effect on next launch — no "reload?" prompt for a single user.
- **Precache** (works offline from first launch, PRD §7): app shell (JS/CSS/HTML),
  `catalog.json`, the bundled Anton font, badge glyph SVGs, PWA icons. Workbox
  revision hashes handle cache versioning + cleanup per build. (Anton lives in
  `src/styles/fonts` and is imported via CSS, so it's a fingerprinted build asset
  — Workbox picks it up from the build manifest automatically, no manual entry.)
- **Runtime caching:** the dormant CacheFirst route for future renders (§5).
- **iOS caveats (reference, PRD §3 / §11):** the installed instance and a Safari
  tab can hold *separate* IndexedDB stores → the Settings guide tells Bassie to
  use the installed app; iOS may evict local data → mitigated by manual backup.

---

## 7. Backup / restore

**Export** (PRD §5.10 payload): assemble the JSON — recombine `flavorState` +
`photos` (base64) into per-flavor records, plus `customs`, settings, `unlockLog`,
and meta. Deliver via `navigator.share({ files: [json] })` (iOS share sheet) with
an `<a download>` blob fallback. Bump `lastBackupAt` / `backupCount`, reset
`changesSinceBackup`.

**Import — validation flow (the brief wants this nailed):**

1. **Parse** → on failure, "Not a valid MonsterDex backup."
2. **Validate:** `schemaVersion` present and ≤ current; required keys and types
   present; reject with a specific reason rather than partially applying.
3. **Confirm** (dialog states what will happen).
4. **Auto-export current data first** — the one-tap undo (PRD §5.10).
5. **Apply in one IndexedDB transaction:** clear the user stores, then write the
   backup's records **unfiltered** — records whose slug isn't in the current
   catalog are **kept, not dropped** (orphan preservation, PRD §5.10); they
   re-attach if that slug ever appears. Custom *definitions* are restored too, so
   their state records de-orphan immediately.
   **Re-split is mandatory here** — the symmetric inverse of export: each per-flavor
   record's base64 photo is decoded back to a `Blob` and written to the `photos`
   store, `hasPhoto` is set on the (blob-free) `flavorState` record, and the photo
   field is stripped before that record is written. The split store is an internal
   detail; the on-disk backup never sees it, but import must rebuild it or photos
   silently vanish on restore.
6. **Re-hydrate + re-evaluate silently** — no celebrations (every earned badge is
   already in the restored log); `birthdaySeen` is respected so the overlay never
   re-fires.

`schemaVersion < current` runs a forward-migration map before step 5.

---

## 8. First launch / birthday

Decision: **first launch is the moment** — no calendar logic. On boot, if
`firstLaunchDate` is unset: set it to now, show the full-screen birthday overlay
(PRD §5.12, `mockup-birthday.png`), and let **The Origin** enter the unlock log
(`firstEarnedDate = firstLaunchDate`). Set `birthdaySeen` on dismiss so it never
returns; the flag is carried in backups so a restore won't replay it.

---

## 9. Deferred to build (not architecture)

- **Big-line catalog layout** (Ultra = 20): swipe-row vs. wrapping grid — decide
  on sight in M1 (same cards either way).
- **Can SVG v2 visual refinement** — construction locked (PRD §8); refine in M6.
- **Hex tuning** of estimated `accentColor`s — M6 against real can art.
- **Hero renders** — author/source later; the resolver tier is already wired (§5).
