// Settings sheet (PRD §5.9 gear → §5.10 Settings & Backup). Counter toggle, backup
// export/import with the full validation + one-tap-undo flow, the "How backups work"
// explainer, the changes-since-backup nudge, and Reset data. A modal sheet over the
// app, mirroring the custom-flavor editor pattern.

import { useRef, useState } from 'preact/hooks';
import {
  changesSinceBackup,
  closeSettings,
  counterEnabled,
  lastBackupAt,
  setCounterEnabled,
} from '../store/state';
import { exportBackup, importBackup, resetData, validateBackup } from '../store/backup';
import '../styles/settings.css';

function fmtWhen(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportBackup();
    } catch {
      alert('Could not create the backup. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onPickFile = (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    (e.currentTarget as HTMLInputElement).value = ''; // allow re-picking the same file
    if (!file) return;
    void runImport(file);
  };

  const runImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const result = validateBackup(text);
      if (!result.ok) {
        alert(result.reason);
        return;
      }
      const n = result.payload.flavors.length;
      const ok = confirm(
        `Restore this backup?\n\nThis replaces ALL current data with ${n} saved flavor record(s). ` +
          `Your current data is exported first (a one-tap undo) before anything changes.`,
      );
      if (!ok) return;
      await importBackup(result.payload);
      alert('Backup restored.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (busy) return;
    const ok = confirm(
      'Reset all data?\n\nThis permanently clears every rating, review, count, custom flavor, ' +
        'photo, and unlocked achievement. Consider creating a backup first. This cannot be undone.',
    );
    if (!ok) return;
    setBusy(true);
    try {
      await resetData();
      alert('All data has been reset.');
    } catch {
      alert('Could not reset data. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const changes = changesSinceBackup.value;

  return (
    <div class="sheet-backdrop" onClick={closeSettings}>
      <div class="sheet settings-sheet" onClick={(e) => e.stopPropagation()}>
        <header class="settings-head">
          <h2 class="sheet-title display">Settings</h2>
          <button class="settings-close" aria-label="Close" onClick={closeSettings}>
            ✕
          </button>
        </header>

        {/* Counter toggle (PRD §5.4) */}
        <section class="settings-group">
          <label class="toggle-row">
            <span class="toggle-text">
              <span class="toggle-title">Count cans</span>
              <span class="toggle-sub">
                Show the +1 control and can-count stats. Turning it off hides those — it never
                deletes your counts.
              </span>
            </span>
            <input
              class="toggle-input"
              type="checkbox"
              role="switch"
              checked={counterEnabled.value}
              onChange={(e) => setCounterEnabled((e.currentTarget as HTMLInputElement).checked)}
            />
          </label>
        </section>

        {/* Backup (PRD §5.10) */}
        <section class="settings-group">
          <h3 class="settings-label">Backup</h3>
          <p class="settings-note">
            {changes > 0 ? (
              <strong class="nudge">
                {changes} change{changes === 1 ? '' : 's'} since your last backup.
              </strong>
            ) : (
              'Up to date with your last backup.'
            )}
            <br />
            Last backup: {fmtWhen(lastBackupAt.value)}
          </p>

          <button class="primary-btn block-btn" onClick={onExport} disabled={busy}>
            Create backup
          </button>
          <button class="ghost-btn block-btn" onClick={() => fileRef.current?.click()} disabled={busy}>
            Restore from backup
          </button>
          <input
            ref={fileRef}
            class="hidden-file"
            type="file"
            accept="application/json,.json"
            onChange={onPickFile}
          />

          <details class="explainer">
            <summary>How backups work</summary>
            <div class="explainer-body">
              <p>
                A backup is a single <code>.json</code> file holding everything you've logged —
                ratings, reviews, counts, wishlist, custom flavors, your photos, and your
                achievements.
              </p>
              <p>
                <strong>Create backup</strong> opens the iOS share sheet — save it to Files or
                iCloud Drive, or email it to yourself. To move to a new phone, open this app there
                and use <strong>Restore from backup</strong> with that file.
              </p>
              <p>
                Restoring first exports your current data automatically, so a wrong file is a
                one-tap undo. It then replaces everything with the backup's contents.
              </p>
              <p class="warn">
                Always use the installed app (added to your Home Screen) — a Safari tab keeps its
                own separate data. iPhone can also clear an app's local data if storage runs low,
                so back up now and then.
              </p>
            </div>
          </details>
        </section>

        {/* Reset (PRD §5.10) */}
        <section class="settings-group">
          <h3 class="settings-label">Danger zone</h3>
          <button class="danger-btn block-btn" onClick={onReset} disabled={busy}>
            Reset all data
          </button>
        </section>
      </div>
    </div>
  );
}
