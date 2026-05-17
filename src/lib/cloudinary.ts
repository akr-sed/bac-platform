import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFile(
  file: File,
  folder: string = 'bac-platform'
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isPdf = file.type === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          max_bytes: 5 * 1024 * 1024,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      )
      .end(buffer);
  });
}

export type CloudinaryResourceType = 'image' | 'raw' | 'video';

interface ParsedCloudinaryUrl {
  publicId: string;
  resourceType: CloudinaryResourceType;
}

/**
 * Parse a Cloudinary secure_url into the public_id + resource_type pair needed
 * for uploader.destroy.
 *
 * Handles:
 *   https://res.cloudinary.com/{cloud}/image/upload/v1234/folder/abc.jpg
 *   https://res.cloudinary.com/{cloud}/raw/upload/folder/abc.pdf
 *   https://res.cloudinary.com/{cloud}/image/upload/c_fill,w_800/folder/abc.png
 *
 * Notes:
 *   - For image/video resources, public_id has NO extension (Cloudinary's API).
 *   - For raw resources, public_id INCLUDES the extension.
 *   - Returns null when the URL is not a recognizable Cloudinary upload URL,
 *     so callers can short-circuit silently for legacy / third-party URLs.
 */
export function parseCloudinaryUrl(url: string): ParsedCloudinaryUrl | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /\/(image|raw|video)\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+)$/
  );
  if (!match) return null;
  const resourceType = match[1] as CloudinaryResourceType;
  let publicId = match[2];
  if (resourceType !== 'raw') {
    publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
  }
  return { publicId, resourceType };
}

/**
 * Best-effort destroy of a single Cloudinary asset by its secure_url.
 * Never throws — errors are logged and swallowed so callers can run cleanup
 * after a successful Mongo delete without rolling back the user-visible action.
 */
export async function destroyByUrl(url: string): Promise<boolean> {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return false;
  try {
    const result = await cloudinary.uploader.destroy(parsed.publicId, {
      resource_type: parsed.resourceType,
      invalidate: true,
    });
    return result.result === 'ok' || result.result === 'not found';
  } catch (err) {
    console.error('[cloudinary] destroyByUrl failed', { url, err });
    return false;
  }
}

/**
 * Destroy many assets concurrently. Returns the count successfully purged.
 * Silently skips falsy / non-Cloudinary URLs.
 */
export async function destroyManyByUrl(
  urls: ReadonlyArray<string | undefined | null>
): Promise<number> {
  const targets = urls.filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  );
  if (targets.length === 0) return 0;
  const results = await Promise.all(targets.map(destroyByUrl));
  return results.filter(Boolean).length;
}

// Re-export the pure URL helper so existing import sites keep working,
// while client components can import directly from `cloudinary-url.ts`
// without pulling in the Node SDK.
export { cloudinaryTransform } from './cloudinary-url';

/**
 * Server-side upload of an in-memory Buffer to a known public_id. Used by
 * migration scripts that don't have a browser `File` object on hand.
 *
 *  publicId should NOT include the file extension; Cloudinary infers it.
 *  Returns the secure URL on success; throws on Cloudinary error.
 */
export async function uploadBuffer(
  buffer: Buffer,
  publicId: string,
  mimeType: string = 'image/png'
): Promise<string> {
  const isPdf = mimeType === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          overwrite: false,
          allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          max_bytes: 5 * 1024 * 1024,
        },
        (error, result) => {
          if (error) reject(error);
          else if (!result) reject(new Error('cloudinary returned no result'));
          else resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

export default cloudinary;
