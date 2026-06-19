// Image resolver (architecture §5). Priority: user photo → bundled render → SVG can.
//
// The SVG can is the synchronous floor — every card paints instantly, offline, with
// zero layout shift. If the flavor has a user photo we upgrade in place inside a
// fixed-aspect container. Detail views resolve eagerly (one can); the catalog grid
// resolves lazily (IntersectionObserver) so painting 88 cards never reads 88 blobs.
//
// The bundled-render tier is wired but dormant in v1: the resolver consults a render
// manifest (empty until renders are dropped in) and would serve /renders/{slug}.png
// — precached by the SW (M5's Workbox CacheFirst route), never fetched on demand.
// With an empty manifest it resolves photo → SVG; populating the manifest lights up
// the middle tier (photo → render → SVG) with no other code change.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Can } from './can';
import { hasRender, renderUrl } from './renders';
import { getPhoto } from '../store/db';
import { stateOf } from '../store/state';
import type { Flavor } from '../types';
import './can.css';

interface FlavorImageProps {
  flavor: Flavor;
  /** Rendered can/photo width in px (the container's aspect follows the can). */
  width: number;
  /** Detail = eager (resolve now); grid cards = lazy (resolve near viewport). */
  eager?: boolean;
}

const CAN_ASPECT = 369 / 190; // height / width, matches the SVG can viewBox

export function FlavorImage({ flavor, width, eager = false }: FlavorImageProps) {
  const hasPhoto = stateOf(flavor.slug).hasPhoto;
  const [url, setUrl] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Drop back to the SVG floor while (re)resolving, so a stale/revoked object
    // URL from a previous flavor can never paint.
    setUrl(null);
    if (!hasPhoto) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    let io: IntersectionObserver | null = null;

    const load = async () => {
      try {
        const blob = await getPhoto(flavor.slug);
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch {
        /* a missing/unreadable blob just leaves the SVG floor showing */
      }
    };

    if (eager) {
      void load();
    } else if (wrapRef.current) {
      // Lazy: resolve only when the card nears the viewport.
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect();
            void load();
          }
        },
        { rootMargin: '150px' },
      );
      io.observe(wrapRef.current);
    }

    // Single cleanup path for every branch: stop pending work and free the URL.
    return () => {
      cancelled = true;
      io?.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [flavor.slug, hasPhoto, eager]);

  // Source priority (architecture §5): user photo → bundled render → SVG floor.
  const showRender = hasRender(flavor.slug);
  return (
    <div
      ref={wrapRef}
      class="flavor-img"
      style={`width:${width}px;height:${Math.round(width * CAN_ASPECT)}px`}
    >
      {url ? (
        <img class="flavor-photo" src={url} alt={flavor.nameMain} />
      ) : showRender ? (
        <img class="flavor-photo" src={renderUrl(flavor.slug)} alt={flavor.nameMain} loading="lazy" />
      ) : (
        <Can flavor={flavor} width={width} />
      )}
    </div>
  );
}
