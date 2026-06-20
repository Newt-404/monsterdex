// IndexedDB layer (architecture §3). One database `monsterdex`, five stores, opened
// lazily via `idb`. All accessors are out-of-line keyed by `slug` (or `badgeId` /
// settings key) — values never embed their own key, except `customs` whose value
// (a Custom) carries `slug` for convenience.
//
// The signals store (state.ts) is the in-memory source of truth; this module is the
// async persistence behind write-through mutations and the one-time boot hydrate.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Custom, FlavorState } from '../types';

/** Achievement unlock-log entry (architecture §4 / §5.10). Written from M4 on. */
export interface UnlockEntry {
  firstEarnedDate: string;
}

interface MonsterDexDB extends DBSchema {
  flavorState: { key: string; value: FlavorState }; // keyed by slug; blob-free
  photos: { key: string; value: Blob }; // keyed by slug; split out so the grid never reads blobs
  customs: { key: string; value: Custom }; // keyed by slug
  unlockLog: { key: string; value: UnlockEntry }; // keyed by badgeId
  kv: { key: string; value: unknown }; // settings + meta (counterEnabled, schemaVersion, …)
}

const DB_NAME = 'monsterdex';
const DB_VERSION = 1;

/** Current schema version — stamped into `kv` on first boot; drives M5 migration. */
export const SCHEMA_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MonsterDexDB>> | null = null;

function db(): Promise<IDBPDatabase<MonsterDexDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MonsterDexDB>(DB_NAME, DB_VERSION, {
      upgrade(d) {
        // All five stores created up front (architecture §3). unlockLog stays
        // untouched until the badge engine (M4); kv holds counterEnabled + meta.
        d.createObjectStore('flavorState');
        d.createObjectStore('photos');
        d.createObjectStore('customs');
        d.createObjectStore('unlockLog');
        d.createObjectStore('kv');
      },
    });
  }
  return dbPromise;
}

// ── flavorState ──────────────────────────────────────────────────────────────

/** Hydrate the full sparse map (slug → state). Zips keys with values (the value
 *  is blob-free and does not embed its own slug, so we read the keys alongside). */
export async function getAllFlavorStates(): Promise<Record<string, FlavorState>> {
  const d = await db();
  const [keys, values] = await Promise.all([
    d.getAllKeys('flavorState'),
    d.getAll('flavorState'),
  ]);
  const out: Record<string, FlavorState> = {};
  keys.forEach((k, i) => {
    out[k as string] = values[i];
  });
  return out;
}

export async function putFlavorState(slug: string, state: FlavorState): Promise<void> {
  const d = await db();
  await d.put('flavorState', state, slug);
}

// ── photos (split store; read lazily, never wholesale) ───────────────────────

export async function getPhoto(slug: string): Promise<Blob | undefined> {
  const d = await db();
  return d.get('photos', slug);
}

export async function putPhoto(slug: string, blob: Blob): Promise<void> {
  const d = await db();
  await d.put('photos', blob, slug);
}

export async function deletePhoto(slug: string): Promise<void> {
  const d = await db();
  await d.delete('photos', slug);
}

// ── customs ──────────────────────────────────────────────────────────────────

export async function getAllCustoms(): Promise<Custom[]> {
  const d = await db();
  return d.getAll('customs');
}

export async function putCustom(custom: Custom): Promise<void> {
  const d = await db();
  await d.put('customs', custom, custom.slug);
}

/** Delete a custom and all of its derived state in one transaction (PRD §5.5:
 *  deleting a custom cleanly removes its definition, user record, and photo). */
export async function deleteCustomRecord(slug: string): Promise<void> {
  const d = await db();
  const tx = d.transaction(['customs', 'flavorState', 'photos'], 'readwrite');
  await Promise.all([
    tx.objectStore('customs').delete(slug),
    tx.objectStore('flavorState').delete(slug),
    tx.objectStore('photos').delete(slug),
    tx.done,
  ]);
}

// ── unlockLog (badge engine — architecture §4 / §5.10) ───────────────────────

/** Hydrate the full unlock log (badgeId → first-earned entry). Zips keys (badgeId)
 *  with values, as the value does not embed its own id. */
export async function getAllUnlockLog(): Promise<Record<string, UnlockEntry>> {
  const d = await db();
  const [keys, values] = await Promise.all([
    d.getAllKeys('unlockLog'),
    d.getAll('unlockLog'),
  ]);
  const out: Record<string, UnlockEntry> = {};
  keys.forEach((k, i) => {
    out[k as string] = values[i];
  });
  return out;
}

/** Append/overwrite a single unlock entry (write-through on first-earn). */
export async function putUnlockEntry(badgeId: string, entry: UnlockEntry): Promise<void> {
  const d = await db();
  await d.put('unlockLog', entry, badgeId);
}

// ── Bulk replace / reset (M5 backup-restore + reset data — architecture §7) ──

/** The four user-data stores, cleared together on import/reset (kv meta is handled
 *  separately by the caller — it is settings, not collection data). */
const USER_STORES = ['flavorState', 'photos', 'customs', 'unlockLog'] as const;

/** Destructively replace every user-data store in one transaction (architecture §7
 *  step 5). Clears the four stores, then writes the supplied records **unfiltered** —
 *  records whose slug isn't in the current catalog are kept, not dropped (orphan
 *  preservation, PRD §5.10). Photos arrive already re-split into blobs (the caller
 *  decodes base64 → Blob and strips the photo field off `flavorState`). */
export async function replaceAllData(data: {
  flavorState: Record<string, FlavorState>;
  photos: Record<string, Blob>;
  customs: Custom[];
  unlockLog: Record<string, UnlockEntry>;
}): Promise<void> {
  const d = await db();
  const tx = d.transaction(USER_STORES, 'readwrite');
  // Issue every clear + put synchronously (no intervening await), or the transaction
  // can auto-commit between operations and throw TransactionInactiveError.
  const fs = tx.objectStore('flavorState');
  const ph = tx.objectStore('photos');
  const cu = tx.objectStore('customs');
  const ul = tx.objectStore('unlockLog');
  fs.clear();
  ph.clear();
  cu.clear();
  ul.clear();
  for (const [slug, st] of Object.entries(data.flavorState)) fs.put(st, slug);
  for (const [slug, blob] of Object.entries(data.photos)) ph.put(blob, slug);
  for (const c of data.customs) cu.put(c, c.slug);
  for (const [id, entry] of Object.entries(data.unlockLog)) ul.put(entry, id);
  await tx.done;
}

/** Wipe every user-data store (Reset data, PRD §5.10). kv meta is reset by the
 *  caller; the app lifecycle keys (firstLaunchDate / birthdaySeen) are intentionally
 *  preserved so the birthday overlay never replays on a reset. */
export async function resetUserData(): Promise<void> {
  const d = await db();
  const tx = d.transaction(USER_STORES, 'readwrite');
  await Promise.all([...USER_STORES.map((s) => tx.objectStore(s).clear()), tx.done]);
}

// ── kv (settings + meta) ─────────────────────────────────────────────────────

export async function getKv<T>(key: string, fallback: T): Promise<T> {
  const d = await db();
  const v = await d.get('kv', key);
  return v === undefined ? fallback : (v as T);
}

export async function putKv(key: string, value: unknown): Promise<void> {
  const d = await db();
  await d.put('kv', value, key);
}
