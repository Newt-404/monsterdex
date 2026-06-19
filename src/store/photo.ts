// User-photo compression (PRD §5.7 "stored compressed/resized"; §10 "resize/
// compress before storing"). A picked File is downscaled to a max edge and
// re-encoded as JPEG before it ever reaches the `photos` store, so IndexedDB holds
// a small blob rather than a multi-MB camera original.

const MAX_EDGE = 1280; // longest side, px
const QUALITY = 0.82;

/**
 * Downscale + re-encode a picked image File to a compact JPEG Blob.
 * Throws on a decode/encode failure so the caller can fail the photo write in
 * isolation (PRD §10) without aborting the rest of a save.
 */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );
    if (!blob) throw new Error('Image encode failed');
    return blob;
  } finally {
    bitmap.close();
  }
}
