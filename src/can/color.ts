// Color math for the parametric can (PRD §8). The can body is recolored by setting
// `--can-color` to the flavor's `accentColor`; cylinder shading is done with
// semi-transparent black/white overlays in the SVG (inherently luminance-aware —
// they shade white/silver and very dark cans into greys without naive lighten/
// darken). The only thing computed here is the auto-contrast ink.

const INK_DARK = '#0B0B0C'; // near-black (tokens --on-accent / --bg)
const INK_LIGHT = '#FFFFFF';

interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Auto-contrast `{INK}` (PRD §8): near-black on light/bright accents, white on
 * dark accents. Threshold chosen so mid-tone Monster greens take dark ink.
 * M6: 0.42 is an eyeballed cut; tune it (or move to a contrast-ratio test)
 * against the real `accentColor` set during the M6 hex pass.
 */
export function ink(hex: string): string {
  return luminance(hex) > 0.42 ? INK_DARK : INK_LIGHT;
}
