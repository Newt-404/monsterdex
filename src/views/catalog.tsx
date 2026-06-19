// Catalog tab (PRD §5.1): title, pinned search, By-line / A–Z / Z–A segmented
// toggle, live filter chips, and the By-line layout of open-by-default fixed-width
// horizontal swipe rows with per-line collapse. Search + chips filter live (M2);
// an active search/filter overrides collapse (a line with matches shows even if
// the user had collapsed it; collapse state is restored when the filter clears).
//
// Big-line layout (Ultra = 20) uses the same horizontal swipe row as every other
// line — consistent with the mockup and the "fixed-width cards, no stretch" rule.

import {
  catalogByLine,
  catalogSorted,
  collapsedLines,
  filterActive,
  openAddCustom,
  searchQuery,
  sortMode,
  toggleLineCollapsed,
  triedFilter,
  wishlistOnly,
  type SortMode,
} from '../store/state';
import { FlavorCard } from '../ui/flavor-card';
import { Claw } from '../can/claw';
import '../styles/catalog.css';

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'by-line', label: 'By line' },
  { id: 'az', label: 'A–Z' },
  { id: 'za', label: 'Z–A' },
  { id: 'rating', label: 'By rating' },
];

export function Catalog() {
  const mode = sortMode.value;
  return (
    <div class="catalog">
      <h1 class="screen-title display">Catalog</h1>

      {/* Pinned search — live filter over nameMain / nameTop / aliases (PRD §5.1) */}
      <div class="search-bar">
        <SearchIcon />
        <input
          class="search-input"
          type="search"
          placeholder="Search flavors…"
          aria-label="Search flavors"
          value={searchQuery.value}
          onInput={(e) => (searchQuery.value = (e.currentTarget as HTMLInputElement).value)}
        />
        <PinIcon />
      </div>

      {/* Sort/group segmented toggle */}
      <div class="segmented" role="tablist" aria-label="Sort and group">
        {SORTS.map(({ id, label }) => (
          <button
            class={`seg-btn${mode === id ? ' active' : ''}`}
            role="tab"
            aria-selected={mode === id}
            onClick={() => (sortMode.value = id)}
          >
            {label}
          </button>
        ))}
      </div>

      <FilterChips />

      {mode === 'by-line' ? <ByLine /> : <FlatGrid />}

      <button class="add-custom" onClick={openAddCustom}>
        <PlusIcon /> Add custom flavor
      </button>
    </div>
  );
}

function ByLine() {
  // An active search/filter overrides collapse (PRD §5.1): show every matching
  // line expanded; restore the user's collapse state once the filter clears.
  const overrideCollapse = filterActive.value;
  return (
    <>
      {catalogByLine.value.map(({ line, flavors }) => {
        const collapsed = !overrideCollapse && collapsedLines.value.has(line);
        return (
          <section class="line-section" key={line}>
            <button
              class="line-header"
              onClick={() => toggleLineCollapsed(line)}
              aria-expanded={!collapsed}
            >
              <Claw fill="var(--accent)" size={22} />
              <span class="line-name display">{line}</span>
              <span class="line-count">{flavors.length}</span>
              <span class={`chevron${collapsed ? ' collapsed' : ''}`}>
                <ChevronIcon />
              </span>
            </button>
            {!collapsed ? (
              <div class="swipe-row no-scrollbar">
                {flavors.map((f) => (
                  <FlavorCard flavor={f} key={f.slug} />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}

function FlatGrid() {
  return (
    <div class="az-grid">
      {catalogSorted.value.map((f) => (
        <FlavorCard flavor={f} compact key={f.slug} />
      ))}
    </div>
  );
}

function FilterChips() {
  const tried = triedFilter.value;
  return (
    <div class="chips no-scrollbar">
      <button
        class={`chip${tried === 'tried' ? ' active' : ''}`}
        onClick={() => (triedFilter.value = tried === 'tried' ? 'all' : 'tried')}
      >
        <CheckOutline /> Tried
      </button>
      <button
        class={`chip${tried === 'untried' ? ' active' : ''}`}
        onClick={() => (triedFilter.value = tried === 'untried' ? 'all' : 'untried')}
      >
        <CircleOutline /> Not-tried
      </button>
      <button
        class={`chip${wishlistOnly.value ? ' active' : ''}`}
        onClick={() => (wishlistOnly.value = !wishlistOnly.value)}
      >
        <HeartOutline /> Wishlist
      </button>
    </div>
  );
}

// ── inline icons ─────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--text-3)" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" stroke-linecap="round" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--accent)" aria-hidden="true">
      <path d="M14 3l7 7-3 1-3 3-1 5-2-2-4 4-1-1 4-4-2-2 5-1 3-3z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function CheckOutline() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9" />
    </svg>
  );
}
function CircleOutline() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
function HeartOutline() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
