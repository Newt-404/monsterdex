// Catalog flavor card (PRD §5.1): can image, name, line tag (accent dot +
// sub-category label), star rating, tried indicator, wishlist indicator. Fixed
// width, dense swipe-row card matching the mockup. Tapping the card opens the
// flavor detail; the heart toggles wishlist in place. State is read live from the
// store (tried = rating !== null || count ≥ 1).

import { FlavorImage } from '../can/flavor-image';
import { Stars } from './stars';
import { openFlavor, stateOf, toggleWishlist } from '../store/state';
import { categoryLabel, isTried, type Flavor } from '../types';

export function FlavorCard({ flavor }: { flavor: Flavor }) {
  const st = stateOf(flavor.slug);
  const tried = isTried(st);

  return (
    <article class="card" onClick={() => openFlavor(flavor.slug)}>
      <div class="card-top">
        <div class="card-thumb">
          <FlavorImage flavor={flavor} width={50} />
        </div>
        <div class="card-info">
          {/* nameMain only — the nameTop descriptor (e.g. "Zero Sugar") lives on
              the can, not duplicated here as an extra line. */}
          <span class="card-namemain display">{flavor.nameMain}</span>
          <div class="card-meta">
            <div class="card-tag">
              <span class="card-dot" style={`background:${flavor.accentColor}`} />
              <span class="card-cat">{categoryLabel(flavor.line)}</span>
            </div>
            <Stars rating={st.rating} size={13} />
          </div>
        </div>
      </div>
      <div class="card-foot">
        {tried ? (
          <span class="tried-pill">
            <CheckIcon /> Tried
          </span>
        ) : (
          <span class="untried-label">
            <CircleOutline /> Not Tried
          </span>
        )}
        <button
          class={`heart${st.wishlist ? ' on' : ''}`}
          aria-label="wishlist"
          aria-pressed={st.wishlist}
          onClick={(e) => {
            e.stopPropagation(); // don't open detail when toggling the heart
            toggleWishlist(flavor.slug);
          }}
        >
          <HeartIcon filled={st.wishlist} />
        </button>
      </div>
    </article>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--accent)" />
      <path d="M7 12.5l3.2 3.2L17 8.5" fill="none" stroke="var(--on-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

function CircleOutline() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--text-3)" stroke-width="2" />
    </svg>
  );
}

// Clean, symmetric heart (the previous hand-rolled path was lopsided on the right).
const HEART_D =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path d={HEART_D} fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'var(--accent)' : 'var(--text-3)'} stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  );
}
