// The ~21 base badge glyphs (asset-manifest §5) + the celebration medal (§6).
// Monochrome line/solid SVGs drawn in `currentColor`, so the tile recolors them by
// state with one rule (lit → --accent, locked → --locked) — the same recolor trick as
// the cans. The 79 §5.11 badges all map onto these via the `glyph` column in defs.ts;
// per-tier indicators (+tier / crowned / loop) are a polish concern deferred to M6.

import type { JSX } from 'preact';
import type { GlyphId } from './defs';

/** A small soda-can shape, reused by the can-count glyphs. */
function can(x: number, y: number, w: number, h: number): JSX.Element {
  const r = Math.min(w, h) * 0.18;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} />
      <path d={`M${x} ${y + h * 0.22} h${w}`} />
      <path d={`M${x} ${y + h * 0.78} h${w}`} />
    </g>
  );
}

const STAR = 'M12 3 L14.6 9.2 L21 9.7 L16 14 L17.6 20.5 L12 16.9 L6.4 20.5 L8 14 L3 9.7 L9.4 9.2 Z';

const GLYPHS: Record<GlyphId, JSX.Element> = {
  // Monster claw — three torn slashes.
  claw: (
    <g stroke-width="2.2">
      <path d="M6.5 3.2 Q9 12 7 20.8" />
      <path d="M11.5 2.8 Q13.4 12 11.6 21" />
      <path d="M16.5 3.2 Q17.6 11.5 15.8 20.6" />
    </g>
  ),
  'can-single': can(8.5, 3.5, 7, 17),
  'cans-3': (
    <g>
      {can(2.5, 8, 5, 11.5)}
      {can(9.5, 5.5, 5, 13.5)}
      {can(16.5, 8, 5, 11.5)}
    </g>
  ),
  'cans-5': (
    <g>
      {can(2, 9.5, 4.2, 10)}
      {can(6.8, 7.5, 4.2, 12)}
      {can(11.6, 6, 4.2, 13.5)}
      {can(16.4, 7.5, 4.2, 12)}
      {can(13.2, 12, 4.2, 8)}
    </g>
  ),
  'cans-pile': (
    <g>
      {can(2.5, 11.5, 5, 8.5)}
      {can(9.5, 11.5, 5, 8.5)}
      {can(16.5, 11.5, 5, 8.5)}
      {can(6, 3.5, 5, 8.5)}
      {can(13, 3.5, 5, 8.5)}
    </g>
  ),
  star: <path d={STAR} fill="currentColor" stroke="none" />,
  'stars-triple': (
    <g fill="currentColor" stroke="none">
      <path d="M12 2.5 L14 7 L19 7.4 L15.2 10.6 L16.4 15.5 L12 12.8 L7.6 15.5 L8.8 10.6 L5 7.4 L10 7 Z" />
      <path d="M5 13 L6.1 15.6 L9 15.8 L6.8 17.6 L7.5 20.4 L5 18.9 L2.5 20.4 L3.2 17.6 L1 15.8 L3.9 15.6 Z" />
      <path d="M19 13 L20.1 15.6 L23 15.8 L20.8 17.6 L21.5 20.4 L19 18.9 L16.5 20.4 L17.2 17.6 L15 15.8 L17.9 15.6 Z" />
    </g>
  ),
  'star-broken': (
    <g>
      <path d={STAR} />
      <path d="M12 3 L11 9 L13.5 12 L11 16.9" stroke-width="1.4" />
    </g>
  ),
  quill: (
    <g>
      <path d="M4 20 C8 19 10 16 19.5 4.5 C19.5 4.5 16 12 6.5 17.5" />
      <path d="M4 20 L8 18.5" />
      <path d="M11 9.5 C13 9 15 8.5 16.5 7.5" stroke-width="1.1" />
    </g>
  ),
  infinity: (
    <g stroke-width="1.9">
      <path d="M8 12 C8 8.7 4 8.7 4 12 C4 15.3 8 15.3 8 12 C8 8.7 12 15.3 12 12 C12 8.7 16 15.3 16 12 C16 15.3 20 15.3 20 12 C20 8.7 16 8.7 16 12" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12 h18" />
      <path d="M4.5 7 h15" />
      <path d="M4.5 17 h15" />
    </g>
  ),
  camera: (
    <g>
      <rect x="3" y="7" width="18" height="13" rx="2.4" />
      <path d="M8.5 7 L10 4.5 h4 L15.5 7" />
      <circle cx="12" cy="13.3" r="3.6" />
      <circle cx="17.6" cy="10.4" r="0.7" fill="currentColor" stroke="none" />
    </g>
  ),
  shield: (
    <g>
      <path d="M12 2.8 L19.5 5.5 V11 C19.5 16 16 19.5 12 21.2 C8 19.5 4.5 16 4.5 11 V5.5 Z" />
      <path d="M9 11.8 L11.2 14 L15.2 9.4" stroke-width="1.4" />
    </g>
  ),
  medal: (
    <g>
      <path d="M8.5 3 L11 9.5 M15.5 3 L13 9.5" />
      <circle cx="12" cy="14.5" r="6" />
      <path d="M12 11 L13.1 13.4 L15.7 13.6 L13.7 15.3 L14.4 17.9 L12 16.5 L9.6 17.9 L10.3 15.3 L8.3 13.6 L10.9 13.4 Z" fill="currentColor" stroke="none" />
    </g>
  ),
  unicorn: (
    <g>
      <path d="M5 20 C5 14 7.5 10.5 11 9 L13 3.5 L14 9 C17 10 19 12.5 19 16" />
      <path d="M13 3.5 L15.5 6.5" stroke-width="1.2" />
      <path d="M11 9 C9 9.5 7 10.5 6 12.5" stroke-width="1.1" />
      <circle cx="15.2" cy="13" r="0.7" fill="currentColor" stroke="none" />
    </g>
  ),
  map: (
    <g>
      <path d="M3 6.5 L9 4 L15 6.5 L21 4 V17.5 L15 20 L9 17.5 L3 20 Z" />
      <path d="M9 4 V17.5" stroke-width="1.1" />
      <path d="M15 6.5 V20" stroke-width="1.1" />
    </g>
  ),
  'balance-scale': (
    <g>
      <path d="M12 3.5 V20" />
      <path d="M7 20 h10" />
      <path d="M4 7 h16" />
      <path d="M12 4.6 L4 7 M12 4.6 L20 7" stroke-width="1.1" />
      <path d="M1.8 7 L4 12.5 L6.2 7" />
      <path d="M17.8 7 L20 12.5 L22.2 7" />
    </g>
  ),
  target: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.3" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </g>
  ),
  sunrise: (
    <g>
      <path d="M3 18 h18" />
      <path d="M6.5 18 a5.5 5.5 0 0 1 11 0" />
      <path d="M12 5.5 V8 M4.7 8.5 L6.4 10.2 M19.3 8.5 L17.6 10.2 M1.5 18 H0.5 M23.5 18 h-1" stroke-width="1.3" />
    </g>
  ),
  'alc-can': (
    <g>
      {can(8, 6.5, 7, 14)}
      <circle cx="17.5" cy="6" r="1.1" />
      <circle cx="19.5" cy="9.5" r="0.8" />
      <circle cx="16" cy="3" r="0.7" />
    </g>
  ),
  heart: (
    <path
      d="M12 20.7 L4.3 13 C2.4 11.1 2.4 8 4.3 6.1 C6.2 4.2 9 4.6 12 7.8 C15 4.6 17.8 4.2 19.7 6.1 C21.6 8 21.6 11.1 19.7 13 Z"
      fill="currentColor"
      stroke="none"
    />
  ),
};

export function Glyph({
  id,
  size = 40,
  class: className,
}: {
  id: GlyphId;
  size?: number;
  class?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {GLYPHS[id]}
    </svg>
  );
}

/** The richer hero medal for the unlock popup (asset-manifest §6): laurel-wreathed
 *  claw medallion + ribbon, drawn in --accent with the strong glow applied in CSS. */
export function CelebrationMedal({ size = 132 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" class="medal-svg">
      {/* Ribbon */}
      <path d="M44 8 L54 56 L40 52 Z" fill="var(--accent)" opacity="0.85" />
      <path d="M76 8 L66 56 L80 52 Z" fill="var(--accent)" opacity="0.85" />
      <path d="M44 8 L60 14 L76 8 L66 40 L54 40 Z" fill="var(--accent-press)" />
      {/* Medallion */}
      <circle cx="60" cy="74" r="34" fill="none" stroke="var(--accent)" stroke-width="3.5" />
      <circle cx="60" cy="74" r="28" fill="rgba(var(--accent-rgb),0.08)" stroke="var(--accent)" stroke-width="1.5" />
      {/* Laurel wreath */}
      <g fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round">
        <path d="M40 92 C30 86 28 76 31 66" />
        <path d="M80 92 C90 86 92 76 89 66" />
        <path d="M34 70 q-4 2 -5 6 M33 78 q-4 2 -5 6 M37 86 q-4 2 -5 6" stroke-width="1.6" />
        <path d="M86 70 q4 2 5 6 M87 78 q4 2 5 6 M83 86 q4 2 5 6" stroke-width="1.6" />
      </g>
      {/* Claw mark in the center */}
      <g stroke="var(--accent)" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M52 60 Q56 74 53 88" />
        <path d="M60 58 Q63 74 60 89" />
        <path d="M68 60 Q70 74 67 88" />
      </g>
      {/* Small star at the foot of the ribbon */}
      <path d="M60 96 L62 101 L67 101.4 L63 104.5 L64.4 109.5 L60 106.7 L55.6 109.5 L57 104.5 L53 101.4 L58 101 Z" fill="var(--accent)" />
    </svg>
  );
}
