// Flavor detail — pushed screen from the catalog (PRD §5.2; mockups
// mockup-flavor-detail-builtin.png / -custom.png). Large can with Replace photo,
// two-part name + line tag, ½-star rating + Clear, review, +1 counter (when
// counting is on), wishlist toggle, and Edit/Delete for customs.

import { useRef } from 'preact/hooks';
import {
  closeFlavor,
  counterEnabled,
  decrementCount,
  deleteCustom,
  findFlavor,
  incrementCount,
  openEditCustom,
  setPhoto,
  setRating,
  setReview,
  stateOf,
  toggleWishlist,
} from '../store/state';
import { FlavorImage } from '../can/flavor-image';
import { StarRating } from '../ui/star-rating';
import { categoryLabel, isCustom } from '../types';
import '../styles/detail.css';

export function FlavorDetail({ slug }: { slug: string }) {
  // Hooks must run unconditionally and in a stable order every render, so they
  // come BEFORE the early return below (Rules of Hooks). On the cold deep-link
  // path `flavor` is briefly undefined before boot() hydrates the catalog; if the
  // early return preceded useRef, the hook count would change between renders.
  const fileRef = useRef<HTMLInputElement>(null);

  const flavor = findFlavor(slug);
  // Cold deep-link before hydrate, or a just-deleted custom: nothing to show.
  if (!flavor) return null;

  const st = stateOf(slug);

  const onPickPhoto = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;
    try {
      await setPhoto(slug, file);
    } catch {
      // Photo writes fail in isolation (PRD §10) — the rest of the record is intact.
      alert('Could not save that photo. Please try another.');
    }
  };

  const onDelete = () => {
    if (confirm(`Delete "${flavor.nameMain}"? This can't be undone.`)) {
      deleteCustom(slug);
      closeFlavor();
    }
  };

  return (
    <div class="detail">
      <header class="detail-bar">
        <button class="round-btn" onClick={closeFlavor} aria-label="Back">
          <BackIcon />
        </button>
        {/* Overflow menu is a placeholder for parity with the mockup; its actions
            (e.g. share) are not part of M2. */}
        <button class="round-btn" aria-label="More" disabled>
          <MoreIcon />
        </button>
      </header>

      <div class="detail-can">
        <FlavorImage flavor={flavor} width={208} eager />
      </div>

      <button class="ghost-btn replace-photo" onClick={() => fileRef.current?.click()}>
        <CameraIcon /> Replace photo
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPickPhoto}
      />

      <h1 class="detail-name display">{flavor.nameMain}</h1>

      <div class="detail-tag">
        <span class="detail-dot" style={`background:${flavor.accentColor}`} />
        <span class="detail-line" style={`color:${flavor.accentColor}`}>
          {flavor.line.toUpperCase()}
        </span>
        <span class="detail-sep">•</span>
        <span class="detail-cat">{categoryLabel(flavor.line).toUpperCase()}</span>
      </div>

      <div class="detail-stars">
        <StarRating value={st.rating} onChange={(r) => setRating(slug, r)} />
      </div>
      {st.rating !== null ? (
        <button class="clear-rating" onClick={() => setRating(slug, null)}>
          Clear rating
        </button>
      ) : null}

      <textarea
        class="review-box"
        placeholder="Write a review…"
        value={st.review}
        onInput={(e) => setReview(slug, (e.currentTarget as HTMLTextAreaElement).value)}
        rows={3}
      />

      {counterEnabled.value ? (
        <div class="counter-bar">
          <button class="counter-add" onClick={() => incrementCount(slug)}>
            <span class="counter-plus">+1</span>
            <span class="counter-label">Had it</span>
          </button>
          <button
            class="count-step"
            onClick={() => decrementCount(slug)}
            aria-label="Decrease count"
            disabled={st.count === 0}
          >
            <MinusIcon />
          </button>
          <span class="count-value display">{st.count}</span>
          <button
            class="count-step"
            onClick={() => incrementCount(slug)}
            aria-label="Increase count"
          >
            <PlusIcon />
          </button>
        </div>
      ) : null}

      <button
        class={`wishlist-row${st.wishlist ? ' on' : ''}`}
        onClick={() => toggleWishlist(slug)}
        aria-pressed={st.wishlist}
      >
        <HeartIcon filled={st.wishlist} />
        <span class="wishlist-label">Want to try</span>
        <span class={`switch${st.wishlist ? ' on' : ''}`}>
          <span class="switch-knob" />
        </span>
      </button>

      {isCustom(slug) ? (
        <div class="custom-row">
          <span class="custom-label">Custom flavor</span>
          <button class="ghost-btn custom-edit" onClick={() => openEditCustom(slug)}>
            <PencilIcon /> Edit
          </button>
          <button class="ghost-btn custom-delete" onClick={onDelete}>
            <TrashIcon /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── icons ─────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 8h3l1.5-2h7L18 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" stroke-width="2" />
      <path d="M11 18h14" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent)" stroke-width="2" />
      <path d="M18 11v14M11 18h14" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  );
}
const HEART_D =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d={HEART_D} fill={filled ? 'var(--accent)' : 'none'} stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  );
}
