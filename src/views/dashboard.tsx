// Dashboard tab (PRD §5.8, mockup-dashboard.png). Every number derives from
// `dashboardStats` (the live catalog union + user state) — nothing hard-coded.
// Customs fold into both the tried count and N (no separate "+custom" readout,
// PRD §5.5). Count-derived cards (Cans Logged / Most Drunk) hide — never delete —
// when counting is off (PRD §5.4). Empty averages render as "—", never NaN/0.

import type { ComponentChildren } from 'preact';
import { dashboardStats, type RankedFlavor } from '../store/stats';
import { counterEnabled } from '../store/state';
import { FlavorImage } from '../can/flavor-image';
import { Stars, StarGlyph } from '../ui/stars';
import { Claw } from '../can/claw';
import { OTHER_LINE } from '../types';
import '../styles/dashboard.css';

/** Stars take a half-star integer; map a 0–5 average onto the nearest half-star. */
function halfStars(avg: number): number {
  return Math.round(avg * 2);
}
/** "—" for an unrated scope, else the average to `places` decimals. */
function fmtAvg(avg: number | null, places: number): string {
  return avg === null ? '—' : avg.toFixed(places);
}

export function Dashboard() {
  const s = dashboardStats.value;
  const counting = counterEnabled.value;

  return (
    <div class="dashboard">
      <h1 class="screen-title display">Dashboard</h1>

      {/* ── Progress ──────────────────────────────────────────────────────── */}
      <section class="panel dash-progress">
        <span class="dash-label">Your Progress</span>
        <p class="dash-progress-line">
          Tried <b>{s.tried}</b> of <b>{s.total}</b>
          <span class="dash-dot"> · </span>
          <span class="dash-pct">{s.pct}%</span>
        </p>
        <div class="bar" role="progressbar" aria-valuenow={s.pct} aria-valuemin={0} aria-valuemax={100}>
          <div class="bar-fill" style={`width:${s.pct}%`} />
        </div>
      </section>

      {/* ── Average rating | Rating distribution ──────────────────────────── */}
      <div class="dash-grid">
        <section class="panel dash-avg">
          <span class="dash-label">Average Rating</span>
          <div class="dash-bignum display">{fmtAvg(s.avg, 2)}</div>
          <Stars rating={s.avg === null ? null : halfStars(s.avg)} size={22} />
          <span class="dash-sub">
            {s.ratedCount > 0 ? `based on ${s.ratedCount} rated` : 'nothing rated yet'}
          </span>
        </section>

        <section class="panel dash-dist">
          <span class="dash-label">Rating Distribution</span>
          <div class="dist-rows">
            {s.distribution.map((d) => (
              <div class="dist-row" key={d.star}>
                <span class="dist-star">
                  {d.star}
                  <StarGlyph size={11} />
                </span>
                <div class="bar dist-bar">
                  <div class="bar-fill" style={`width:${d.pct}%`} />
                </div>
                <span class="dist-pct">{d.pct}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Top flavors | By line ─────────────────────────────────────────── */}
      <div class="dash-grid">
        <section class="panel dash-top">
          <span class="dash-label">Top Flavors</span>
          {s.topFlavors.length === 0 ? (
            <p class="dash-empty">Rate a flavor to see your top picks.</p>
          ) : (
            <ol class="rank-list">
              {s.topFlavors.map((r, i) => (
                <RankRow key={r.flavor.slug} rank={i + 1} r={r}>
                  <span class="rank-val">{r.value.toFixed(1)}</span>
                </RankRow>
              ))}
            </ol>
          )}
          {/* Visual-parity link to a future "all top flavors" screen (not wired yet). */}
          {s.topFlavors.length > 0 ? (
            <div class="dash-viewall caption">View all top flavors ›</div>
          ) : null}
        </section>

        <section class="panel dash-byline">
          <span class="dash-label">By Line</span>
          <div class="byline-head">
            <span>Line</span>
            <span class="byline-tried">Tried</span>
            <span class="byline-avg">Avg</span>
          </div>
          <div class="byline-rows">
            {s.lines.map((l) => (
              <div class="byline-row" key={l.line}>
                <span class="byline-name">
                  {l.isCustomBucket ? (
                    <FlaskIcon />
                  ) : (
                    <Claw fill="var(--accent)" size={18} class="byline-claw" />
                  )}
                  <span class="byline-line">{l.line === OTHER_LINE ? 'Custom' : l.line}</span>
                </span>
                <span class="byline-tried">
                  <span class="bt-num">{l.tried}</span>
                  <span class="bt-sep">/</span>
                  <span class="bt-den">{l.total}</span>
                </span>
                <span class="byline-avg">
                  <b>{fmtAvg(l.avg, 2)}</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Cans logged | Most drunk (counter-gated, PRD §5.4) ─────────────── */}
      {counting ? (
        <div class="dash-grid">
          <section class="panel dash-cans">
            <span class="dash-label">Cans Logged</span>
            <div class="dash-cans-row">
              <span class="dash-bignum display">{s.totalCans}</span>
              <CanOutline />
            </div>
            <span class="dash-sub">Total cans you've logged</span>
          </section>

          <section class="panel dash-drunk">
            <span class="dash-label">Most Drunk</span>
            {s.mostDrunk.length === 0 ? (
              <p class="dash-empty">Log a can to see your most-drunk flavors.</p>
            ) : (
              <ol class="rank-list">
                {s.mostDrunk.map((r, i) => (
                  <RankRow key={r.flavor.slug} rank={i + 1} r={r}>
                    <span class="rank-val">{r.value}</span>
                  </RankRow>
                ))}
              </ol>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

/** A ranked flavor row: index, can thumbnail, name, then a caller-supplied value. */
function RankRow({ rank, r, children }: { rank: number; r: RankedFlavor; children: ComponentChildren }) {
  return (
    <li class="rank-row">
      <span class="rank-num display">{rank}</span>
      <span class="rank-thumb">
        <FlavorImage flavor={r.flavor} width={22} />
      </span>
      <span class="rank-name display">{r.flavor.nameMain}</span>
      {children}
    </li>
  );
}

/** Line-less "Other" customs bucket marker (PRD §5.8) — a flask, per the mockup. */
function FlaskIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="byline-claw">
      <path
        d="M9 3h6M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3"
        fill="none"
        stroke="var(--accent)"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M7.5 14h9" fill="none" stroke="var(--accent)" stroke-width="1.7" stroke-linecap="round" />
    </svg>
  );
}

/** Decorative neon-green outlined can beside the Cans-Logged number (mockup). */
function CanOutline() {
  return (
    <svg viewBox="0 0 40 64" width="40" height="64" aria-hidden="true" class="dash-can-outline">
      <rect x="2" y="6" width="36" height="56" rx="7" fill="none" stroke="var(--accent)" stroke-width="2.5" />
      <rect x="11" y="1.5" width="18" height="6" rx="2" fill="none" stroke="var(--accent)" stroke-width="2" />
    </svg>
  );
}
