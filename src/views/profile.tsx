// Profile tab (PRD §5.9, mockup-profile.png) — header + 2–3 headline stats (M3) plus
// the M4 achievements grid (the 79 §5.11 badges). The gear→Settings wiring lands in
// M5; the gear is shown for header parity but is intentionally inert.
// The Cans-Logged headline hides when counting is off (PRD §5.4), leaving 2 stats.

import { dashboardStats, fmtAvg } from '../store/stats';
import { counterEnabled } from '../store/state';
import { badgeTotal, badgeViews, unlockedCount } from '../badges/engine';
import { BadgeTile } from '../ui/badge-tile';
import { StarGlyph } from '../ui/stars';
import '../styles/profile.css';

export function Profile() {
  const s = dashboardStats.value;
  const counting = counterEnabled.value;

  return (
    <div class="profile">
      <header class="profile-head">
        <h1 class="screen-title profile-title display">
          Bassie's
          <br />
          MonsterDex
        </h1>
        {/* Settings opens here in M5 (PRD §5.9/§5.10); inert until then. */}
        <button class="profile-gear" aria-label="Settings" disabled>
          <GearIcon />
        </button>
      </header>

      <section class="panel stat-strip">
        <div class="stat-cell">
          <span class="stat-cap caption">Flavors Tried</span>
          <span class="stat-num display">{s.tried}</span>
          <span class="stat-sub">/ {s.total}</span>
        </div>
        {counting ? (
          <div class="stat-cell">
            <span class="stat-cap caption">Cans Logged</span>
            <span class="stat-num display">{s.totalCans}</span>
            <span class="stat-sub">Total</span>
          </div>
        ) : null}
        <div class="stat-cell">
          <span class="stat-cap caption">Average Rating</span>
          <span class="stat-num display">
            {fmtAvg(s.avg, 1)}
            {s.avg !== null ? <StarGlyph size={22} class="stat-star" /> : null}
          </span>
          <span class="stat-sub">out of 5</span>
        </div>
      </section>

      <section class="achievements">
        <header class="ach-head">
          <TrophyIcon />
          <h2 class="ach-title display">Achievements</h2>
          <span class="ach-count caption">
            {unlockedCount.value} / {badgeTotal} Unlocked
          </span>
        </header>
        <div class="badge-grid">
          {badgeViews.value.map((v) => (
            <BadgeTile key={v.def.id} view={v} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      <path d="M12 14v3M9 20h6M10 20l.5-3h3l.5 3" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="var(--accent)" stroke-width="1.8" />
      <path
        d="M12 2.5l1.4 2.2 2.6-.5.6 2.6 2.4 1-.8 2.5 1.7 2-1.7 2 .8 2.5-2.4 1-.6 2.6-2.6-.5L12 21.5l-1.4-2.2-2.6.5-.6-2.6-2.4-1 .8-2.5-1.7-2 1.7-2-.8-2.5 2.4-1 .6-2.6 2.6.5z"
        fill="none"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  );
}
