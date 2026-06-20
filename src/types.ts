// Catalog + flavor types. The catalog schema is pinned by PRD §6.

export type AccentConfidence = 'verified' | 'estimated';

/** One catalog entry (built-in). Custom flavors reuse the same shape at runtime. */
export interface Flavor {
  slug: string;
  line: string;
  nameMain: string;
  nameTop: string; // "" if none
  accentColor: string;
  accentConfidence: AccentConfidence;
  /** Optional override for the claw/logo color; falls back to the auto-contrast
   *  ink(accentColor) when absent (see Can / can.css). */
  clawColor?: string;
  markets: string;
  aliases: string[];
  uncertain: boolean;
  alcoholic: boolean;
  source: string;
}

/**
 * Stored custom-flavor definition (architecture §3 `customs` store / backup §5.10).
 * The on-can/runtime fields the catalog also carries (markets, aliases, …) are
 * synthesised when a custom is projected into a {@link Flavor} — see
 * `customToFlavor` in the store. Slug is always `custom-{uuid}` (CLAUDE.md).
 */
export interface Custom {
  slug: string;
  nameMain: string;
  nameTop: string;
  line: string; // a real line, or "Other"
  accentColor: string;
  alcoholic: boolean;
}

/**
 * Per-flavor user record (architecture §3 `flavorState` store). Blob-free — the
 * photo lives in the split `photos` store, surfaced here only as `hasPhoto`.
 * Sparse: only touched flavors get a record; an absent record is this zero state.
 */
export interface FlavorState {
  rating: number | null; // half-star integer 1–10, or null when unrated (PRD §5.3)
  review: string;
  count: number; // ≥ 0
  wishlist: boolean;
  hasPhoto: boolean;
}

/** The genuine cold-start state for an untouched flavor. */
export const EMPTY_STATE: FlavorState = {
  rating: null,
  review: '',
  count: 0,
  wishlist: false,
  hasPhoto: false,
};

/** PRD §5.3: tried = rated OR logged at least once. Counter toggle never changes this. */
export function isTried(s: FlavorState): boolean {
  return s.rating !== null || s.count >= 1;
}

/** PRD §5.3: a "written review" is non-empty after trimming. */
export function hasWrittenReview(s: FlavorState): boolean {
  return s.review.trim().length > 0;
}

/** Custom slugs are UUID-namespaced; built-ins never start with this prefix. */
export function isCustom(slug: string): boolean {
  return slug.startsWith('custom-');
}

/** Line value for line-less customs (dashboard "Custom" bucket, PRD §5.8). */
export const OTHER_LINE = 'Other';

/**
 * Canonical line display order (PRD §5.1). Catalog sections render in this
 * order; any line not listed here would fall to the end.
 */
export const LINE_ORDER: readonly string[] = [
  'Original',
  'Ultra',
  'Juice',
  'Java',
  'Reserve',
  'Rehab',
  'Killer Brew',
  'Nitro',
  'Hydro',
  'Dragon Tea',
  'Punch',
  'The Beast Unleashed',
  'Nasty Beast',
];

/**
 * Sub-category label shown on a catalog card's line dot (design-tokens §1:
 * "ENERGY" / "JUICE" / "COFFEE"). Derived from the line since the catalog has no
 * explicit category field. (Mapping deferred for revisit when the updated catalog
 * lands.)
 */
export function categoryLabel(line: string): string {
  switch (line) {
    case 'Juice':
      return 'Juice';
    case 'Java':
    case 'Killer Brew':
      return 'Coffee';
    case 'Rehab':
    case 'Dragon Tea':
      return 'Tea';
    case 'The Beast Unleashed':
    case 'Nasty Beast':
      return 'Hard';
    default:
      return 'Energy';
  }
}
