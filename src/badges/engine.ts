// Badge engine (architecture §4): evaluate the §5.11 table against the live snapshot,
// diff against the unlock log to celebrate-once, and expose the per-badge view the
// achievements grid renders.
//
// Two-phase, runs after any mutating action: phase 1 is the Snapshot (snapshot.ts);
// phase 2 is `evaluate` below — diff `satisfiedNow` against `unlockLog`, log + enqueue
// each newly-earned badge. The engine is driven by a single `effect` over the snapshot
// (every write-through mutation re-derives it for free — @preact/signals reactivity),
// so there is no per-mutation wiring.
//
// Display vs. celebration (the subtle part, architecture §4):
//  • unlockLog = first-earned dates → celebrate-once + lit state of PERMANENT badges.
//  • satisfiedNow = current truth → lit state of DYNAMIC badges (they un-light when
//    the condition lapses and re-light on catch-up, with no re-celebration because the
//    log entry already exists).

import { computed, effect, signal } from '@preact/signals';
import { snapshot, type Snapshot } from './snapshot';
import { BADGES, type BadgeDef } from './defs';
import { unlockLog } from '../store/state';
import { putUnlockEntry, type UnlockEntry } from '../store/db';

const byId = new Map(BADGES.map((d) => [d.id, d]));

/** FIFO of badgeIds awaiting a celebration popup. Multiple badges earned from one
 *  action surface as sequential popups, never stacked (architecture §4). */
export const celebrationQueue = signal<string[]>([]);

/** The badge whose unlock popup is currently showing, or null. */
export const currentCelebration = computed<BadgeDef | null>(() => {
  const id = celebrationQueue.value[0];
  return id ? byId.get(id) ?? null : null;
});

export function dismissCelebration(): void {
  celebrationQueue.value = celebrationQueue.value.slice(1);
}

// The first evaluation (on boot) and any import/restore must NOT celebrate — they only
// back-fill lit state from an already-correct log (architecture §3/§4: "run silently",
// "bulk import is silent"). M5 import will toggle this around its apply step.
let suppressCelebrations = true;

export function setCelebrationsSuppressed(v: boolean): void {
  suppressCelebrations = v;
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Phase 2: diff the satisfied set against the log; first-earn → log + (maybe) enqueue.
 *  Reads the log/queue via `.peek()` so this never becomes a dependency of the driving
 *  effect — only the snapshot is — keeping the engine a pure one-way flow. */
function evaluate(s: Snapshot): void {
  const log = unlockLog.peek();
  let next: Record<string, UnlockEntry> | null = null;
  const earned: string[] = [];

  for (const def of BADGES) {
    if (!log[def.id] && def.isSatisfied(s)) {
      if (!next) next = { ...log };
      const entry: UnlockEntry = { firstEarnedDate: nowISO() };
      next[def.id] = entry;
      earned.push(def.id);
      void putUnlockEntry(def.id, entry); // write-through persistence
    }
  }

  if (next) unlockLog.value = next;
  if (!suppressCelebrations && earned.length) {
    celebrationQueue.value = [...celebrationQueue.peek(), ...earned];
  }
}

/** Start the engine. Call once, after the boot hydrate has populated the stores. The
 *  effect's initial synchronous run happens while still suppressed → silent back-fill;
 *  every later run (driven by a state mutation) celebrates newly-earned badges. */
export function startBadgeEngine(): void {
  suppressCelebrations = true;
  effect(() => {
    evaluate(snapshot.value);
  });
  suppressCelebrations = false;
}

// ── Per-badge view for the achievements grid ─────────────────────────────────

export interface BadgeView {
  def: BadgeDef;
  /** Ever earned (present in the unlock log) — governs secret reveal + perm lit. */
  earned: boolean;
  /** Whether the tile reads as unlocked right now (perm: latched; dynamic: current). */
  lit: boolean;
  /** Secret badges stay "???" until earned; everything else is always revealed. */
  revealed: boolean;
  /** Locked-tile progress readout (null when lit, secret-hidden, or not a ladder). */
  progress: { current: number; target: number } | null;
}

export const badgeViews = computed<BadgeView[]>(() => {
  const s = snapshot.value;
  const log = unlockLog.value;
  return BADGES.map((def) => {
    const earned = !!log[def.id];
    const lit = def.kind === 'permanent' ? earned : def.isSatisfied(s);
    const revealed = def.secret ? earned : true;
    const progress = !lit && revealed && def.progress ? def.progress(s) : null;
    return { def, earned, lit, revealed, progress };
  });
});

/** Count of currently-lit badges for the "X / {badgeTotal} unlocked" header — it
 *  mirrors the lit tiles, so a lapsed dynamic badge un-counts (and a permanent one
 *  stays counted because its lit state is latched). */
export const unlockedCount = computed<number>(() => badgeViews.value.filter((v) => v.lit).length);
export const badgeTotal = BADGES.length;
