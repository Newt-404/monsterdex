// One achievements-grid tile (mockup-profile.png). Three visual states (tokens §5):
//   • Unlocked  — surface-1, accent border + glow, colored glyph, green check chip.
//   • Locked    — surface-1, glyph + lock in --locked, requirement + progress in muted text.
//   • Secret    — same locked frame but "???" in place of glyph/title/requirement.
// Lit/earned/revealed all come precomputed off the BadgeView (engine.ts).

import type { BadgeView } from '../badges/engine';
import { Glyph } from '../badges/glyphs';

export function BadgeTile({ view }: { view: BadgeView }) {
  const { def, lit, revealed, progress } = view;
  const hidden = !revealed; // secret & not yet earned → keep it a mystery

  return (
    <div class={`badge-tile${lit ? ' lit' : ''}${hidden ? ' secret' : ''}`}>
      {!lit ? (
        <span class="badge-lock" aria-hidden="true">
          <LockIcon />
        </span>
      ) : null}

      <div class="badge-art">
        {lit ? <span class="badge-burst" aria-hidden="true" /> : null}
        {hidden ? (
          <span class="badge-qmark display">???</span>
        ) : (
          <Glyph id={def.glyph} size={44} class="badge-glyph" />
        )}
      </div>

      <div class="badge-title display">{hidden ? 'Secret' : def.title}</div>

      {hidden ? (
        <div class="badge-req">???</div>
      ) : (
        <div class="badge-req">{def.requirement}</div>
      )}

      {lit ? (
        <span class="badge-check" aria-label="Unlocked">
          <CheckIcon />
        </span>
      ) : progress ? (
        <div class="badge-progress">
          {fmt(progress.current)} / {fmt(progress.target)}
        </div>
      ) : null}
    </div>
  );
}

/** Compact thousands (1,000) so the high can-ladders read cleanly in the narrow tile. */
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
