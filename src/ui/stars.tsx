// ½-star rating display (tokens §5). `rating` is the PRD's half-star integer
// (1–10) or null when unrated. Read-only here; the interactive setter lands in M2.

import { useId } from 'preact/hooks';

interface StarsProps {
  /** Half-star integer 1–10, or null when unrated. */
  rating: number | null;
  /** Star edge length in px (~20 in catalog rows, ~44 on detail). */
  size?: number;
}

const STAR_PATH =
  'M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z';

export function Stars({ rating, size = 20 }: StarsProps) {
  // Namespace clip ids per instance — many <Stars> share the document, so a
  // half-star clip id must be unique or `url(#…)` resolves to the wrong star.
  const uid = useId();
  const halves = rating ?? 0; // 0 → all empty
  return (
    <div style={`display:inline-flex;gap:2px;line-height:0`} aria-label={rating ? `${rating / 2} out of 5 stars` : 'unrated'}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = halves - i * 2; // 2 = full, 1 = half, ≤0 = empty
        const fill = filled >= 2 ? 'full' : filled === 1 ? 'half' : 'empty';
        return <Star key={i} fill={fill} size={size} clipId={`${uid}-h${i}`} />;
      })}
    </div>
  );
}

/** A single solid accent star glyph — used for stat labels and headline stats
 *  (the distribution rows, the profile average). One definition, sized per call. */
export function StarGlyph({ size = 12, class: className }: { size?: number; class?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" class={className}>
      <path d={STAR_PATH} fill="var(--accent)" />
    </svg>
  );
}

function Star({ fill, size, clipId }: { fill: 'full' | 'half' | 'empty'; size: number; clipId: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {fill === 'half' ? (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="50" height="100" />
          </clipPath>
        </defs>
      ) : null}
      {/* empty/outline base */}
      <path d={STAR_PATH} fill="none" stroke="var(--star-empty)" stroke-width="6" />
      {fill === 'full' ? <path d={STAR_PATH} fill="var(--accent)" /> : null}
      {fill === 'half' ? <path d={STAR_PATH} fill="var(--accent)" clip-path={`url(#${clipId})`} /> : null}
    </svg>
  );
}
