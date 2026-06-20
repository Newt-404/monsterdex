// The PRD §5.11 badge table as data, not bespoke code (CLAUDE.md / architecture §4).
// 79 badges across ~21 base glyphs. Each badge reads only the precomputed Snapshot.
//
// Latch type (`kind`) is taken VERBATIM from the §5.11 table — `dyn` (lit follows the
// current dex, un-lights when the condition lapses) vs `perm` (latches on first earn,
// never un-lights). Where the build-plan "Watch (UX)" note describes So Close / NPC /
// Fence Sitter / "No one liked you" as un-lighting, that same note explicitly defers
// the latch *type* to this table — and the table marks them `perm`, so they latch.
//
// `progress` is an optional {current,target} for the numeric-threshold ladders, shown
// on locked tiles (e.g. mockup-profile.png "19 / 25"). Completion/boolean badges omit
// it; avg-gated badges (Connoisseur's "4.3 / 4.5") also omit it for now — restoring
// fractional-average progress is the open M6 call in deferred-decisions.md.

import type { Snapshot } from './snapshot';
import { MASTERABLE_LINES } from './snapshot';

export type GlyphId =
  | 'claw'
  | 'can-single'
  | 'cans-3'
  | 'cans-5'
  | 'cans-pile'
  | 'star'
  | 'stars-triple'
  | 'star-broken'
  | 'quill'
  | 'infinity'
  | 'globe'
  | 'camera'
  | 'shield'
  | 'medal'
  | 'unicorn'
  | 'map'
  | 'balance-scale'
  | 'target'
  | 'sunrise'
  | 'alc-can'
  | 'heart';

export type BadgeGroup =
  | 'tried'
  | 'lines'
  | 'builtin'
  | 'ratings'
  | 'praise'
  | 'critic'
  | 'reviews'
  | 'cans-total'
  | 'loyalty'
  | 'alc-tried'
  | 'alc-cans'
  | 'secret';

export interface BadgeDef {
  id: string;
  group: BadgeGroup;
  title: string;
  requirement: string; // human text shown on a locked (revealed) tile
  secret: boolean; // "???" until first earned (a display attribute, orthogonal to kind)
  kind: 'dynamic' | 'permanent';
  glyph: GlyphId;
  isSatisfied(s: Snapshot): boolean;
  /** Optional locked-tile progress readout for numeric ladders. */
  progress?(s: Snapshot): { current: number; target: number };
}

/** Percentage milestones scale to the current catalog N via floor(p·N) (PRD §5.11). */
const pctTarget = (p: number, n: number) => Math.floor(p * n);

// Small helpers keep the threshold ladders declarative and uniform.
const atLeast = (
  get: (s: Snapshot) => number,
  target: number | ((s: Snapshot) => number),
): Pick<BadgeDef, 'isSatisfied' | 'progress'> => ({
  isSatisfied: (s) => get(s) >= (typeof target === 'function' ? target(s) : target),
  progress: (s) => ({ current: get(s), target: typeof target === 'function' ? target(s) : target }),
});

export const BADGES: BadgeDef[] = [
  // ── Milestones — flavors tried (% scales with N) ─────────────────────────
  { id: 'first-sip', group: 'tried', title: 'First Sip', requirement: 'Try your first flavor', secret: false, kind: 'dynamic', glyph: 'can-single', ...atLeast((s) => s.triedCount, 1) },
  { id: 'collector', group: 'tried', title: 'Collector', requirement: 'Try 10 different flavors', secret: false, kind: 'dynamic', glyph: 'cans-3', ...atLeast((s) => s.triedCount, 10) },
  { id: 'explorer', group: 'tried', title: 'Explorer', requirement: 'Try 25 different flavors', secret: false, kind: 'dynamic', glyph: 'cans-5', ...atLeast((s) => s.triedCount, 25) },
  { id: 'halfway-beast', group: 'tried', title: 'Halfway Beast', requirement: 'Try 50% of the catalog', secret: false, kind: 'dynamic', glyph: 'cans-pile', ...atLeast((s) => s.triedCount, (s) => pctTarget(0.5, s.catalogN)) },
  { id: 'world-tour', group: 'tried', title: 'World Tour', requirement: 'Try 50 different flavors', secret: false, kind: 'dynamic', glyph: 'globe', ...atLeast((s) => s.triedCount, 50) },
  { id: 'almost-there', group: 'tried', title: 'Almost There', requirement: 'Try 90% of the catalog', secret: false, kind: 'dynamic', glyph: 'target', ...atLeast((s) => s.triedCount, (s) => pctTarget(0.9, s.catalogN)) },
  { id: 'completionist', group: 'tried', title: 'Completionist', requirement: 'Try 100% of the catalog', secret: false, kind: 'dynamic', glyph: 'medal', ...atLeast((s) => s.triedCount, (s) => s.catalogN) },

  // ── Line mastery & breadth ────────────────────────────────────────────────
  // The 13 [Line] Master badges (one per masterable line, claw tinted in M6).
  ...LINE_MASTERS(),
  { id: 'jack-of-all-cans', group: 'lines', title: 'Jack of All Cans', requirement: 'Try ≥1 flavor from every line', secret: false, kind: 'dynamic', glyph: 'claw', isSatisfied: (s) => s.linesWithAnyTried >= s.realLineCount, progress: (s) => ({ current: s.linesWithAnyTried, target: s.realLineCount }) },
  { id: 'line-hunter', group: 'lines', title: 'Line Hunter', requirement: 'Master any 3 lines', secret: false, kind: 'dynamic', glyph: 'claw', ...atLeast((s) => s.masteredLineCount, 3) },
  { id: 'apex-predator', group: 'lines', title: 'Apex Predator', requirement: 'Master all 13 lines', secret: false, kind: 'dynamic', glyph: 'claw', isSatisfied: (s) => s.masteredLineCount >= s.realLineCount, progress: (s) => ({ current: s.masteredLineCount, target: s.realLineCount }) },

  // ── Built-in completion (never affected by customs) ──────────────────────
  { id: 'launch-list', group: 'builtin', title: 'The Launch List', requirement: 'Try every built-in flavor as shipped', secret: false, kind: 'permanent', glyph: 'shield', isSatisfied: (s) => s.builtinTotal > 0 && s.builtinTriedCount === s.builtinTotal, progress: (s) => ({ current: s.builtinTriedCount, target: s.builtinTotal }) },

  // ── Ratings given ─────────────────────────────────────────────────────────
  { id: 'rated', group: 'ratings', title: 'Rated', requirement: 'Rate 10 flavors', secret: false, kind: 'dynamic', glyph: 'star', ...atLeast((s) => s.ratedCount, 10) },
  { id: 'decisive', group: 'ratings', title: 'Decisive', requirement: 'Rate 50 flavors', secret: false, kind: 'dynamic', glyph: 'star', ...atLeast((s) => s.ratedCount, 50) },
  { id: 'final-verdict', group: 'ratings', title: 'Final Verdict', requirement: 'Rate every flavor', secret: false, kind: 'dynamic', glyph: 'star', isSatisfied: (s) => s.everyFlavorRated, progress: (s) => ({ current: s.ratedCount, target: s.catalogN }) },
  { id: 'balanced-palate', group: 'ratings', title: 'Balanced Palate', requirement: 'Use all ten ½-star values at least once', secret: false, kind: 'permanent', glyph: 'balance-scale', isSatisfied: (s) => s.distinctHalfStarCount >= 10, progress: (s) => ({ current: s.distinctHalfStarCount, target: 10 }) },

  // ── High praise — 5★ given (cap ≤ 88) ─────────────────────────────────────
  { id: 'true-love', group: 'praise', title: 'True Love', requirement: 'Give your first 5★', secret: false, kind: 'dynamic', glyph: 'star', ...atLeast((s) => s.fiveStarCount, 1) },
  { id: 'perfectionist', group: 'praise', title: 'Perfectionist', requirement: 'Give 10 × 5★', secret: false, kind: 'dynamic', glyph: 'stars-triple', ...atLeast((s) => s.fiveStarCount, 10) },
  { id: 'gold-standard', group: 'praise', title: 'Gold Standard', requirement: 'Give 25 × 5★', secret: false, kind: 'dynamic', glyph: 'stars-triple', ...atLeast((s) => s.fiveStarCount, 25) },
  { id: 'hype-machine', group: 'praise', title: 'Hype Machine', requirement: 'Give 50 × 5★', secret: false, kind: 'dynamic', glyph: 'stars-triple', ...atLeast((s) => s.fiveStarCount, 50) },
  { id: 'connoisseur', group: 'praise', title: 'Connoisseur', requirement: 'Average rating 4.5+ across ≥20 rated', secret: false, kind: 'dynamic', glyph: 'star', isSatisfied: (s) => s.ratedCount >= 20 && s.avgRating !== null && s.avgRating >= 4.5 },

  // ── Critic — 1★ given (≤ 1★, cap ≤ 88) ────────────────────────────────────
  { id: 'critic', group: 'critic', title: 'Critic', requirement: 'Give your first 1★', secret: false, kind: 'dynamic', glyph: 'star-broken', ...atLeast((s) => s.oneStarCount, 1) },
  { id: 'hater', group: 'critic', title: 'Hater', requirement: 'Give 15 × 1★', secret: false, kind: 'dynamic', glyph: 'star-broken', ...atLeast((s) => s.oneStarCount, 15) },
  { id: 'salt-lord', group: 'critic', title: 'Salt Lord', requirement: 'Give 30 × 1★', secret: false, kind: 'dynamic', glyph: 'star-broken', ...atLeast((s) => s.oneStarCount, 30) },
  { id: 'nothing-pleases-you', group: 'critic', title: 'Nothing Pleases You', requirement: 'Give 50 × 1★', secret: false, kind: 'dynamic', glyph: 'star-broken', ...atLeast((s) => s.oneStarCount, 50) },
  { id: 'born-to-complain', group: 'critic', title: 'Born to Complain', requirement: 'Give 75 × 1★', secret: false, kind: 'dynamic', glyph: 'star-broken', ...atLeast((s) => s.oneStarCount, 75) },

  // ── Written reviews (cap ≤ 88) ────────────────────────────────────────────
  { id: 'hot-take', group: 'reviews', title: 'Hot Take', requirement: 'Write your first review', secret: false, kind: 'dynamic', glyph: 'quill', ...atLeast((s) => s.reviewCount, 1) },
  { id: 'reviewer', group: 'reviews', title: 'Reviewer', requirement: 'Write 10 reviews', secret: false, kind: 'dynamic', glyph: 'quill', ...atLeast((s) => s.reviewCount, 10) },
  { id: 'wordsmith', group: 'reviews', title: 'Wordsmith', requirement: 'Write 25 reviews', secret: false, kind: 'dynamic', glyph: 'quill', ...atLeast((s) => s.reviewCount, 25) },
  { id: 'novelist', group: 'reviews', title: 'Novelist', requirement: 'Write 50 reviews', secret: false, kind: 'dynamic', glyph: 'quill', ...atLeast((s) => s.reviewCount, 50) },
  { id: 'who-asked', group: 'reviews', title: 'Who Asked?', requirement: 'Write a review for every flavor', secret: false, kind: 'dynamic', glyph: 'quill', isSatisfied: (s) => s.catalogN > 0 && s.reviewCount === s.catalogN, progress: (s) => ({ current: s.reviewCount, target: s.catalogN }) },

  // ── Cans logged — total (uncapped) ────────────────────────────────────────
  { id: 'dedicated', group: 'cans-total', title: 'Dedicated', requirement: 'Log 50 cans', secret: false, kind: 'permanent', glyph: 'cans-pile', ...atLeast((s) => s.totalCans, 50) },
  { id: 'monster-forever', group: 'cans-total', title: 'Monster Forever', requirement: 'Log 250 cans', secret: false, kind: 'permanent', glyph: 'infinity', ...atLeast((s) => s.totalCans, 250) },
  { id: 'tower-of-cans', group: 'cans-total', title: 'Tower of Cans', requirement: 'Log 1,000 cans', secret: false, kind: 'permanent', glyph: 'cans-pile', ...atLeast((s) => s.totalCans, 1000) },
  { id: 'night-shift-warrior', group: 'cans-total', title: 'Night Shift Warrior', requirement: 'Log 2,500 cans', secret: false, kind: 'permanent', glyph: 'cans-pile', ...atLeast((s) => s.totalCans, 2500) },
  { id: 'diabetes-speedrun', group: 'cans-total', title: 'Diabetes Speedrun', requirement: 'Log 5,000 cans', secret: false, kind: 'permanent', glyph: 'cans-pile', ...atLeast((s) => s.totalCans, 5000) },

  // ── Cans logged — single flavor (loyalty; uncapped) ──────────────────────
  { id: 'regular', group: 'loyalty', title: 'Regular', requirement: 'Log 10 of one flavor', secret: false, kind: 'permanent', glyph: 'can-single', ...atLeast((s) => s.maxSingleFlavorCount, 10) },
  { id: 'die-hard', group: 'loyalty', title: 'Die-hard', requirement: 'Log 50 of one flavor', secret: false, kind: 'permanent', glyph: 'can-single', ...atLeast((s) => s.maxSingleFlavorCount, 50) },
  { id: 'obsessed', group: 'loyalty', title: 'Obsessed', requirement: 'Log 100 of one flavor', secret: false, kind: 'permanent', glyph: 'can-single', ...atLeast((s) => s.maxSingleFlavorCount, 100) },
  { id: 'ride-or-die', group: 'loyalty', title: 'Ride or Die', requirement: 'Log 250 of one flavor', secret: false, kind: 'permanent', glyph: 'can-single', ...atLeast((s) => s.maxSingleFlavorCount, 250) },

  // ── Alcoholic — flavors tried (cap ≤ 11) ─────────────────────────────────
  // PRD §5.11 marks these secret/dyn; per Newt's request the alcoholic families are
  // shown openly (secret: false) so the alcoholic ladders are visible in the grid —
  // see deferred-decisions.md. Latch type (dyn) unchanged.
  { id: 'that-tastes-funny', group: 'alc-tried', title: 'That Tastes Funny', requirement: 'Try your first alcoholic flavor', secret: false, kind: 'dynamic', glyph: 'alc-can', ...atLeast((s) => s.alcoholicTried, 1) },
  { id: 'why-am-i-dizzy', group: 'alc-tried', title: 'Why Am I Dizzy?', requirement: 'Try 3 alcoholic flavors', secret: false, kind: 'dynamic', glyph: 'alc-can', ...atLeast((s) => s.alcoholicTried, 3) },
  { id: 'room-always-spin', group: 'alc-tried', title: 'Did This Room Always Spin?', requirement: 'Try 5 alcoholic flavors', secret: false, kind: 'dynamic', glyph: 'alc-can', ...atLeast((s) => s.alcoholicTried, 5) },
  { id: 'texting-my-ex', group: 'alc-tried', title: 'Texting My Ex', requirement: 'Try 8 alcoholic flavors', secret: false, kind: 'dynamic', glyph: 'alc-can', ...atLeast((s) => s.alcoholicTried, 8) },
  { id: 'last-call', group: 'alc-tried', title: 'Last Call', requirement: 'Try all 11 alcoholic flavors', secret: false, kind: 'dynamic', glyph: 'alc-can', ...atLeast((s) => s.alcoholicTried, 11) },

  // ── Alcoholic — cans logged (uncapped) ───────────────────────────────────
  // Shown openly too (was secret/perm in PRD §5.11) — same override as above.
  { id: 'liquid-courage', group: 'alc-cans', title: 'Liquid Courage', requirement: 'Log 10 alcoholic cans', secret: false, kind: 'permanent', glyph: 'alc-can', ...atLeast((s) => s.alcoholicCans, 10) },
  { id: 'five-oclock-somewhere', group: 'alc-cans', title: "It's 5 O'Clock Somewhere", requirement: 'Log 25 alcoholic cans', secret: false, kind: 'permanent', glyph: 'alc-can', ...atLeast((s) => s.alcoholicCans, 25) },
  { id: 'functioning-alcoholic', group: 'alc-cans', title: 'Functioning Alcoholic', requirement: 'Log 50 alcoholic cans', secret: false, kind: 'permanent', glyph: 'alc-can', ...atLeast((s) => s.alcoholicCans, 50) },
  { id: 'intervention-pending', group: 'alc-cans', title: 'Intervention Pending', requirement: 'Log 100 alcoholic cans', secret: false, kind: 'permanent', glyph: 'alc-can', ...atLeast((s) => s.alcoholicCans, 100) },

  // ── Funny / secret ("???" until earned) ──────────────────────────────────
  // The Origin is owned by the M6 first-launch flow (architecture §8); wired here,
  // dormant until firstLaunchDate is set.
  { id: 'the-origin', group: 'secret', title: 'The Origin', requirement: 'Open MonsterDex on day one', secret: true, kind: 'permanent', glyph: 'sunrise', isSatisfied: (s) => s.originRecorded },
  { id: 'found-a-unicorn', group: 'secret', title: 'Found a Unicorn', requirement: 'Add a custom flavor', secret: true, kind: 'permanent', glyph: 'unicorn', ...atLeast((s) => s.customsCount, 1) },
  { id: 'cartographer', group: 'secret', title: 'Cartographer', requirement: 'Add 5 custom flavors', secret: true, kind: 'permanent', glyph: 'map', ...atLeast((s) => s.customsCount, 5) },
  { id: 'say-cheese', group: 'secret', title: 'Say Cheese', requirement: 'Add 10 of your own photos', secret: true, kind: 'permanent', glyph: 'camera', ...atLeast((s) => s.photoCount, 10) },
  { id: 'photographer', group: 'secret', title: 'Photographer', requirement: 'Add 50 of your own photos', secret: true, kind: 'permanent', glyph: 'camera', ...atLeast((s) => s.photoCount, 50) },
  { id: 'anti-ai-slop', group: 'secret', title: 'Anti AI-Slop', requirement: 'Add your own photo for every flavor', secret: true, kind: 'dynamic', glyph: 'camera', isSatisfied: (s) => s.catalogN > 0 && s.photoCount === s.catalogN, progress: (s) => ({ current: s.photoCount, target: s.catalogN }) },
  // Better Safe / Hoarder owned by M5 backup; wired, dormant until backupCount grows.
  { id: 'better-safe', group: 'secret', title: 'Better Safe', requirement: 'Create your first backup', secret: true, kind: 'permanent', glyph: 'shield', ...atLeast((s) => s.backupCount, 1) },
  { id: 'hoarder', group: 'secret', title: 'Hoarder', requirement: 'Keep 5 backups', secret: true, kind: 'permanent', glyph: 'shield', ...atLeast((s) => s.backupCount, 5) },
  { id: 'promises-kept', group: 'secret', title: 'Promises Kept', requirement: 'Try everything on your wishlist (≥5 wishlisted)', secret: true, kind: 'dynamic', glyph: 'heart', isSatisfied: (s) => s.wishlistedCount >= 5 && s.wishlistOpenCount === 0 },
  { id: 'so-close', group: 'secret', title: 'So Close', requirement: 'Exactly one flavor left untried', secret: true, kind: 'permanent', glyph: 'target', isSatisfied: (s) => s.catalogN - s.triedCount === 1 },
  { id: 'one-track-mind', group: 'secret', title: 'One-Track Mind', requirement: 'Log 50+ of one flavor while < 10 tried', secret: true, kind: 'permanent', glyph: 'can-single', isSatisfied: (s) => s.maxSingleFlavorCount >= 50 && s.triedCount < 10 },
  { id: 'hate-drinker', group: 'secret', title: 'Hate-Drinker', requirement: 'Log 10+ of a flavor you rated ≤2★', secret: true, kind: 'permanent', glyph: 'star-broken', isSatisfied: (s) => s.hasHateDrinkFlavor },
  { id: 'impossible-to-please', group: 'secret', title: 'Impossible to Please', requirement: 'Average rating < 2.5 across ≥20 rated', secret: true, kind: 'dynamic', glyph: 'star-broken', isSatisfied: (s) => s.ratedCount >= 20 && s.avgRating !== null && s.avgRating < 2.5 },
  { id: 'fence-sitter', group: 'secret', title: 'Fence Sitter', requirement: '≥20 rated and every rating 2.5–3.5★', secret: true, kind: 'permanent', glyph: 'balance-scale', isSatisfied: (s) => s.ratedCount >= 20 && s.allRatedInFenceBand },
  { id: 'npc-behavior', group: 'secret', title: 'NPC Behavior', requirement: 'Every flavor rated, all ratings ≥4★', secret: true, kind: 'permanent', glyph: 'star', isSatisfied: (s) => s.everyFlavorRated && s.allRatedGTE4 },
  { id: 'no-one-liked-you', group: 'secret', title: 'No one liked you in school huh?', requirement: 'Every flavor rated, all ratings ≤2★', secret: true, kind: 'permanent', glyph: 'star-broken', isSatisfied: (s) => s.everyFlavorRated && s.allRatedLTE2 },
  { id: 'dear-diary', group: 'secret', title: 'Dear Diary', requirement: 'Write a single review over 500 characters', secret: true, kind: 'permanent', glyph: 'quill', isSatisfied: (s) => s.reviewLenMax > 500 },
  { id: 'bare-minimum', group: 'secret', title: 'Bare Minimum', requirement: 'Write a (non-empty) review of ≤5 characters', secret: true, kind: 'permanent', glyph: 'quill', isSatisfied: (s) => s.reviewCount > 0 && s.reviewLenMin <= 5 },
];

/** The 13 per-line [Line] Master badges (PRD §5.11). Each lights when that line's
 *  flavors are all tried; dynamic, so an untried addition un-lights it. Claw glyph
 *  (per-line tint deferred to M6 hex tuning — deferred-decisions.md). */
function LINE_MASTERS(): BadgeDef[] {
  return MASTERABLE_LINES.map((line) => ({
    id: `line-master-${slugifyLine(line)}`,
    group: 'lines' as const,
    title: `${line} Master`,
    requirement: `Try every ${line} flavor`,
    secret: false,
    kind: 'dynamic' as const,
    glyph: 'claw' as const,
    isSatisfied: (s: Snapshot) => s.masteredLines.has(line),
  }));
}

function slugifyLine(line: string): string {
  return line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
