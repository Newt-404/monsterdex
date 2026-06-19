// Profile tab (PRD §5.9, mockup-profile.png) — M3 builds the header + the 2–3
// headline stats only. The achievements grid + gear→Settings wiring land in
// M4 / M5; the gear is shown here for header parity but is intentionally inert.
// The Cans-Logged headline hides when counting is off (PRD §5.4), leaving 2 stats.

import { dashboardStats, countingOn } from '../store/stats';
import '../styles/profile.css';

function fmtAvg(avg: number | null, places: number): string {
  return avg === null ? '—' : avg.toFixed(places);
}

export function Profile() {
  const s = dashboardStats.value;
  const counting = countingOn.value;

  return (
    <div class="profile">
      <header class="profile-head">
        <h1 class="profile-title display">
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
            {s.avg !== null ? <Star10 /> : null}
          </span>
          <span class="stat-sub">out of 5</span>
        </div>
      </section>

      {/* Achievements grid lands in M4 (build plan: "header + headline stats, minus the grid"). */}
    </div>
  );
}

function Star10() {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22" aria-hidden="true" class="stat-star">
      <path d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 74 L21 94 L31 61 L4 40 L38 38 Z" fill="var(--accent)" />
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
