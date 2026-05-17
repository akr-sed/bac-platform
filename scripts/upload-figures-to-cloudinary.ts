/**
 * One-time bulk upload of bac-figures/ PNGs to Cloudinary.
 * Idempotent via a local manifest. Re-runs only upload new PNGs.
 *
 * Usage:
 *   npx tsx scripts/upload-figures-to-cloudinary.ts
 */
import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import { v2 as cloudinary } from 'cloudinary';
import { uploadBuffer } from '../src/lib/cloudinary';

// Re-configure: `cloudinary.config()` in src/lib/cloudinary.ts runs at module
// import time (before dotenv had a chance, because ES imports are hoisted).
// We re-apply with the env vars that ARE loaded by now.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const REPO_ROOT = path.resolve(__dirname, '..');
const FIGURES_DIR = path.join(
  REPO_ROOT,
  'data',
  'dzexams',
  'maths',
  'bac',
  'bac-figures'
);
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  'data',
  'dzexams',
  'maths',
  'bac',
  'bac-figures-manifest.json'
);

interface ManifestEntry {
  localPath: string;
  publicId: string;
  secureUrl: string;
  uploadedAt: string;
}

type Manifest = Record<string, ManifestEntry>;

async function loadManifest(): Promise<Manifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw) as Manifest;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw e;
  }
}

async function saveManifest(m: Manifest): Promise<void> {
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(m, null, 2), 'utf-8');
}

async function* walkPngs(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkPngs(full);
    } else if (entry.isFile() && entry.name.endsWith('.png')) {
      yield full;
    }
  }
}

function publicIdFromPath(rel: string): string {
  const noExt = rel.replace(/\.png$/, '');
  return `bac-platform/figures/${noExt}`;
}

async function main(): Promise<void> {
  const manifest = await loadManifest();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let sinceFlush = 0;

  try {
    await fs.access(FIGURES_DIR);
  } catch {
    console.error(`error: figures dir not found: ${FIGURES_DIR}`);
    console.error('run `python -m scripts.ai_hinting crop-all` first.');
    process.exit(2);
  }

  for await (const fullPath of walkPngs(FIGURES_DIR)) {
    const rel = path.relative(FIGURES_DIR, fullPath);
    if (manifest[rel]) {
      skipped += 1;
      continue;
    }
    const publicId = publicIdFromPath(rel);
    try {
      const buffer = await fs.readFile(fullPath);
      const secureUrl = await uploadBuffer(buffer, publicId, 'image/png');
      manifest[rel] = {
        localPath: rel,
        publicId,
        secureUrl,
        uploadedAt: new Date().toISOString(),
      };
      uploaded += 1;
      sinceFlush += 1;
      console.log(`  uploaded ${rel}`);
      if (sinceFlush >= 25) {
        await saveManifest(manifest);
        sinceFlush = 0;
      }
    } catch (err) {
      failed += 1;
      console.error(`  failed ${rel}: ${(err as Error).message}`);
    }
  }

  await saveManifest(manifest);
  console.log(`\nuploaded=${uploaded} skipped=${skipped} failed=${failed}`);
  console.log(`manifest: ${MANIFEST_PATH}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
