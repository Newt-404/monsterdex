// Badge-unlock celebration popup (mockup-badge-unlock.png). Renders the head of the
// celebration queue (engine.ts); confetti fires on each badge. Multiple badges earned
// from one action queue up and show one at a time — dismiss advances the queue.
// Offline-safe: canvas-confetti draws to a local canvas, no network.

import { useEffect } from 'preact/hooks';
import confetti from 'canvas-confetti';
import { currentCelebration, dismissCelebration } from '../badges/engine';
import { CelebrationMedal } from '../badges/glyphs';
import { StarGlyph } from './stars';
import '../styles/badge-unlock.css';

const CONFETTI_COLORS = ['#7CFC00', '#6FE000', '#F4F5F4'];

export function BadgeUnlock() {
  const def = currentCelebration.value;
  const id = def?.id;

  // Re-fire for every badge that surfaces (the queue can advance to a new one while
  // the popup stays mounted), keyed on the badge id.
  useEffect(() => {
    if (!id) return;
    confetti({ particleCount: 90, spread: 78, startVelocity: 38, origin: { y: 0.32 }, colors: CONFETTI_COLORS });
    const t = setTimeout(
      () => confetti({ particleCount: 55, spread: 110, startVelocity: 28, origin: { y: 0.28 }, scalar: 0.9, colors: CONFETTI_COLORS }),
      170,
    );
    return () => clearTimeout(t);
  }, [id]);

  if (!def) return null;

  return (
    <div class="unlock-overlay" role="dialog" aria-modal="true" aria-label="Achievement unlocked">
      <div class="unlock-card">
        <button class="unlock-close" onClick={dismissCelebration} aria-label="Close">
          <CloseIcon />
        </button>

        <div class="unlock-medal">
          <CelebrationMedal />
        </div>

        <h2 class="unlock-head display">
          Achievement
          <br />
          Unlocked
        </h2>

        <div class="unlock-divider">
          <span class="unlock-rule" />
          <StarGlyph size={14} />
          <span class="unlock-rule" />
        </div>

        <div class="unlock-title display">{def.title}</div>
        <p class="unlock-req">{def.requirement}</p>

        <button class="unlock-cta" onClick={dismissCelebration}>
          Awesome!
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
