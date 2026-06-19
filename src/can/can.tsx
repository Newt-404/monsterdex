// Parametric SVG can (PRD §8 / CAN_SVG template). Geometry is shared once in
// <CanDefs>; each instance is just the recolor vars (--can-color / --ink), <use>s
// of the shared parts, and the per-flavor text. Drawn at runtime, no per-flavor
// assets.

import { ink } from './color';
import type { Flavor } from '../types';
import './can.css';

interface CanProps {
  flavor: Pick<Flavor, 'accentColor' | 'nameTop' | 'nameMain' | 'line' | 'alcoholic'>;
  /** Rendered pixel width; the SVG scales to it (viewBox is fixed at 190×369). */
  width?: number;
}

const VB_W = 190;
const VB_H = 369;

export function Can({ flavor, width = 120 }: CanProps) {
  const { accentColor, nameTop, nameMain, line, alcoholic } = flavor;
  const mainLines = splitName(nameMain);
  const mainYs = mainLines.length === 2 ? [245, 268] : [256];

  return (
    <svg
      class="can-svg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width={width}
      height={(width * VB_H) / VB_W}
      style={`--can-color:${accentColor};--ink:${ink(accentColor)}`}
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

// textLength fits text to the body width. Applied only when a line is long enough
// to risk overflow; short lines keep their natural width (no stretching).
// M6: refine to a true measured max-fit during the can visual pass.
const MAIN_FIT = 120;
const SMALL_FIT = 128;
function fitMain(line: string): number | undefined {
  return line.length >= 8 ? MAIN_FIT : undefined;
}
function fitTop(top: string): number | undefined {
  return top.length > 10 ? SMALL_FIT : undefined;
}
function fitLine(line: string): number | undefined {
  return line.length > 9 ? SMALL_FIT : undefined;
}
