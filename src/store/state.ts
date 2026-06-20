import { signal, computed } from '@preact/signals';
import {
  EMPTY_STATE,
  isTried,
  LINE_ORDER,
  type Custom,
  type Flavor,
  type FlavorState,
} from '../types';
import {
  deleteCustomRecord,
  deletePhoto,
  getAllCustoms,
  getAllFlavorStates,
  getAllUnlockLog,
  getKv,
  putCustom,
  putFlavorState,
  putKv,
  putPhoto,
  SCHEMA_VERSION,
  type UnlockEntry,
} from './db';
import { compressImage } from './photo';

// ── Tab / detail navigation (hash-driven; no router — architecture §1) ───────
export type Tab = 'catalog' | 'dashboard' | 'profile';
const TABS: Tab[] = ['catalog', 'dashboard', 'profile'];
const FLAVOR_PREFIX = 'flavor/';

export const activeTab = signal<Tab>('catalog');
/** Slug of the flavor detail screen pushed over the catalog, or null. */
export const detailSlug = signal<string | null>(null);

// Did *we* push the current detail entry (vs. a cold deep-link straight into a
// flavor)? Only then is it safe to pop history on close — otherwise history.back()
// could leave MonsterDex entirely. Reset whenever we land back on a tab.
let pushedDetail = false;

function applyHash(): void {
  const h = decodeURIComponent(location.hash.replace(/^#/, ''));
  if (h.startsWith(FLAVOR_PREFIX)) {
    // Detail is an overlay: keep the underlying tab (catalog) as-is.
    detailSlug.value = h.slice(FLAVOR_PREFIX.length);
    return;
  }
  detailSlug.value = null;
  pushedDetail = false; // back on a tab — any detail we pushed has been popped
  activeTab.value = (TABS as string[]).includes(h) ? (h as Tab) : 'catalog';
}

applyHash();
window.addEventListener('hashchange', applyHash);

export function navigate(tab: Tab): void {
  activeTab.value = tab;
  if (location.hash !== `#${tab}`) location.hash = tab;
}

/** Push the flavor detail screen (a new history entry, so iOS back pops it). */
export function openFlavor(slug: string): void {
  pushedDetail = true;
  location.hash = `${FLAVOR_PREFIX}${encodeURIComponent(slug)}`;
}

/** Close the detail screen. If we pushed it, pop history (clean, plays nice with
 *  the iOS back gesture). On a cold deep-link we never pushed, so switch to the
 *  catalog via a hash change rather than history.back() — which could exit the site. */
export function closeFlavor(): void {
  if (pushedDetail && history.length > 1) history.back();
  else navigate('catalog');
}

// ── Built-in catalog ─────────────────────────────────────────────────────────
export const catalog = signal<Flavor[]>([]);

// ── User state (architecture §3 — hydrated on boot, write-through after) ──────
export const flavorStates = signal<Record<string, FlavorState>>({});
export const customs = signal<Custom[]>([]);
/** Counter feature toggle (PRD §5.4). No Settings UI until later; default on. */
export const counterEnabled = signal<boolean>(true);

// ── Badge-engine inputs (architecture §4) ─────────────────────────────────────
/** Unlock log: badgeId → first-earned entry. Source of truth for celebrate-once
 *  and for the lit state of permanent badges (architecture §4). Hydrated on boot;
 *  the engine writes through on first-earn. */
export const unlockLog = signal<Record<string, UnlockEntry>>({});
/** Backups taken (kv meta). Feeds Better Safe / Hoarder; incremented by M5 backup. */
export const backupCount = signal<number>(0);
/** First-launch timestamp (kv meta, architecture §8). Feeds The Origin; set by the
 *  M6 first-launch flow — null (and so The Origin stays locked) until then. */
export const firstLaunchDate = signal<string | null>(null);

/** Current user record for a slug (the cold-start zero state if untouched). */
export function stateOf(slug: string): FlavorState {
  return flavorStates.value[slug] ?? EMPTY_STATE;
}

// ── Catalog union (built-ins ∪ customs; customs are full members, PRD §5.5) ───

/** Project a stored Custom into a full runtime Flavor (synthesising the catalog-
 *  only reference fields it doesn't store). Customs are treated as verified —
 *  the user chose the colour, so it needs no M6 hex tuning. */
function customToFlavor(c: Custom): Flavor {
  return {
    slug: c.slug,
    line: c.line,
    nameMain: c.nameMain,
    nameTop: c.nameTop,
    accentColor: c.accentColor,
    accentConfidence: 'verified',
    markets: '',
    aliases: [],
    uncertain: false,
    alcoholic: c.alcoholic,
    source: '',
  };
}

/** Every flavor the app knows about — the denominator N and every badge read this. */
export const allFlavors = computed<Flavor[]>(() => [
  ...catalog.value,
  ...customs.value.map(customToFlavor),
]);

export function findFlavor(slug: string): Flavor | undefined {
  return allFlavors.value.find((f) => f.slug === slug);
}

export function findCustom(slug: string): Custom | undefined {
  return customs.value.find((c) => c.slug === slug);
}

// ── Boot hydrate (architecture §3: once, then run silently) ───────────────────
export async function boot(): Promise<void> {
  // The catalog is bundled and network-free — paint it the moment it parses, never
  // gated behind the IndexedDB hydrate. iOS can throttle or evict IDB; a slow/failed
  // `open` must degrade to "no user state yet", not blank the whole catalog.
  const res = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`);
  catalog.value = (await res.json()) as Flavor[];

  const [states, cs, counter, log, backups, firstLaunch] = await Promise.all([
    getAllFlavorStates(),
    getAllCustoms(),
    getKv('counterEnabled', true),
    getAllUnlockLog(),
    getKv<number>('backupCount', 0),
    getKv<string | null>('firstLaunchDate', null),
  ]);
  flavorStates.value = states;
  customs.value = cs;
  counterEnabled.value = counter;
  unlockLog.value = log;
  backupCount.value = backups;
  firstLaunchDate.value = firstLaunch;

  // Stamp the schema version on first boot (drives M5 migration); harmless if set.
  void putKv('schemaVersion', SCHEMA_VERSION);
  // The badge engine is started by the app shell once this hydrate resolves
  // (its first pass back-fills lit state silently — architecture §3/§4).
}

// ── Write-through mutations ───────────────────────────────────────────────────
// Each updates the in-memory signal optimistically (UI reacts instantly) and
// persists async. The badge engine re-evaluates on its own: it is a signals
// `effect` over the derived snapshot (badges/engine.ts), so any state change here
// re-runs it for free — no per-mutation wiring needed.

function patch(slug: string, partial: Partial<FlavorState>): FlavorState {
  const next = { ...(flavorStates.value[slug] ?? EMPTY_STATE), ...partial };
  flavorStates.value = { ...flavorStates.value, [slug]: next };
  void putFlavorState(slug, next);
  return next;
}

/** Set a half-star rating (1–10) or clear it (null). Rating a wishlisted flavor
 *  auto-clears its wishlist flag (PRD §5.3); clearing the rating does not. */
export function setRating(slug: string, rating: number | null): void {
  const current = stateOf(slug);
  const partial: Partial<FlavorState> = { rating };
  if (rating !== null && current.wishlist) partial.wishlist = false;
  // You can't rate what you haven't had — a first rating implies at least one can.
  // Only seed the count from 0; never auto-bump an existing tally, and clearing a
  // rating leaves the count alone (clearing a rating ≠ "never had it").
  if (rating !== null && current.count === 0) partial.count = 1;
  patch(slug, partial);
}

export function setReview(slug: string, review: string): void {
  patch(slug, { review });
}

export function incrementCount(slug: string): void {
  patch(slug, { count: stateOf(slug).count + 1 });
}

export function decrementCount(slug: string): void {
  patch(slug, { count: Math.max(0, stateOf(slug).count - 1) }); // clamped at 0 (PRD §5.2)
}

export function toggleWishlist(slug: string): void {
  patch(slug, { wishlist: !stateOf(slug).wishlist });
}

/** Compress + store a picked photo, then flag the (blob-free) state record.
 *  Rejects on compress/write failure so the caller can surface it in isolation. */
export async function setPhoto(slug: string, file: File): Promise<void> {
  const blob = await compressImage(file);
  await putPhoto(slug, blob);
  patch(slug, { hasPhoto: true });
}

export async function removePhoto(slug: string): Promise<void> {
  await deletePhoto(slug);
  patch(slug, { hasPhoto: false });
}

// ── Custom flavors (PRD §5.5) ─────────────────────────────────────────────────

export type CustomInput = Omit<Custom, 'slug'>;

export function addCustom(input: CustomInput): Custom {
  const custom: Custom = { slug: `custom-${crypto.randomUUID()}`, ...input };
  customs.value = [...customs.value, custom];
  void putCustom(custom);
  return custom;
}

export function editCustom(slug: string, input: CustomInput): void {
  const updated: Custom = { slug, ...input };
  customs.value = customs.value.map((c) => (c.slug === slug ? updated : c));
  void putCustom(updated);
}

/** Delete a custom: drop its definition, user record, and photo (PRD §5.5). */
export function deleteCustom(slug: string): void {
  customs.value = customs.value.filter((c) => c.slug !== slug);
  if (flavorStates.value[slug]) {
    const next = { ...flavorStates.value };
    delete next[slug];
    flavorStates.value = next;
  }
  void deleteCustomRecord(slug);
}

// ── Custom add/edit editor overlay state ─────────────────────────────────────
/** null = closed; {} = add; { slug } = edit that custom. */
export const customEditor = signal<{ slug?: string } | null>(null);
export function openAddCustom(): void {
  customEditor.value = {};
}
export function openEditCustom(slug: string): void {
  customEditor.value = { slug };
}
export function closeCustomEditor(): void {
  customEditor.value = null;
}

// ── Catalog grouping / sorting ────────────────────────────────────────────────
export type SortMode = 'by-line' | 'az' | 'za' | 'rating';
export const sortMode = signal<SortMode>('by-line');

// ── Live filters + search (PRD §5.1) ─────────────────────────────────────────
export const searchQuery = signal<string>('');
/** Tri-state tried filter driven by the Tried / Not-tried chips. */
export const triedFilter = signal<'all' | 'tried' | 'untried'>('all');
export const wishlistOnly = signal<boolean>(false);

/** An active search or filter overrides per-line collapse (PRD §5.1). */
export const filterActive = computed<boolean>(
  () =>
    searchQuery.value.trim() !== '' ||
    triedFilter.value !== 'all' ||
    wishlistOnly.value,
);

function matchesSearch(f: Flavor, q: string): boolean {
  if (!q) return true;
  const hay = [f.nameMain, f.nameTop, ...f.aliases].join(' ').toLowerCase();
  return hay.includes(q);
}

/** The live filter predicate, applied in every layout. */
function matches(f: Flavor): boolean {
  const q = searchQuery.value.trim().toLowerCase();
  if (!matchesSearch(f, q)) return false;
  const st = stateOf(f.slug);
  if (triedFilter.value === 'tried' && !isTried(st)) return false;
  if (triedFilter.value === 'untried' && isTried(st)) return false;
  if (wishlistOnly.value && !st.wishlist) return false;
  return true;
}

function lineRank(line: string): number {
  const i = LINE_ORDER.indexOf(line);
  return i === -1 ? LINE_ORDER.length : i;
}

/** Catalog grouped by line (PRD §5.1 order), filtered; empty lines drop out. */
export const catalogByLine = computed<{ line: string; flavors: Flavor[] }[]>(() => {
  const groups = new Map<string, Flavor[]>();
  for (const f of allFlavors.value) {
    if (!matches(f)) continue;
    const g = groups.get(f.line);
    if (g) g.push(f);
    else groups.set(f.line, [f]);
  }
  return [...groups.entries()]
    .sort((a, b) => lineRank(a[0]) - lineRank(b[0]))
    .map(([line, flavors]) => ({ line, flavors }));
});

function byName(a: Flavor, b: Flavor): number {
  return a.nameMain.localeCompare(b.nameMain, undefined, { sensitivity: 'base', numeric: true });
}

/** Flat list for the non-By-line sorts, filtered: A–Z / Z–A on nameMain (PRD §5.1),
 *  or By rating — highest first, with unrated flavors last and name as tiebreak. */
export const catalogSorted = computed<Flavor[]>(() => {
  const list = allFlavors.value.filter(matches);
  if (sortMode.value === 'rating') {
    return list.sort((a, b) => {
      const ra = stateOf(a.slug).rating ?? -1; // unrated → bottom
      const rb = stateOf(b.slug).rating ?? -1;
      return rb - ra || byName(a, b);
    });
  }
  const dir = sortMode.value === 'za' ? -1 : 1;
  return list.sort((a, b) => dir * byName(a, b));
});

// ── Per-line collapse (transient UI state; localStorage, not IndexedDB) ───────
const COLLAPSE_KEY = 'monsterdex:collapsed-lines';

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* corrupt/unavailable storage → start expanded */
  }
  return new Set();
}

export const collapsedLines = signal<ReadonlySet<string>>(loadCollapsed());

export function toggleLineCollapsed(line: string): void {
  const next = new Set(collapsedLines.value);
  if (next.has(line)) next.delete(line);
  else next.add(line);
  collapsedLines.value = next;
  try {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
  } catch {
    /* storage full/unavailable → persistence is best-effort */
  }
}
