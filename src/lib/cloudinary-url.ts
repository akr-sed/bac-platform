/**
 * Pure URL helpers for Cloudinary derivatives. Lives in its own file so both
 * server components and `'use client'` modules can import without dragging in
 * the Node-only Cloudinary SDK from `src/lib/cloudinary.ts`.
 */

/**
 * Insert a transform chain after `/upload/`. Idempotent on URLs that don't
 * already contain the transform.
 */
export function cloudinaryTransform(url: string, transforms: string): string {
  if (!url || !transforms) return url;
  return url.replace(/\/upload\//, `/upload/${transforms}/`);
}
