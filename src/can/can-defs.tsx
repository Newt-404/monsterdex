// Shared, color-independent can geometry (from the CAN_SVG template). Rendered
// ONCE near the app root; every <Can> instance <use>s these by id and recolors via
// the inherited --can-color / --ink CSS vars. Defining them once (instead of
// inlining per card) keeps the DOM light across 82 cans and avoids the template's
// "suffix every id per instance" id-clash problem — there is only one copy.

import { CLAW_PATHS } from './claw';

// Can silhouette in the native 190×369 space.
const CAN_SHAPE_D =
  'M 41 43 C 50 50 140 50 150 43 C 159 49 163 56 163 70 L 163 314 C 163 335 146 345 121 348 C 105 350 85 350 69 348 C 44 345 28 335 28 314 L 28 70 C 28 56 32 49 41 43 Z';

export function CanDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style="position:absolute">
      <defs>
        <path id="can-shape" d={CAN_SHAPE_D} />
        <clipPath id="can-clip">
          <use href="#can-shape" />
        </clipPath>

        {/* Horizontal cylinder shading — black edges → faint highlights → black edges */}
        <linearGradient id="can-edge-shade" x1="28" y1="0" x2="163" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#000" stop-opacity="0.25" />
          <stop offset="0.08" stop-color="#000" stop-opacity="0.06" />
          <stop offset="0.32" stop-color="#fff" stop-opacity="0.09" />
          <stop offset="0.50" stop-color="#fff" stop-opacity="0.00" />
          <stop offset="0.74" stop-color="#fff" stop-opacity="0.08" />
          <stop offset="0.92" stop-color="#000" stop-opacity="0.07" />
          <stop offset="1" stop-color="#000" stop-opacity="0.25" />
        </linearGradient>
        {/* Vertical top-highlight / bottom-shade */}
        <linearGradient id="can-vshade" x1="0" y1="43" x2="0" y2="348" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fff" stop-opacity="0.11" />
          <stop offset="0.12" stop-color="#fff" stop-opacity="0.02" />
          <stop offset="0.84" stop-color="#000" stop-opacity="0.00" />
          <stop offset="1" stop-color="#000" stop-opacity="0.20" />
        </linearGradient>
        <radialGradient id="can-undershadow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#000" stop-opacity="0.55" />
          <stop offset="1" stop-color="#000" stop-opacity="0" />
        </radialGradient>

        {/* Shading overlays, clipped to the body */}
        <g id="can-overlays" clip-path="url(#can-clip)">
          <rect x="28" y="43" width="135" height="305" fill="url(#can-edge-shade)" />
          <rect x="28" y="43" width="135" height="305" fill="url(#can-vshade)" />
          <path d="M 72 49 C 78 87 77 135 73 182 C 71 211 73 256 76 309" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="6" />
          <path d="M 88 50 C 96 92 95 137 89 181 C 87 202 89 255 95 318" fill="none" stroke="#fff" stroke-opacity="0.16" stroke-width="12" />
          <path d="M 101 55 C 111 96 110 146 103 190" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="5" />
          <path d="M 29 315 C 45 325 61 329 95 330 C 129 329 147 325 162 315 L 162 349 L 28 349 Z" fill="#000" opacity="0.10" />
        </g>

        {/* Bottom rim */}
        <g id="can-bottom">
          <path d="M 49 338 C 63 346 126 346 141 338 C 133 349 57 349 49 338 Z" fill="#111" opacity="0.95" />
          <path d="M 59 343 C 75 347 116 347 132 343" fill="none" stroke="#2c2c2c" stroke-width="0.8" opacity="0.7" />
        </g>

        {/* Recessed lid with metallic rim + pull tab */}
        <g id="can-lid">
          <ellipse cx="95" cy="42.4" rx="60.4" ry="21.1" fill="#1a1a1a" stroke="#3d3d3d" stroke-width="1.05" />
          <ellipse cx="95" cy="39.1" rx="56.5" ry="17.6" fill="#080808" stroke="#272727" stroke-width="1.1" />
          <ellipse cx="95" cy="38.2" rx="48.2" ry="13.0" fill="#0a0a0a" stroke="#1f1f1f" stroke-width="0.8" />
          <path d="M 43 42 C 55 55 135 55 147 42" fill="none" stroke="#303030" stroke-width="1" opacity="0.95" />
          <path d="M 48 36 C 61 26 130 26 143 36" fill="none" stroke="#3c3c3c" stroke-width="0.8" opacity="0.65" />
          <path d="M 83.6 35.0 C 93.0 30.6 118.0 31.0 129.8 36.7 C 120.2 39.5 104.8 40.0 92.8 38.1 C 89.1 37.5 86.5 36.5 83.6 35.0 Z" fill="#181818" stroke="#393939" stroke-width="0.8" />
          <path d="M 99.0 34.7 C 108.3 33.3 119.6 34.2 124.7 37.0 C 116.1 38.5 104.2 38.4 97.4 36.6 C 97.7 35.8 98.1 35.2 99.0 34.7 Z" fill="#090909" stroke="#303030" stroke-width="0.65" />
          <path d="M 73 30 C 89 25 115 25 132 30" fill="none" stroke="#4a4a4a" stroke-width="0.7" opacity="0.4" />
        </g>

        {/* Claw — filled with the can's ink via the .can-claw class */}
        <g id="can-claw-logo" class="can-claw">
          {CLAW_PATHS.map((d) => (
            <path d={d} />
          ))}
        </g>
      </defs>
    </svg>
  );
}
