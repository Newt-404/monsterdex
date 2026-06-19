// Bottom tab bar (PRD §4): Catalog / Dashboard / Profile. Active icon + label in
// --accent with a top indicator line; inactive in --text-2 (tokens §5).

import { activeTab, navigate, type Tab } from '../store/state';
import { Claw } from '../can/claw';

const TABS: { id: Tab; label: string }[] = [
  { id: 'catalog', label: 'Catalog' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profile' },
];

export function TabBar() {
  const active = activeTab.value;
  return (
    <nav class="tab-bar">
      {TABS.map(({ id, label }) => {
        const on = active === id;
        const color = on ? 'var(--accent)' : 'var(--text-2)';
        return (
          <button class={`tab${on ? ' active' : ''}`} onClick={() => navigate(id)} aria-current={on ? 'page' : undefined}>
            <span class="tab-indicator" />
            {id === 'catalog' ? <Claw fill={color} size={26} /> : null}
            {id === 'dashboard' ? <GaugeIcon color={color} /> : null}
            {id === 'profile' ? <PersonIcon color={color} /> : null}
            <span class="tab-label" style={`color:${color}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function GaugeIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round">
      <path d="M3.5 16a8.5 8.5 0 0 1 17 0" />
      <path d="M12 16l4-4" />
      <circle cx="12" cy="16" r="1.4" fill={color} stroke="none" />
    </svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}
