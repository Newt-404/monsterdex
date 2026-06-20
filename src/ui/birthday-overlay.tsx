// First-launch birthday welcome (PRD §5.12, mockup-birthday.png). A one-time full-screen
// overlay raised by the boot first-launch flow (architecture §8). Claw logo → big Anton
// headline → body copy → glowing "TAP IN". Confetti rains on entry and bursts on tap.
// Offline-safe: canvas-confetti draws to its own local canvas, no network.

import { useEffect } from 'preact/hooks';
import confetti from 'canvas-confetti';
import { dismissBirthday } from '../store/state';
import { Claw } from '../can/claw';
import '../styles/birthday.css';

const CONFETTI_COLORS = ['#7CFC00', '#6FE000', '#F4F5F4'];

/** A festive rain from the top — the entry celebration. */
function fireRain(): void {
  confetti({ particleCount: 70, spread: 100, startVelocity: 32, origin: { y: 0.1 }, colors: CONFETTI_COLORS, scalar: 0.95 });
}

export function BirthdayOverlay() {
  useEffect(() => {
    // Staggered bursts so the screen fills with confetti as it fades in.
    fireRain();
    const t1 = setTimeout(fireRain, 350);
    const t2 = setTimeout(fireRain, 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  function tapIn(): void {
    // One last burst from the button height, then close. canvas-confetti keeps animating
    // on its own canvas after this overlay unmounts, so the burst is never cut short.
    confetti({ particleCount: 120, spread: 90, startVelocity: 45, origin: { y: 0.7 }, colors: CONFETTI_COLORS });
    dismissBirthday();
  }

  return (
    <div class="birthday-overlay" role="dialog" aria-modal="true" aria-label="Happy birthday, Bassie">
      <div class="birthday-inner">
        <Claw fill="var(--accent)" size={68} class="birthday-claw" />
        <h1 class="birthday-head display">
          Happy
          <br />
          Birthday,
          <br />
          Bassie
        </h1>
        <p class="birthday-body">
          The hunt's on: every Monster flavor in existence, waiting to be tasted, rated, and checked
          off the list.
        </p>
        <button class="birthday-cta display" onClick={tapIn}>
          Tap In
        </button>
      </div>
    </div>
  );
}
