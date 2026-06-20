# MonsterDex — Product Requirements Document (v3)

## 0a. Changes from v2 (planning reconciliation)
- **Catalog compiled: 88 built-in flavors across 13 lines** (77 energy + 11 alcoholic). See `catalog.json`. The mockups' "312 / 90+" are obsolete placeholders — and so is **every other number and badge name in them**: per-line denominators (94/98/62/47), the badge count (24), the headline stats (Profile shows 162 cans / 37 tried, Dashboard shows 147 / 105), and pre-re-scope labels (the unlock popup's "Flavor Explorer / Tried 10"; final is Collector = 10, Explorer = 25). **Mockups are ground truth for layout and structure only — every value derives from the live catalog (N = 88) and §5.11.**
- **Two-part name + alcoholic flag.** Catalog schema now carries `nameTop` + `nameMain` (replaces the single `name`) and an `alcoholic` boolean. §6 and §8 updated.
- **Alcoholic flavors are full catalog members** — counted in the denominator and all badges; the `alcoholic` flag drives an optional "hide alcoholic" filter and an on-can tag.
- **Catalog layout pinned** (§5.1): By-line = open-by-default horizontal swipe rows of fixed-width cards (no stretch on short lines) with per-line collapse; A–Z / Z–A = flat vertical grid.
- **Can SVG is v2** (§8): cylinder shading derived from `accentColor`, a real-style claw, a proper lid, and a stacked `nameTop`/`nameMain` lockup. Construction validated by prototype; visual refinement happens in build (M6).
- **Display font Anton; selected chips solid green** (§9).
- **§5.11 Achievements — RE-SCOPED & FINAL.** Rebuilt against the 88-flavor / 13-line catalog: physically-unreachable thresholds removed, per-flavor-capped families re-anchored to 88, line mastery spans all 13 lines, plus Phase B additions — **79 badges, ~21 base glyphs**. Badge→glyph mapping (asset-manifest §5) is now unblocked.

## 0. Changes from v1
- **Dynamic catalog denominator.** The progress denominator is now the *current* catalog (built-ins + customs), not a fixed built-in count. This reverses v1 §5.5.
- **Dynamic, non-sticky badges.** Completion and mastery badges un-light when an untried flavor exists and are re-earnable. Celebrations fire **once** (first earn only), governed by a persisted unlock log.
- **New permanent badge "The Launch List"** for clearing the built-in catalog only — the one badge customs can never affect.
- **Milestone definitions pinned.** Relative-named milestones are percentages; number-named milestones are fixed counts.
- **Rating model pinned.** Stored as an integer (half-stars ×2) or `null`; 0.5 floor; no true zero.
- **Images: hybrid.** Bundled official renders where they exist, runtime parametric **SVG** cans as the universal fallback (replaces the v1 image-generation approach for fallback cans).
- **Offline strategy specified** (precache shell + JSON; background-prefetch renders).
- **Backup payload fully enumerated**; import made non-destructive (validate + auto-export + preserve orphans).
- **Single accent green pinned to `#7CFC00`** (replaces the v1 range).
- **Copyright/trademark guard removed** (personal project).
- **New §10 Edge Cases & Failure Modes.**

---

## 1. Summary
MonsterDex is a personal, offline web app (installable to the iPhone home screen) for tracking, rating, and reviewing every Monster Energy flavor — an "Untappd for Monster." It is a one-off birthday gift for a single user, "Bassie." All data lives locally on his device; there is no backend, account, or cloud sync.

## 2. Goals / Non-Goals
**Goals**
- Browse a near-complete catalog of Monster flavors and see each can.
- Rate (½-star precision) and review each flavor; optionally count how many he's had.
- Watch a collection fill up and unlock achievements.
- Feel like a real, native iPhone app, fully offline.

**Non-goals (out of scope)**
- Multiple users, accounts, login.
- Server, database, or cloud sync.
- Social/sharing features.
- Nutrition tracking (caffeine/sugar/calories) — deliberately excluded.

## 3. Platform & Technical Constraints
- Static web app hosted on GitHub Pages. The published site is **publicly reachable by URL** (private Pages requires GitHub Enterprise Cloud); this is acceptable because no user data ever leaves the device.
- PWA: web app manifest + icons + service worker for full offline use after first load.
- Installs to iOS home screen; runs in standalone mode.
- **Storage:** IndexedDB. All ratings, reviews, counts, wishlist flags, custom flavors, user photos, settings, and the achievement unlock log persist locally.
- **Service worker is versioned** with cache-busting so any future code update actually replaces the stale shell rather than serving the old one.
- **iOS storage caveat:** on iOS the Safari tab and the installed (home-screen) instance can hold *separate* IndexedDB stores. Bassie should use the installed instance consistently. iOS may also evict local data if the app is deleted or storage is low — mitigated by the manual backup feature (§5.10) and called out in the backup guide.

## 4. Information Architecture
Bottom tab bar, 3 tabs:
- **Catalog** (default/home)
- **Dashboard**
- **Profile** (Settings opens via a gear icon here)

Flavor detail opens as a pushed screen from Catalog. Birthday welcome is a one-time overlay on first launch.

## 5. Features

### 5.1 Catalog
- All flavors, grouped by product line. **Line order:** Original, Ultra, Juice, Java, Reserve, Rehab, Killer Brew, Nitro, Hydro, Dragon Tea, Punch, The Beast Unleashed, Nasty Beast.
- Pinned search bar — instant local filter over `nameMain`, `nameTop`, and `aliases` (so "Khaos" or "Zero Ultra" resolve). **An active search/filter overrides collapse:** a line with matches shows them even if its section was collapsed; the user's collapse state is restored when the search clears.
- Sort/group toggle: **By line** / **A–Z** / **Z–A** (segmented control). A **"By rating"**
  sort is additionally offered as a toggle chip in the filter row (Tried / Not-tried /
  Wishlist / By rating) — it re-orders by rating (highest first) and coexists with the
  filters; toggling it off returns to the By-line grouping. (Added post-M6, Newt's call.)
- **By-line layout:** every line section is **open by default**; each line is a **horizontal swipe row** of **fixed-width** cards. A short line (e.g. 3 flavors) keeps the same card size and leaves trailing empty space — cards do **not** stretch to fill the width. Each line header has a **collapse toggle**; collapsed/open state persists between visits. (Open: for big lines like Ultra (20), whether the row stays a single long horizontal swipe or wraps into a downward grid is decided on sight during build M1 — same cards either way.)
- **A–Z / Z–A layout:** line grouping is dropped; a flat **vertical grid** of cards, sorted by **`nameMain`** (the displayed flavor name), not `nameTop`+`nameMain`.
- **Filtering/search:** each line's row shows only matching flavors; lines with zero matches hide.
- **Alcoholic flavors** (the `alcoholic` lines) are full members but support an optional **"hide alcoholic"** filter; each alcoholic card carries a small tag.
- Flavor card shows: can image, name, line tag, star rating (if rated), a "tried" indicator, and a wishlist indicator.

### 5.2 Flavor detail
- Large can image with a **Replace photo** control (camera/library).
- Name + line.
- **Rating:** 0.5–5 stars in ½-star increments, tap to set, editable anytime, with an explicit **Clear rating** action (there is no "0-star" rating — clearing returns it to unrated).
- **Review:** optional multiline text.
- **Counter (+1):** shown only if counting is enabled; displays current count with increment/decrement (clamped at 0).
- **Wishlist** toggle.
- Custom flavors additionally show **Edit** and **Delete**.

### 5.3 Data rules
- One user record per flavor, keyed by `slug`:
  - `rating`: integer `1–10` representing half-stars (1 = ½★, 10 = 5★), or `null` if unrated. Rendered as `rating / 2`. Stored as an integer to avoid floating-point drift.
  - `review`: string.
  - `count`: integer ≥ 0.
  - `wishlist`: boolean.
  - `userPhoto`: blob (compressed/resized).
- **"Tried"** = `rating !== null` OR `count ≥ 1`.
- A **written review** (for review badges) = `review` non-empty after trimming whitespace.
- Rating a wishlisted flavor **auto-clears** its wishlist flag.
- **Built-in slugs are immutable** once shipped. Changing a built-in slug would orphan its user record.
- **Custom slugs are namespaced** (`custom-{uuid}`) so they can never collide with a built-in or with each other.

### 5.4 Counter toggle
- On/off in Settings. When off, only the **+1 control** and **count-derived stats** (cans logged, most-drunk) are hidden — never deleted. The **`tried` flag and progress % are unaffected**: a flavor tried via `count ≥ 1` stays tried and keeps counting toward progress and milestones regardless of the toggle (flipping the setting must never silently change the tried count). Count-based achievements already in the unlock log are preserved but hidden from the grid while counting is off.

### 5.5 Custom flavors
- Add with: name, line (picker incl. "Other"), optional photo. Stored with a `custom-{uuid}` slug.
- Custom flavors are editable and deletable; built-ins are not (photo-swap excepted).
- **Custom flavors are full catalog members.** They count toward the catalog denominator and toward every dynamic badge (milestones, completion, line mastery — see §5.11). Progress folds them into **both** the tried count and N — there is **no separate "+N custom" readout** (that was the v1 §5.5 model; reversed in v3, see §0a) — e.g. "tried 50 · 55% of catalog" with N = 91 (88 built-ins + 3 customs).
- Deleting a custom cleanly removes all of its derived contributions (averages, star-count tallies, line stats). If this causes a previously-lapsed badge to re-satisfy, no celebration fires (first-earn-only).

### 5.6 Wishlist
- Per-flavor flag, dedicated catalog filter, auto-clears on rating.

### 5.7 Images
- **Runtime resolution order:** user photo (IndexedDB) → bundled official render (if present) → generated stylized SVG can. In practice that's user photo → SVG for flavors without a bundled render.
- **Hybrid sourcing:** official product renders (clean front-on, transparent/white background) are bundled where they exist; every other flavor uses the parametric SVG can (§8).
- Stylized SVG cans are **rendered at runtime** from `accentColor` + `name` — no image files, fully themeable, scalable.
- The catalog has **no per-flavor image URL**. The `source` field is reference metadata only (where the can art was sourced) and is never fetched at runtime. When a bundled render exists, the resolver finds it by convention at `/renders/{slug}.png`. The running app never fetches images over the network.
- User photos are stored compressed/resized in IndexedDB.

### 5.8 Dashboard
- Collection progress (tried X of N, % + progress bar), where N is the current catalog (built-ins + customs).
- Overall average rating. Any average (overall or per-line) shows `—` when no flavor in scope is rated yet, never `NaN` or `0`.
- Rating distribution: 5 whole-star rows (5★–1★). Half-star ratings bucket by **rounding half-up** to the nearest whole star (3.5★ → 4★), so each row owns its whole star plus the half below it. (The precise average is still computed from raw half-star values — only the distribution bins.)
- Top flavors (highest rated).
- By product line (explored count + average rating per line). A custom assigned to a real line is a **full member** of that line — counted in both its tried count and its total, so a line can read e.g. 21/21. Customs with **no real line** ("Other") collect in a separate **Custom** row, shown only when non-empty and ordered last. That row is a dashboard bucket, **not a 14th masterable line** — it never counts toward [Line] Master, Jack of All Cans, or Apex Predator, which span the 13 real lines only.
- If counting on: total cans logged + top 3 most-drunk.
- **Empty states:** any average computed over zero rated inputs — a line, the Custom row, or the overall average before anything is rated — renders as `—`, never `0` or `NaN`; distribution bars read 0%.

### 5.9 Profile
- "Bassie's MonsterDex" header.
- Snapshot of 2–3 headline stats (flavors tried, cans logged, avg rating).
- Achievements grid (§5.11).
- Gear icon → Settings.

### 5.10 Settings & Backup
- **Counter toggle.**
- **Reset data** (with confirm).
- **Backup — Export:** serializes all data (payload below) to a JSON file (user photos as base64) and opens the iOS **share sheet** (Save to Files / iCloud / AirDrop / email-to-self).
- **Backup — Import:** file picker → **fully validate** the file → confirm → **auto-export current data first** (one-tap undo) → restore. Records whose slug is not in the current catalog are **preserved**, not dropped (they re-attach if that slug ever appears).
- **Guide:** short inline steps + an expandable "How backups work" explainer (what the file is, where it lands on iPhone, restoring on a new phone, and the **use-the-installed-app / Safari-data** warning).
- **Nudge:** in-app reminder ("N changes since your last backup"). No system notifications.

**Backup payload (complete):**
- `schemaVersion` — for validation/migration.
- Flavor records (built-in and custom): `rating`, `review`, `count`, `wishlist`, `userPhoto` (base64).
- Custom flavor definitions: `slug`, `nameMain`, `nameTop`, `line`, `accentColor`, `alcoholic` (defaults false).
- Settings: counter toggle state.
- Achievement unlock log: `{ badgeId: firstEarnedDate }`.
- Meta: first-launch date, birthday-overlay-seen flag, backup count, last-backup timestamp, changes-since-last-backup counter.
- *Excluded:* bundled official renders and stylized SVGs — these are app assets, not user data.

### 5.11 Achievements
Re-scoped against the compiled catalog (88 flavors, 13 lines: 77 energy + 11 alcoholic). **79 badges across ~21 base glyphs.** Mostly achievable, with a few designated moonshots; the funny/secret badges carry the app's voice.

**Engine rules**
- Evaluated live after any relevant action (rate, review, count, add/edit/delete custom, replace photo, wishlist toggle, backup).
- **Dynamic status:** completion/mastery badges reflect the *current* dex. An untried/unrated addition un-lights the affected badge; catching up re-satisfies it.
- **Celebrations fire once** (first-earned date in the unlock log). A badge that lapses and is re-earned does not re-celebrate; restores and bulk imports never re-fire.
- **Locked display:** standard badges show greyed out with their requirement; secret badges show "???".
- **Percentage milestones scale to the current catalog N** (N grows if customs are added) and use **`floor(p·N)`** for the threshold (e.g. 90% at N=88 → ⌊79.2⌋ = 79); **fixed-count milestones are absolute.**
- **Per-flavor cap:** ratings, reviews, 5★ and 1★ counts can never exceed the flavor count (one each per flavor), so their top tiers sit at/under 88. **Cans-logged counts are uncapped.**

**Badge list** — every badge carries a **latch type** — `dyn` (lit follows current state; un-lights when the condition lapses) or `perm` (latches on first earn, never un-lights) — plus optional flags `★` (moonshot) and `secret` ("???" until first earned). `secret` is a *display* attribute, orthogonal to the latch type, so a badge reads e.g. `secret/perm`.

*Milestones — flavors tried (% scales with N):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| First Sip | Try your 1st flavor | dyn | can-single |
| Collector | Try 10 different flavors | dyn | cans-3 |
| Explorer | Try 25 different flavors | dyn | cans-5 |
| Halfway Beast | Try 50% of the catalog (44) | dyn | cans-pile |
| World Tour | Try 50 different flavors | dyn | globe |
| Almost There | Try 90% of the catalog (⌊0.9·N⌋ = 79) | dyn | target |
| **Completionist ★** | Try 100% of the catalog (88) | dyn | medal/laurel |

*Line mastery & breadth:*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| [Line] Master ×13 | Try every flavor in that line | dyn | claw (tinted) |
| Jack of All Cans | Try ≥ 1 flavor from every line (13) | dyn | claw (all-lines) |
| Line Hunter | Master any 3 lines | dyn | claw + "3" |
| **Apex Predator ★** | Master all 13 lines | dyn | claw, crowned |

Lines: Original, Ultra, Juice, Java, Reserve, Rehab, Killer Brew, Nitro, Hydro, Dragon Tea, Punch, The Beast Unleashed, Nasty Beast.

*Built-in completion:*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| The Launch List | Try every built-in flavor as shipped (never affected by customs) | perm | shield/flag |

*Ratings given:*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Rated | Rate 10 flavors | dyn | star |
| Decisive | Rate 50 flavors | dyn | star + tier |
| Final Verdict | Rate every flavor (88) | dyn | star + tier |
| Balanced Palate | Use all ten ½-star values at least once | perm | balance-scale |

*High praise — 5★ given (cap ≤ 88):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| True Love | Give your 1st 5★ | dyn | star |
| Perfectionist | Give 10 × 5★ | dyn | stars-triple |
| Gold Standard | Give 25 × 5★ | dyn | stars-triple + tier |
| Hype Machine | Give 50 × 5★ | dyn | stars-triple + tier |
| Connoisseur | Avg rating ≥ 4.5 across ≥ 20 rated | dyn | star, crowned |

*Critic — 1★ given (≤ 1★, cap ≤ 88):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Critic | Give your 1st 1★ | dyn | star-broken |
| Hater | Give 15 × 1★ | dyn | star-broken + tier |
| Salt Lord | Give 30 × 1★ | dyn | star-broken + tier |
| Nothing Pleases You | Give 50 × 1★ | dyn | star-broken + tier |
| Born to Complain | Give 75 × 1★ | dyn | star-broken + tier |

*Written reviews (cap ≤ 88):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Hot Take | Write your 1st review | dyn | quill |
| Reviewer | Write 10 reviews | dyn | quill + tier |
| Wordsmith | Write 25 reviews | dyn | quill + tier |
| Novelist | Write 50 reviews | dyn | quill + tier |
| Who Asked? | Write a review for every flavor (88) | dyn | quill + tier |

*Cans logged — total (uncapped):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Dedicated | Log 50 cans | perm | cans-pile |
| Monster Forever | Log 250 cans | perm | infinity |
| Tower of Cans | Log 1,000 cans | perm | cans-pile + tier |
| Night Shift Warrior | Log 2,500 cans | perm | cans-pile + tier |
| **Diabetes Speedrun ★** | Log 5,000 cans | perm | cans-pile + tier |

*Cans logged — single flavor (loyalty; uncapped):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Regular | Log 10 of one flavor | perm | can-single, loop |
| Die-hard | Log 50 of one flavor | perm | can-single + tier |
| Obsessed | Log 100 of one flavor | perm | can-single + tier |
| Ride or Die | Log 250 of one flavor | perm | can-single + tier |

*Alcoholic — flavors tried (cap ≤ 11; funny/secret):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| That Tastes Funny | Try your 1st alcoholic flavor | secret/dyn | alc-can |
| Why Am I Dizzy? | Try 3 alcoholic flavors | secret/dyn | alc-can + tier |
| Did This Room Always Spin? | Try 5 alcoholic flavors | secret/dyn | alc-can + tier |
| Texting My Ex | Try 8 alcoholic flavors | secret/dyn | alc-can + tier |
| Last Call | Try all 11 alcoholic flavors | secret/dyn | alc-can + tier |

*Alcoholic — cans logged (uncapped; funny/cynical):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| Liquid Courage | Log 10 alcoholic cans | secret/perm | alc-can |
| It's 5 O'Clock Somewhere | Log 25 alcoholic cans | secret/perm | alc-can + tier |
| Functioning Alcoholic | Log 50 alcoholic cans | secret/perm | alc-can + tier |
| Intervention Pending | Log 100 alcoholic cans | secret/perm | alc-can + tier |

*Funny / secret ("???" until earned):*
| Badge | Requirement | Type | Glyph |
|-------|-------------|------|-------|
| The Origin | Open MonsterDex on day one | secret/perm | sunrise |
| Found a Unicorn | Add a custom flavor | secret/perm | unicorn |
| Cartographer | Add 5 custom flavors | secret/perm | map |
| Say Cheese | Add 10 of your own photos | secret/perm | camera |
| Photographer | Add 50 of your own photos | secret/perm | camera + tier |
| Anti AI-Slop | Add your own photo for every flavor (88) | secret/dyn | camera + tier |
| Better Safe | Create your first backup | secret/perm | shield |
| Hoarder | Keep 5 backups | secret/perm | shield + tier |
| Promises Kept | Try everything on your wishlist (≥ 5 wishlisted) | secret/dyn | heart |
| So Close | Exactly one flavor left untried | secret/perm | target |
| One-Track Mind | Log 50+ of one flavor while < 10 tried total | secret/perm | can-single, loop |
| Hate-Drinker | Log 10+ of a flavor you rated ≤ 2★ | secret/perm | star-broken |
| Impossible to Please | Avg rating < 2.5 across ≥ 20 rated | secret/dyn | star-broken |
| Fence Sitter | ≥ 20 rated and every rating is 2.5–3.5★ | secret/perm | balance-scale |
| NPC Behavior | Every flavor rated, all ratings ≥ 4★ | secret/perm | star |
| No one liked you in school huh? | Every flavor rated, all ratings ≤ 2★ | secret/perm | star-broken |
| Dear Diary | Write a single review over 500 characters | secret/perm | quill |
| Bare Minimum | Write a (non-empty) review of ≤ 5 characters | secret/perm | quill |

**Roll-up.** 79 badges: 7 tried · 16 line mastery & breadth · 1 built-in completion · 4 ratings · 5 high-praise · 5 critic · 5 reviews · 5 total-cans · 4 loyalty · 5 alcoholic-tried · 4 alcoholic-logged · 18 funny/secret. Moonshots: Completionist, Apex Predator, Diabetes Speedrun (The Launch List is a permanent fourth). ~21 base glyphs cover all of them via recolor + tier indicators (asset-manifest §5).

### 5.12 Birthday welcome
- One-time full-screen overlay on first launch; triggers "The Origin" badge; sets the birthday-seen flag so it never reappears.
- Copy: *"Happy birthday, Bassie. The hunt's on: every Monster flavor in existence, waiting to be tasted, rated, and checked off the list. Tap in and start collecting."*

## 6. Catalog Data
The catalog is a single JSON array, one object per flavor, loaded directly by the app. **Compiled: 88 flavors, 13 lines** — see `catalog.json`.

```json
{
  "slug": "ultra-paradise",
  "line": "Ultra",
  "nameMain": "Paradise",
  "nameTop": "Zero Sugar",
  "accentColor": "#9ACA3C",
  "accentConfidence": "verified",
  "markets": "US, EU, UK, AU, NZ, JP, LATAM",
  "aliases": [],
  "uncertain": false,
  "alcoholic": false,
  "source": "https://www.monsterenergy.com/..."
}
```

- `nameMain` is the dominant flavor text on the can body; `nameTop` is the smaller secondary line (descriptor / "Zero Sugar" / "Energy + Juice" / "" if none). Neither ever includes the word "Monster"; the line shows as a separate tag and is not repeated in `nameMain`.
- `accentColor` drives the stylized SVG can (the can body color); required for every flavor. `accentConfidence` is `verified` or `estimated`. **As of the post-M6 update (2026-06-20) every entry is `verified`** — colors confirmed by Newt; no hex tuning remains.
- `clawColor` (optional hex) is the color of the can's claw/logo, for cans whose claw isn't simply the auto-contrast ink (e.g. a black can with a green claw). When absent, the claw uses the luminance-derived ink (near-black or white) as before. Present on 42 of 88 cans. Customs have no `clawColor` (claw falls back to ink).
- `alcoholic` (boolean) marks the Beast lines; full catalog members, but powers the "hide alcoholic" filter + on-can tag (§5.1).
- `uncertain` (boolean) was used to flag entries discontinued in some markets but still produced elsewhere, or otherwise unverified. **Currently unused — every entry is `false`** (the catalog is finalized; confidence is tracked solely via `accentConfidence`). The field is retained in the schema for backward compatibility and possible future re-flagging.
- `markets` and `source` are reference metadata, never fetched at runtime. `aliases` is bundled too and additionally powers local search matching (§5.1) — it is matched in-app, never network-fetched.
- **Totals:** 88 built-ins (77 energy + 11 alcoholic). Per-line counts: Original 14, Ultra 20, Juice 14, Punch 1, Java 11, Killer Brew 2, Rehab 4, Reserve 4, Nitro 2, Hydro 3, Dragon Tea 2, The Beast Unleashed 7, Nasty Beast 4. (Seeds the §5.11 milestone re-scope.)

## 7. Offline & Caching Strategy
- The service worker **precaches the app shell + catalog JSON**, so the app is fully functional offline from first launch.
- Stylized SVG cans cost nothing — drawn at runtime from catalog data.
- Bundled official renders are **background-prefetched** while online (low priority, non-blocking) and cached, so full offline image coverage arrives automatically without requiring Bassie to open every flavor.
- All user data (ratings, reviews, counts, wishlist, customs, photos, settings, unlock log) lives in IndexedDB.

## 8. Stylized Can SVG Template (v2)
A single hand-authored SVG, parameterized by `{COLOR}` (the flavor's `accentColor`), `{NAME_MAIN}`, `{NAME_TOP}`, and the line/category. Geometry is identical for every flavor — only color and text change — so the set is perfectly consistent. The v1 flat reference (flat body + three stroked lines) read as unfinished; v2 is an illustrated can. A 3-case prototype (mid-tone / white-silver / dark) validated the construction; final visual refinement happens in build (M6) at real size with the bundled font.

Anatomy (v2):
- **Body:** rounded rect with **cylinder shading derived from `{COLOR}`** — a dark edge → highlight band → dark edge across the width. Must be **luminance-aware** so white/silver and very dark cans shade into greys rather than naive lighten/darken. (Prototype used flat vertical bands; an actual gradient is fine in the build for smoother shading.)
- **Lid:** recessed near-black top with a metallic rim and a pull tab — not a plain rectangle.
- **Claw:** one detailed **real-style** three-slash path (filled, tapered), reused on every can. Trademark guard is off (personal project), so it may resemble the real Monster claw.
- **Name lockup:** stacked and centered — `{NAME_TOP}` small above, `{NAME_MAIN}` large (auto-fit via `textLength`), category beneath. Excludes "Monster".
- **Shadow:** soft contact ellipse beneath.

Production rules:
- **Name fitting:** `{NAME_MAIN}` uses `textLength` + `lengthAdjust="spacingAndGlyphs"` to fit the body width.
- **Auto-contrast (`{INK}`):** near-black `#0B0B0C` on light/bright accents, white on dark accents, decided by `{COLOR}` luminance — applied to the claw and all can text.
- **Font:** bundle **Anton** (`.woff2`) for offline display use; do not rely on system fonts.
- **Hybrid (§5.7):** a hero flavor may instead use a bundled official render for an exact match; the SVG covers the long tail.

(Reference markup omitted here — the build authors the v2 SVG against this spec and the prototype; the old v1 flat markup is superseded.)

`{INK}` = near-black `#0B0B0C` or white, chosen by `{COLOR}` luminance.

## 9. Visual Design
- **Mood:** Monster-inspired but clean and minimal.
- **Background:** matte/near-black (#0B0B0C-ish) with elevated dark surfaces.
- **Single accent green: `#7CFC00`** — used sparingly for stars, active states, progress, and unlocks across the UI. (This is distinct from per-flavor `accentColor`, which colors the stylized cans.)
- **Type:** **Anton** (bundled, heavy condensed) for display headers + big stat numbers; native system sans for body. See `design-tokens.md`.
- **Components:** rounded dark cards, generous spacing, glowing green accents only on interactive/active elements, ½-star rating control, subtle progress bars, grid of badge tiles. **Selected filter chips/toggles use a solid `#7CFC00` fill** (consistent across all chips).
- Dark theme only.

## 10. Edge Cases & Failure Modes
- **Slug immutability:** never change a built-in slug post-release (orphans user data). Custom slugs are UUID-namespaced to prevent collisions.
- **Integer ratings:** stored as half-star integers (or `null`) to keep "Balanced Palate" (all ten exact values) and the exact-5.0 check reliable.
- **Editing/deleting reviews and ratings:** counts recompute live; badges may un-light. This is intended, and the unlock log prevents re-celebration.
- **Customs in line stats (Option B):** a custom assigned to a line is a full member of it — adding an *untried* custom drops that line to e.g. 20/21 and un-lights its `[Line] Master`. This is intended; built-in completion is tracked separately by **The Launch List**, so the dashboard has no built-in-only per-line view by design. Editing a custom's line (incl. to/from "Other") re-slots its stats between line buckets live and re-evaluates badges — a restore/edit regression case for M4–M5.
- **Destructive import:** validate the whole file first; auto-export current data immediately before replacing; preserve records for unknown slugs rather than deleting them.
- **Photo failures:** resize/compress before storing; a failed photo write must fail in isolation, never aborting the rest of the save.
- **iOS storage split:** Safari vs. installed instance may not share IndexedDB — guide the user to the installed app.
- **Service worker updates:** version the cache so fixes deploy instead of serving a stale shell.
- **Counter toggling:** counts persist through off/on; count-based badges stay in the log but hide from the grid while counting is off.

## 11. Known Caveats (mitigated)
- Catalog completeness is best-effort across global markets → mitigated by custom-add (now full catalog members) and photo-swap.
- iOS can clear local data → mitigated by backup + nudge.
- The hosted app is publicly reachable by URL → acceptable; no user data is exposed (all on-device).

## 12. App Identity
- Name: **MonsterDex**.
- Icon: matte-black tile with a single neon-green (`#7CFC00`) mark (claw slash or "M"), generated during build.

---

## Appendix A — Image-generation reference (optional)
The stylized cans are produced as SVG (§8), not generated images. **This prompt describes the superseded v1 *flat* can, not the §8 v2 illustrated look** — it is retained only as a reference raster target if one is ever wanted. Trademark/logo constraints have been removed.

> Minimal flat vector illustration of a standard tall energy-drink can, exact front view, perfectly centered and upright, identical framing and scale every time, on a transparent background. Matte finish. Can body is a single flat accent color {COLOR}; near-black top, rim, and pull tab. A bold stylized three-line claw slash near the top third. The flavor name "{FLAVOR NAME}" in clean heavy condensed sans-serif, centered on the body. Soft even studio lighting, one subtle soft shadow directly beneath, no reflections, no gradients beyond a faint vertical sheen, crisp app-asset style, consistent across a set.
