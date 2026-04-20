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
