// src/lib/cloudinary-preview.ts
export type PreviewKind = 'image' | 'pdf' | 'none';

export interface Preview {
  kind: PreviewKind;
  url: string | null;
}

function isPdf(url: string): boolean {
  return url.includes('/raw/upload/') || url.toLowerCase().endsWith('.pdf');
}

export function firstPreview(attachments: string[]): Preview {
  const first = attachments?.[0];
  if (!first) return { kind: 'none', url: null };
  if (isPdf(first)) return { kind: 'pdf', url: first };
  return { kind: 'image', url: first };
}

/**
 * Apply Cloudinary URL transforms for a feed-card image.
 * Inserts width/height/auto-format/auto-quality after `/upload/`.
 * Pass-through for non-Cloudinary URLs.
 */
export function imageUrl(src: string): string {
  if (!src.includes('/upload/') || !src.includes('res.cloudinary.com')) return src;
  return src.replace('/upload/', '/upload/w_800,h_500,c_fill,f_auto,q_auto/');
}

/**
 * Tiny blurred-placeholder URL for use as next/image's blurDataURL.
 * Cloudinary returns a low-quality placeholder image we can show during load.
 */
export function blurUrl(src: string): string | null {
  if (!src.includes('/upload/') || !src.includes('res.cloudinary.com')) return null;
  return src.replace('/upload/', '/upload/w_20,e_blur:1000,q_1,f_auto/');
}
