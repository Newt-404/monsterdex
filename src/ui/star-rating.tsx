// Interactive ½-star rating control (PRD §5.2 — tap to set, ½-star precision).
// `value` is the half-star integer 1–10 or null; `onChange` receives the new
// half-star integer. Tapping the left half of a star sets the ½ value, the right
// half the full value. Clearing is a separate explicit action (PRD §5.2), not a
// re-tap, so there is no "tap the current star to zero it" here.

import { useId } from 'preact/hooks';
import type { JSX } from 'preact';

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number) => void;
  /** Star edge length in px (~44 on the detail screen, tokens §5). */
  size?: number;
}

const STAR_PATH =
  'M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z';

export function StarRating({ value, onChange, size = 44 }: StarRatingProps) {
  const uid = useId();
  const halves = value ?? 0;

  const pick = (i: number) => (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const leftHalf = e.clientX - rect.left < rect.width / 2;
    onChange(i * 2 + (leftHalf ? 1 : 2)); // 1..10
  };

  return (
    <div
      class="star-rating"
      role="slider"
      aria-label="rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value ? value / 2 : 0}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const f = halves - i * 2; // 2 = full, 1 = half, ≤0 = empty
        const fill = f >= 2 ? 'full' : f === 1 ? 'half' : 'empty';
        const stars = value ? value / 2 : 0;
        return (
          <button
            key={i}
            class="star-btn"
            type="button"
            onClick={pick(i)}
            aria-label={`Set ${i + 0.5}–${i + 1} stars (currently ${stars})`}
          >
            <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
              {fill === 'half' ? (
                <defs>
                  <clipPath id={`${uid}-h${i}`}>
                    <rect x="0" y="0" width="50" height="100" />
                  </clipPath>
                </defs>
              ) : null}
              <path d={STAR_PATH} fill="none" stroke="var(--star-empty)" stroke-width="6" />
              {fill === 'full' ? <path d={STAR_PATH} fill="var(--accent)" /> : null}
              {fill === 'half' ? (
                <path d={STAR_PATH} fill="var(--accent)" clip-path={`url(#${uid}-h${i})`} />
              ) : null}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
