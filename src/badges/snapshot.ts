// Badge snapshot (architecture §4). One derived aggregate computed once per state
// change, so no badge ever scans all flavors — every §5.11 predicate reads a scalar
// (or a pre-derived coupled predicate) off this object. The snapshot is the shared
// base the dashboard stats (stats.ts) and the badge engine both build on.
//
// Half-star convention (PRD §5.3 / CLAUDE.md): `rating` is an integer 1–10, so
// k★ = 2k half-stars. 5★ = 10, 1★ = 2, ≤2★ = ≤4, ≥4★ = ≥8, the 2.5–3.5★ band = 5..7.

import { computed } from '@preact/signals';
import {
  allFlavors,
  backupCount,
  firstLaunchDate,
  stateOf,
} from '../store/state';
import { isTried, hasWrittenReview, LINE_ORDER } from '../types';

/** The 13 real, masterable lines (PRD §5.11). Line-less "Other" customs are a
 *  dashboard bucket, never a masterable line — they are excluded here. */
export const MASTERABLE_LINES: readonly string[] = LINE_ORDER;

export interface Snapshot {
  // ── Tried / completion ──────────────────────────────────────────────────
  catalogN: number; // current catalog union size (built-ins ∪ customs) = denominator N
  triedCount: number;
  builtinTriedCount: number; // built-ins only → The Launch List (never affected by customs)
  builtinTotal: number; // catalog.json length (88)

  // ── Lines ───────────────────────────────────────────────────────────────
  masteredLines: ReadonlySet<string>; // real lines fully tried (total > 0 && tried === total)
  masteredLineCount: number; // = masteredLines.size (Line Hunter / Apex)
  linesWithAnyTried: number; // distinct real lines with ≥ 1 tried (Jack of All Cans)
  realLineCount: number; // 13

  // ── Ratings ─────────────────────────────────────────────────────────────
  ratedCount: number;
  fiveStarCount: number; // rating === 10
  oneStarCount: number; // rating ≤ 2 (0.5★ or 1★ — PRD "1★ given (≤ 1★)")
  avgRating: number | null; // 0–5 stars, null when nothing rated
  distinctHalfStarCount: number; // distinct rating values used (→ Balanced Palate at 10)
  everyFlavorRated: boolean; // ratedCount === catalogN
  allRatedGTE4: boolean; // every rated flavor ≥ 8 half-stars (≥ 4★)
  allRatedLTE2: boolean; // every rated flavor ≤ 4 half-stars (≤ 2★)
  allRatedInFenceBand: boolean; // every rated flavor in 5..7 (2.5–3.5★) → Fence Sitter

  // ── Reviews (over trimmed non-empty reviews only — PRD §5.3 "written review") ──
  reviewCount: number;
  reviewLenMax: number; // longest trimmed review (0 when none) → Dear Diary
  reviewLenMin: number; // shortest trimmed non-empty review (0 when none) → Bare Minimum

  // ── Cans logged ─────────────────────────────────────────────────────────
  totalCans: number; // uncapped
  maxSingleFlavorCount: number; // loyalty ladder
  hasHateDrinkFlavor: boolean; // some flavor count ≥ 10 AND rating ≤ 4 (≤ 2★)

  // ── Alcoholic (Beast lines) ─────────────────────────────────────────────
  alcoholicTried: number;
  alcoholicCans: number;

  // ── Customs / photos / wishlist ─────────────────────────────────────────
  customsCount: number;
  photoCount: number;
  wishlistedCount: number; // flavors currently flagged wishlist=true
  wishlistOpenCount: number; // wishlisted AND not yet tried

  // ── Dormant cross-milestone inputs (wired now, fed later) ───────────────
  // backupCount → Better Safe / Hoarder (M5 backup); originRecorded → The Origin
  // (M6 first-launch, architecture §8). No source increments these in M4, so the
  // three badges sit locked/secret until their owning milestone lights them.
  backupCount: number;
  originRecorded: boolean;
}

export const snapshot = computed<Snapshot>(() => {
  const flavors = allFlavors.value;
  const catalogN = flavors.length;

  let triedCount = 0;
  let builtinTriedCount = 0;
  let builtinTotal = 0;

  let ratedCount = 0;
  let starSum = 0; // in stars (0–5)
  let fiveStarCount = 0;
  let oneStarCount = 0;
  const halfStarValues = new Set<number>();
  let allRatedGTE4 = true;
  let allRatedLTE2 = true;
  let allRatedInFenceBand = true;

  let reviewCount = 0;
  let reviewLenMax = 0;
  let reviewLenMin = Infinity;

  let totalCans = 0;
  let maxSingleFlavorCount = 0;
  let hasHateDrinkFlavor = false;

  let alcoholicTried = 0;
  let alcoholicCans = 0;

  let customsCount = 0;
  let photoCount = 0;
  let wishlistedCount = 0;
  let wishlistOpenCount = 0;

  // Per-line tallies for the 13 masterable lines only (Other/customs excluded).
  const lineTried = new Map<string, number>();
  const lineTotal = new Map<string, number>();

  for (const f of flavors) {
    const s = stateOf(f.slug);
    const tried = isTried(s);
    const custom = f.slug.startsWith('custom-');

    if (custom) customsCount++;
    else {
      builtinTotal++;
      if (tried) builtinTriedCount++;
    }

    if (tried) triedCount++;

    if (MASTERABLE_LINES.includes(f.line)) {
      lineTotal.set(f.line, (lineTotal.get(f.line) ?? 0) + 1);
      if (tried) lineTried.set(f.line, (lineTried.get(f.line) ?? 0) + 1);
    }

    if (s.rating !== null) {
      const r = s.rating; // 1–10
      ratedCount++;
      starSum += r / 2;
      if (r === 10) fiveStarCount++;
      if (r <= 2) oneStarCount++;
      halfStarValues.add(r);
      if (r < 8) allRatedGTE4 = false;
      if (r > 4) allRatedLTE2 = false;
      if (r < 5 || r > 7) allRatedInFenceBand = false;
    }

    if (hasWrittenReview(s)) {
      const len = s.review.trim().length;
      reviewCount++;
      if (len > reviewLenMax) reviewLenMax = len;
      if (len < reviewLenMin) reviewLenMin = len;
    }

    if (s.count >= 1) {
      totalCans += s.count;
      if (s.count > maxSingleFlavorCount) maxSingleFlavorCount = s.count;
      if (f.alcoholic) alcoholicCans += s.count;
    }
    // Hate-Drinker (PRD §5.11): logged ≥ 10 of a flavor rated ≤ 2★ (≤ 4 half-stars).
    if (s.count >= 10 && s.rating !== null && s.rating <= 4) hasHateDrinkFlavor = true;

    if (f.alcoholic && tried) alcoholicTried++;
    if (s.hasPhoto) photoCount++;
    if (s.wishlist) {
      wishlistedCount++;
      if (!tried) wishlistOpenCount++;
    }
  }

  const masteredLines = new Set<string>();
  let linesWithAnyTried = 0;
  for (const line of MASTERABLE_LINES) {
    const total = lineTotal.get(line) ?? 0;
    const t = lineTried.get(line) ?? 0;
    if (t >= 1) linesWithAnyTried++;
    if (total > 0 && t === total) masteredLines.add(line);
  }

  // Empty-input guards: predicates over "every rated …" must be false when nothing
  // is rated (an all-quantifier over an empty set is vacuously true, but no badge
  // should light on zero data).
  const ratedAny = ratedCount > 0;

  return {
    catalogN,
    triedCount,
    builtinTriedCount,
    builtinTotal,

    masteredLines,
    masteredLineCount: masteredLines.size,
    linesWithAnyTried,
    realLineCount: MASTERABLE_LINES.length,

    ratedCount,
    fiveStarCount,
    oneStarCount,
    avgRating: ratedAny ? starSum / ratedCount : null,
    distinctHalfStarCount: halfStarValues.size,
    everyFlavorRated: catalogN > 0 && ratedCount === catalogN,
    allRatedGTE4: ratedAny && allRatedGTE4,
    allRatedLTE2: ratedAny && allRatedLTE2,
    allRatedInFenceBand: ratedAny && allRatedInFenceBand,

    reviewCount,
    reviewLenMax,
    reviewLenMin: reviewCount > 0 ? reviewLenMin : 0,

    totalCans,
    maxSingleFlavorCount,
    hasHateDrinkFlavor,

    alcoholicTried,
    alcoholicCans,

    customsCount,
    photoCount,
    wishlistedCount,
    wishlistOpenCount,

    backupCount: backupCount.value,
    originRecorded: firstLaunchDate.value !== null,
  };
});
