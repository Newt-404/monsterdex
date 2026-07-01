// Backup / restore (PRD §5.10, architecture §7). Export serialises every user store
// into one JSON file (photos as base64) and hands it to the iOS share sheet; import
// fully validates, auto-exports the current data as a one-tap undo, then replaces all
// data in one transaction — re-splitting base64 photos back into the blob store and
// preserving records for unknown slugs (orphan preservation). Restores are SILENT:
// the engine re-evaluates with celebrations suppressed, because every earned badge is
// already in the restored log.

import {
  getPhoto,
  putKv,
  replaceAllData,
  resetUserData,
  SCHEMA_VERSION,
  type UnlockEntry,
} from './db';
import {
  backupCount,
  birthdaySeen,
  changesSinceBackup,
  counterEnabled,
  customs,
  firstLaunchDate,
  flavorStates,
  hydrateUserState,
  lastBackupAt,
  unlockLog,
} from './state';
import { setCelebrationsSuppressed } from '../badges/engine';
import type { Custom, FlavorState } from '../types';

// ── Payload shape (PRD §5.10 "Backup payload (complete)") ─────────────────────

interface BackupFlavor {
  slug: string;
  rating: number | null;
  review: string;
  count: number;
  wishlist: boolean;
  /** Compressed user photo as a data URL, or null. Re-split into the photos store on import. */
  userPhoto: string | null;
}

interface BackupMeta {
  firstLaunchDate: string | null;
  birthdaySeen: boolean;
  backupCount: number;
  lastBackupAt: string | null;
  changesSinceBackup: number;
}

export interface BackupPayload {
  schemaVersion: number;
  flavors: BackupFlavor[];
  customs: Custom[];
  settings: { counterEnabled: boolean };
  /** badgeId → firstEarnedDate (PRD §5.10). Re-nested into UnlockEntry on import. */
  unlockLog: Record<string, string>;
  meta: BackupMeta;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ── base64 ⇄ Blob ─────────────────────────────────────────────────────────────

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error('photo read failed'));
    r.readAsDataURL(blob);
  });
}

/** Decode a `data:<mime>;base64,<payload>` URL to a Blob using `atob` — no `fetch`, so
 *  it honours CLAUDE.md's "no network at runtime" rule and survives a strict CSP
 *  `connect-src`. Throws on a malformed URL / bad base64 (the caller drops just that photo). */
function dataURLToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma === -1) throw new Error('not a data URL');
  const header = dataUrl.slice(5, comma); // between "data:" and ","
  const mime = header.split(';')[0] || 'application/octet-stream';
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// ── Export ────────────────────────────────────────────────────────────────────

/** Assemble the complete backup payload from the live signals + the photo store.
 *  `metaOverride` lets a real export stamp the new backup count / timestamp while the
 *  silent undo-export keeps the current meta verbatim. */
async function buildPayload(metaOverride?: Partial<BackupMeta>): Promise<BackupPayload> {
  const states = flavorStates.value;
  const flavors: BackupFlavor[] = [];
  for (const [slug, st] of Object.entries(states)) {
    let userPhoto: string | null = null;
    if (st.hasPhoto) {
      const blob = await getPhoto(slug);
      if (blob) userPhoto = await blobToDataURL(blob);
    }
    flavors.push({
      slug,
      rating: st.rating,
      review: st.review,
      count: st.count,
      wishlist: st.wishlist,
      userPhoto,
    });
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    flavors,
    customs: customs.value,
    settings: { counterEnabled: counterEnabled.value },
    unlockLog: Object.fromEntries(
      Object.entries(unlockLog.value).map(([id, e]) => [id, e.firstEarnedDate]),
    ),
    meta: {
      firstLaunchDate: firstLaunchDate.value,
      birthdaySeen: birthdaySeen.value,
      backupCount: backupCount.value,
      lastBackupAt: lastBackupAt.value,
      changesSinceBackup: changesSinceBackup.value,
      ...metaOverride,
    },
  };
}

function payloadToFile(payload: BackupPayload, filename: string): File {
  const json = JSON.stringify(payload, null, 2);
  return new File([json], filename, { type: 'application/json' });
}

/** Trigger a plain `<a download>` for the file (the universal fallback path). */
function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Deliver a file via the share sheet (iOS + Android), falling back to an `<a download>`
 *  (PRD §5.10). Rejects with an `AbortError` if the user cancels the share — callers treat
 *  that as "no backup was made", not a failure.
 *
 *  Android caveat: `canShare({files})` reports capability, but `share()` itself can still
 *  reject for reasons that are NOT a user cancel — most often `NotAllowedError`, because the
 *  button tap's transient user activation is consumed by the async `buildPayload()` (photo
 *  reads) before we get here. iOS Safari tolerates that gap; Android Chrome does not. So on
 *  ANY non-abort share failure we fall through to the download link rather than failing the
 *  whole export — otherwise the backup button just errors on Android. A real cancel
 *  (AbortError) still propagates so the caller treats it as "no backup made". */
async function deliverFile(file: File): Promise<void> {
  const nav = navigator as Navigator & {
    canShare?: (d: ShareData) => boolean;
    share?: (d: ShareData) => Promise<void>;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name });
      return;
    } catch (err) {
      if (isAbort(err)) throw err; // genuine user cancel — let the caller no-op
      // Otherwise the share failed technically (activation lost, no target, size, …).
      // Fall through to the download link so the export still succeeds.
    }
  }
  downloadFile(file);
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

/** User-initiated export (PRD §5.10): serialise → share → on success bump the backup
 *  meta (which lights Better Safe / Hoarder via the engine) and clear the change nudge.
 *  A cancelled share is a no-op — nothing is counted. Returns whether a backup was made. */
export async function exportBackup(): Promise<boolean> {
  const now = nowISO();
  const newCount = backupCount.value + 1;
  const stamp = now.slice(0, 10);
  const payload = await buildPayload({
    backupCount: newCount,
    lastBackupAt: now,
    changesSinceBackup: 0,
  });

  try {
    await deliverFile(payloadToFile(payload, `monsterdex-backup-${stamp}.json`));
  } catch (err) {
    if (isAbort(err)) return false; // user dismissed the share sheet
    throw err;
  }

  // Persist first (so a re-read is correct), then update the signals — the backupCount
  // change re-runs the engine and celebrates Better Safe / Hoarder (NOT suppressed —
  // this is a genuine first-earn, unlike an import).
  await Promise.all([
    putKv('backupCount', newCount),
    putKv('lastBackupAt', now),
    putKv('changesSinceBackup', 0),
  ]);
  // The `backupCount` write re-runs the badge engine with the new count visible, so
  // Better Safe / Hoarder celebrate here (not suppressed — a genuine earn). Order isn't
  // load-bearing: any of these writes re-evaluates, and the final state carries newCount.
  lastBackupAt.value = now;
  changesSinceBackup.value = 0;
  backupCount.value = newCount;
  return true;
}

// ── Validate ──────────────────────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; reason: string };

const GENERIC = 'Not a valid MonsterDex backup.';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Parse + fully validate before anything is applied (architecture §7 steps 1–2):
 *  reject the whole file with a specific reason rather than partially restoring it. */
export function validateBackup(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: GENERIC };
  }
  if (!isObj(raw)) return { ok: false, reason: GENERIC };

  const sv = raw.schemaVersion;
  if (typeof sv !== 'number' || !Number.isInteger(sv) || sv < 1) {
    return { ok: false, reason: `${GENERIC} (missing schema version)` };
  }
  if (sv > SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'This backup is from a newer version of MonsterDex. Update the app, then import.',
    };
  }

  if (!Array.isArray(raw.flavors)) return { ok: false, reason: `${GENERIC} (no flavor records)` };
  for (const f of raw.flavors as unknown[]) {
    if (
      !isObj(f) ||
      typeof f.slug !== 'string' ||
      !(f.rating === null || typeof f.rating === 'number') ||
      typeof f.review !== 'string' ||
      typeof f.count !== 'number' ||
      typeof f.wishlist !== 'boolean' ||
      !(f.userPhoto == null || typeof f.userPhoto === 'string')
    ) {
      return { ok: false, reason: `${GENERIC} (a flavor record is malformed)` };
    }
  }

  if (!Array.isArray(raw.customs)) return { ok: false, reason: `${GENERIC} (no customs list)` };
  for (const c of raw.customs as unknown[]) {
    if (
      !isObj(c) ||
      typeof c.slug !== 'string' ||
      typeof c.nameMain !== 'string' ||
      typeof c.nameTop !== 'string' ||
      typeof c.line !== 'string' ||
      typeof c.accentColor !== 'string' ||
      typeof c.alcoholic !== 'boolean'
    ) {
      return { ok: false, reason: `${GENERIC} (a custom flavor is malformed)` };
    }
  }

  if (!isObj(raw.settings) || typeof raw.settings.counterEnabled !== 'boolean') {
    return { ok: false, reason: `${GENERIC} (settings missing)` };
  }
  if (!isObj(raw.unlockLog)) return { ok: false, reason: `${GENERIC} (unlock log missing)` };
  for (const v of Object.values(raw.unlockLog)) {
    if (typeof v !== 'string') return { ok: false, reason: `${GENERIC} (unlock log malformed)` };
  }
  if (!isObj(raw.meta)) return { ok: false, reason: `${GENERIC} (meta missing)` };

  return { ok: true, payload: raw as unknown as BackupPayload };
}

// ── Migrate ─────────────────────────────────────────────────────────────────--

/** Forward-migrate an older payload to the current schema before applying
 *  (architecture §7). Identity at v1; the seam exists so a future bump has a home. */
function migrate(payload: BackupPayload): BackupPayload {
  return payload;
}

// ── Import / restore (architecture §7 steps 3–6) ──────────────────────────────

/** Restore from a validated payload. Auto-exports the current data first (one-tap
 *  undo); if that share is cancelled the import aborts and nothing changes. Then
 *  replaces all data in one transaction (re-splitting photos, preserving orphans) and
 *  re-hydrates with celebrations suppressed — a restore never throws confetti. */
export async function importBackup(payload: BackupPayload): Promise<void> {
  // Suppress celebrations for the WHOLE restore, not just the apply step (architecture §7
  // step 6 — a restore is silent: every earned badge is already in the restored log). One
  // outer try/finally so suppression is reset even if the undo-export below is cancelled,
  // leaving the engine free to celebrate the next genuine earn. (Nothing before the apply
  // mutates state, so no confetti could fire there anyway — this just makes the suppressed
  // window match the "a restore never throws confetti" contract instead of relying on it.)
  setCelebrationsSuppressed(true);
  try {
    // Step 4: auto-export current data as the one-tap undo, BEFORE we overwrite anything.
    const undo = await buildPayload();
    try {
      await deliverFile(payloadToFile(undo, `monsterdex-before-restore-${nowISO().slice(0, 10)}.json`));
    } catch (err) {
      if (isAbort(err)) throw new Error('Import cancelled — your data is unchanged.');
      throw err;
    }

    const data = migrate(payload);

    // Re-split: decode each base64 photo back to a Blob, flag hasPhoto on the blob-free
    // flavorState record, and strip the photo field (architecture §7 step 5).
    const flavorState: Record<string, FlavorState> = {};
    const photos: Record<string, Blob> = {};
    for (const f of data.flavors) {
      flavorState[f.slug] = {
        rating: f.rating,
        review: f.review,
        count: f.count,
        wishlist: f.wishlist,
        hasPhoto: !!f.userPhoto,
      };
      if (f.userPhoto) {
        try {
          photos[f.slug] = dataURLToBlob(f.userPhoto);
        } catch {
          flavorState[f.slug].hasPhoto = false; // unreadable photo → keep the rest of the record
        }
      }
    }

    const unlockLog: Record<string, UnlockEntry> = {};
    for (const [id, date] of Object.entries(data.unlockLog)) {
      unlockLog[id] = { firstEarnedDate: date };
    }

    // Merge the app-lifecycle keys rather than overwriting them (deferred-decisions.md,
    // resolved in M6 now that the first-launch flow sets them): keep the device's existing
    // firstLaunchDate / birthdaySeen if already set, so restoring an OLDER backup — whose
    // meta may carry birthdaySeen:false / firstLaunchDate:null — never replays the birthday
    // overlay and never briefly un-satisfies The Origin. We read the live signals here,
    // before hydrateUserState() below reloads them. Once seen, birthdaySeen stays sticky.
    const mergedFirstLaunch = firstLaunchDate.value ?? data.meta.firstLaunchDate;
    const mergedBirthdaySeen = birthdaySeen.value || data.meta.birthdaySeen;

    // Step 5: one transaction — clear + write unfiltered (orphans preserved).
    await replaceAllData({ flavorState, photos, customs: data.customs, unlockLog });
    // kv meta + settings (await before hydrate so the re-read sees the new values).
    await Promise.all([
      putKv('counterEnabled', data.settings.counterEnabled),
      putKv('backupCount', data.meta.backupCount),
      putKv('lastBackupAt', data.meta.lastBackupAt),
      putKv('changesSinceBackup', data.meta.changesSinceBackup),
      putKv('firstLaunchDate', mergedFirstLaunch),
      putKv('birthdaySeen', mergedBirthdaySeen),
      putKv('schemaVersion', SCHEMA_VERSION),
    ]);
    // Step 6: re-hydrate signals; the engine's effect runs here, but suppressed.
    await hydrateUserState();
  } finally {
    setCelebrationsSuppressed(false);
  }
}

// ── Reset (PRD §5.10 "Reset data") ────────────────────────────────────────────

/** Wipe all collection data + backup meta (with the caller's confirm). Keeps the
 *  app-lifecycle keys (firstLaunchDate / birthdaySeen) so the birthday never replays,
 *  and re-evaluates silently so emptying the dex doesn't fire (or un-fire) anything. */
export async function resetData(): Promise<void> {
  setCelebrationsSuppressed(true);
  try {
    await resetUserData();
    await Promise.all([
      putKv('backupCount', 0),
      putKv('lastBackupAt', null),
      putKv('changesSinceBackup', 0),
    ]);
    await hydrateUserState();
  } finally {
    setCelebrationsSuppressed(false);
  }
}
