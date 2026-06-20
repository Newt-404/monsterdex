// Parametric SVG can (PRD §8 / CAN_SVG template). Geometry is shared once in
// <CanDefs>; each instance is just the recolor vars (--can-color / --ink / --claw), <use>s
// of the shared parts, and the per-flavor text. Drawn at runtime, no per-flavor
// assets.

import { ink } from './color';
import type { Flavor } from '../types';
import './can.css';

interface CanProps {
  flavor: Pick<Flavor, 'accentColor' | 'clawColor' | 'nameTop' | 'nameMain' | 'line' | 'alcoholic'>;
  /** Rendered pixel width; the SVG scales to it (viewBox is fixed at 190×369). */
  width?: number;
}

const VB_W = 190;
const VB_H = 369;

export function Can({ flavor, width = 120 }: CanProps) {
  const { accentColor, clawColor, nameTop, nameMain, line, alcoholic } = flavor;
  const mainLines = splitName(nameMain);
  const mainYs = mainLines.length === 2 ? [245, 268] : [256];

  return (
    <svg
      class="can-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={(width * VB_H) / VB_W}
      style={`--can-color:${accentColor};--ink:${ink(accentColor)};--claw:${clawColor ?? ink(accentColor)}`}
      role="img"
      aria-label={`${nameTop ? nameTop + ' ' : ''}${nameMain} — ${line}`}
    >
      {/* soft contact shadow */}
      <ellipse cx="95" cy="356" rx="74" ry="10" fill="url(#can-undershadow)" />
      {/* base body color */}
      <use class="can-fill" href="#can-shape" />
      {/* shading, bottom rim, lid, claw — shared geometry */}
      <use href="#can-overlays" />
      <use href="#can-bottom" />
      <use href="#can-lid" />
      <use href="#can-claw-logo" />

      {/* text */}
      {nameTop ? (
        <text class="can-label-sm" x="95" y="72" font-size="7.4" textLength={fitTop(nameTop)} lengthAdjust="spacingAndGlyphs">
          {nameTop.toUpperCase()}
        </text>
      ) : null}
      {mainLines.map((ln, i) => (
        <text
          class="can-label"
          x="95"
          y={mainYs[i]}
          font-size="22"
          textLength={fitMain(ln)}
          lengthAdjust="spacingAndGlyphs"
        >
          {ln}
        </text>
      ))}
      <text class="can-label-sm" x="95" y="298" font-size="9" textLength={fitLine(line)} lengthAdjust="spacingAndGlyphs">
        {line}
      </text>

      {/* alcoholic on-can tag (PRD §5.1) */}
      {alcoholic ? (
        <text class="can-label-sm" x="95" y="316" font-size="6.4" opacity="0.7">
          ALC
        </text>
      ) : null}
    </svg>
  );
}

// Split nameMain into ≤2 balanced, uppercased lines (single words stay one line).
function splitName(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return [name.toUpperCase()];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].map((s) => s.toUpperCase());
}

// Name fitting (PRD §8). `textLength` is applied ONLY to compress a name that would
// overflow the body — short names keep their natural width and are never stretched (the
// old binary length≥8 rule force-stretched medium names to a fixed width). We can't
// measure SVG text without the DOM, so width is estimated from glyph count × advance:
// Anton is heavily condensed, so uppercase advance ≈ 0.56em, plus the per-glyph letter-
// spacing each label carries. The advance constant is confirmed on-device in Phase D
// with the bundled font; erring slightly high just compresses borderline names a hair.
const ANTON_ADVANCE = 0.56; // em, uppercase
function fitWidth(text: string, fontSize: number, spacing: number, max: number): number | undefined {
  const n = text.length;
  const est = n * fontSize * ANTON_ADVANCE + Math.max(0, n - 1) * spacing;
  return est > max ? max : undefined; // compress to fit; otherwise natural (no stretch)
}
// Body inner width is ~135u; usable widths back off from the curved edges. Letter-spacing
// matches the .can-label / .can-label-sm rules in can.css (0.5 / 2.4).
function fitMain(line: string): number | undefined {
  return fitWidth(line, 22, 0.5, 124);
}
function fitTop(top: string): number | undefined {
  return fitWidth(top.toUpperCase(), 7.4, 2.4, 132);
}
function fitLine(line: string): number | undefined {
  return fitWidth(line, 9, 2.4, 128);
}
