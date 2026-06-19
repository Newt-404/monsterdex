// Add / edit a custom flavor (PRD §5.5). A modal sheet over the app, driven by the
// `customEditor` store signal. Fields: name (required), optional subtitle, line
// (the 13 real lines + "Other"), accent colour for the SVG can, and an alcoholic
// flag (auto-set for the Beast lines). Saving routes to addCustom / editCustom;
// the new slug is always custom-{uuid} (the store mints it).

import { useState } from 'preact/hooks';
import {
  addCustom,
  closeCustomEditor,
  customEditor,
  editCustom,
  findCustom,
  openFlavor,
} from '../store/state';
import { LINE_ORDER, OTHER_LINE } from '../types';
import '../styles/custom-form.css';

const ALCOHOLIC_LINES = new Set(['The Beast Unleashed', 'Nasty Beast']);
const DEFAULT_COLOR = '#9ACA3C'; // a neutral Monster green; not the UI chrome green

export function CustomForm() {
  const editing = customEditor.value;
  if (!editing) return null;

  const existing = editing.slug ? findCustom(editing.slug) : undefined;

  const [nameMain, setNameMain] = useState(existing?.nameMain ?? '');
  const [nameTop, setNameTop] = useState(existing?.nameTop ?? '');
  const [line, setLine] = useState(existing?.line ?? OTHER_LINE);
  const [accentColor, setAccentColor] = useState(existing?.accentColor ?? DEFAULT_COLOR);
  // Once a user overrides the box, stop auto-deriving it from the line.
  const [alcoholicTouched, setAlcoholicTouched] = useState(false);
  const [alcoholic, setAlcoholic] = useState(existing?.alcoholic ?? false);

  const onLineChange = (next: string) => {
    setLine(next);
    if (!alcoholicTouched) setAlcoholic(ALCOHOLIC_LINES.has(next));
  };

  const canSave = nameMain.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    const input = {
      nameMain: nameMain.trim(),
      nameTop: nameTop.trim(),
      line,
      accentColor,
      alcoholic,
    };
    if (editing.slug) {
      editCustom(editing.slug, input);
      closeCustomEditor();
    } else {
      const created = addCustom(input);
      closeCustomEditor();
      openFlavor(created.slug); // jump into the new flavor's detail
    }
  };

  return (
    <div class="sheet-backdrop" onClick={closeCustomEditor}>
      <div class="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 class="sheet-title display">{editing.slug ? 'Edit flavor' : 'New custom flavor'}</h2>

        <label class="field">
          <span class="field-label">Name</span>
          <input
            class="field-input"
            value={nameMain}
            placeholder="e.g. Mango Loco"
            onInput={(e) => setNameMain((e.currentTarget as HTMLInputElement).value)}
            autofocus
          />
        </label>

        <label class="field">
          <span class="field-label">Subtitle (optional)</span>
          <input
            class="field-input"
            value={nameTop}
            placeholder="e.g. Zero Sugar"
            onInput={(e) => setNameTop((e.currentTarget as HTMLInputElement).value)}
          />
        </label>

        <label class="field">
          <span class="field-label">Line</span>
          <select
            class="field-input"
            value={line}
            onChange={(e) => onLineChange((e.currentTarget as HTMLSelectElement).value)}
          >
            {LINE_ORDER.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
            <option value={OTHER_LINE}>Other</option>
          </select>
        </label>

        <div class="field-row">
          <label class="field color-field">
            <span class="field-label">Can colour</span>
            <input
              class="color-input"
              type="color"
              value={accentColor}
              onInput={(e) => setAccentColor((e.currentTarget as HTMLInputElement).value)}
            />
          </label>

          <label class="check-field">
            <input
              type="checkbox"
              checked={alcoholic}
              onChange={(e) => {
                setAlcoholicTouched(true);
                setAlcoholic((e.currentTarget as HTMLInputElement).checked);
              }}
            />
            <span class="field-label">Alcoholic</span>
          </label>
        </div>

        <div class="sheet-actions">
          <button class="ghost-btn" onClick={closeCustomEditor}>
            Cancel
          </button>
          <button class="primary-btn" onClick={onSave} disabled={!canSave}>
            {editing.slug ? 'Save' : 'Add flavor'}
          </button>
        </div>
      </div>
    </div>
  );
}
