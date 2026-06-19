// Derived dashboard / profile statistics (PRD §5.8 / §5.9). One computed pass over
// the live catalog union (built-ins ∪ customs) + user state, so every number on the
// Dashboard and the Profile headline reconciles by hand from the logged data.
//
// Customs are full catalog members: a custom assigned to a real line folds into both
// that line's tried count and total and into the overall N; line-less ("Other")
// customs collect in a separate, conditional Custom bucket that is NOT a masterable
// line (PRD §5.8 / §10). These derivations are also the shared base the M4 badge
// snapshot builds on.

import { computed } from '@preact/signals';
import { allFlavors, stateOf } from './state';
import { isTried, LINE_ORDER, OTHER_LINE, type Flavor } from '../types';

/** A flavor paired with a sortable value (a 0–5 rating, or a can count). */
export interface RankedFlavor {
  flavor: Flavor;
  value: number;
}

/** One row of the by-line table. `avg` is 0–5 or null (no rated flavor in scope). */
export interface LineStat {
  line: string;
  tried: number;
  total: number;
  avg: number | null;
  /** The line-less "Other" customs bucket — shown last, never masterable. */
  isCustomBucket: boolean;
}

export interface DashboardStats {
  tried: number;
  total: number; // N = current catalog (built-ins + customs)
  pct: number; // 0–100, rounded
  avg: number | null; // overall average, 0–5, or null when nothing is rated
  ratedCount: number;
  /** 5★ → 1★ rows; `pct` is share of rated flavors (0 when nothing rated). */
  distribution: { star: number; count: number; pct: number }[];
  topFlavors: RankedFlavor[]; // highest-rated first, up to 5
  lines: LineStat[]; // the 13 real lines, then the Custom bucket if non-empty
  totalCans: number;
  mostDrunk: RankedFlavor[]; // most-logged first, up to 3
}

interface LineAccum {
  tried: number;
  total: number;
  ratingSum: number; // in stars (0–5)
  ratedCount: number;
}

function emptyLine(): LineAccum {
  return { tried: 0, total: 0, ratingSum: 0, ratedCount: 0 };
}

function avgOf(sum: number, n: number): number | null {
  return n === 0 ? null : sum / n;
}

/** Bin a 0.5–5 star rating into its whole-star distribution row, rounding half
 *  UP (PRD §5.8: 3.5★ → 4★, 2.5★ → 3★). `floor(x + 0.5)` is half-up for every
 *  value here, with none of `Math.round`'s round-half-to-even ambiguity. */
function distBin(stars: number): number {
  return Math.floor(stars + 0.5);
}

export const dashboardStats = computed<DashboardStats>(() => {
  const flavors = allFlavors.value;
  const total = flavors.length;

  let tried = 0;
  let ratingSum = 0; // stars (0–5)
  let ratedCount = 0;
  let totalCans = 0;
  const distCounts = [0, 0, 0, 0, 0]; // index 0 = 1★ … index 4 = 5★

  const lineAcc = new Map<string, LineAccum>();
  const rated: RankedFlavor[] = [];
  const logged: RankedFlavor[] = [];

  for (const f of flavors) {
    const s = stateOf(f.slug);
    const acc = lineAcc.get(f.line) ?? emptyLine();
    acc.total++;

    if (isTried(s)) {
      tried++;
      acc.tried++;
    }
    if (s.rating !== null) {
      const stars = s.rating / 2;
      ratingSum += stars;
      ratedCount++;
      distCounts[distBin(stars) - 1]++;
      acc.ratingSum += stars;
      acc.ratedCount++;
      rated.push({ flavor: f, value: stars });
    }
    if (s.count >= 1) {
      totalCans += s.count;
      logged.push({ flavor: f, value: s.count });
    }

    lineAcc.set(f.line, acc);
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = distCounts[star - 1];
    return { star, count, pct: ratedCount === 0 ? 0 : Math.round((count / ratedCount) * 100) };
  });

  const byValueThenName = (a: RankedFlavor, b: RankedFlavor) =>
    b.value - a.value ||
    a.flavor.nameMain.localeCompare(b.flavor.nameMain, undefined, { sensitivity: 'base' });

  const topFlavors = [...rated].sort(byValueThenName).slice(0, 5);
  const mostDrunk = [...logged].sort(byValueThenName).slice(0, 3);

  // Real lines in canonical order, then the conditional Custom bucket last.
  const lines: LineStat[] = LINE_ORDER.map((line) => {
    const a = lineAcc.get(line) ?? emptyLine();
    return { line, tried: a.tried, total: a.total, avg: avgOf(a.ratingSum, a.ratedCount), isCustomBucket: false };
  });
  const other = lineAcc.get(OTHER_LINE);
  if (other && other.total > 0) {
    lines.push({
      line: OTHER_LINE,
      tried: other.tried,
      total: other.total,
      avg: avgOf(other.ratingSum, other.ratedCount),
      isCustomBucket: true,
    });
  }

  return {
    tried,
    total,
    pct: total === 0 ? 0 : Math.round((tried / total) * 100),
    avg: avgOf(ratingSum, ratedCount),
    ratedCount,
    distribution,
    topFlavors,
    lines,
    totalCans,
    mostDrunk,
  };
});
