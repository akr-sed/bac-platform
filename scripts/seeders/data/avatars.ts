/**
 * Deterministic avatar URL builder using DiceBear v9 (SVG, no auth).
 *
 * - Teachers get the `notionists` style (polished, illustrated).
 * - Students get the `avataaars` style.
 * - Seed = the user's email (URL-encoded) — 1:1 and stable.
 * - Background color rotates through a small pastel palette indexed by a
 *   tiny hash of the email so thumbnails don't all look identical.
 *
 * Shared by `scripts/seeders/fake-users.ts` and `scripts/backfill-avatars.ts`.
 */

const BACKGROUND_PALETTE = [
  'b6e3f4',
  'c0aede',
  'd1d4f9',
  'ffd5dc',
  'ffdfbf',
] as const;

export type AvatarRole = 'student' | 'teacher' | 'admin';

/** Cheap, deterministic 32-bit FNV-1a hash. */
function hashEmail(email: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < email.length; i++) {
    h ^= email.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function styleFor(role: AvatarRole): string {
  return role === 'teacher' ? 'notionists' : 'avataaars';
}

/**
 * Build a deterministic DiceBear v9 SVG avatar URL for a user.
 *
 * @param email Used as the seed (must be the user's canonical email).
 * @param role  Drives the visual style. `admin` falls back to `avataaars`.
 */
export function buildAvatarUrl(email: string, role: AvatarRole): string {
  const normalized = email.trim().toLowerCase();
  const style = styleFor(role);
  const bg = BACKGROUND_PALETTE[hashEmail(normalized) % BACKGROUND_PALETTE.length];
  const seed = encodeURIComponent(normalized);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
}
