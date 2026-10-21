import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UPLOAD_DIR = path.resolve(SERVER_ROOT, process.env.UPLOAD_DIR || 'uploads');

/**
 * Where uploaded files are stored:
 *  - 'blob'  : Vercel Blob (used automatically when BLOB_READ_WRITE_TOKEN is set, e.g. on Vercel).
 *              The browser uploads straight to Blob storage, so large videos work on serverless.
 *  - 'local' : the server/uploads folder (VPS, local development).
 */
export const STORAGE = process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local';
export const IS_SERVERLESS = Boolean(process.env.VERCEL);

const IMAGE = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/;
const VIDEO = /^video\/(mp4|webm|quicktime)$/;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 80);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE.test(file.mimetype) || VIDEO.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPG, PNG, WebP, GIF, AVIF, SVG) and videos (MP4, WebM, MOV) can be uploaded.'));
  },
});

/**
 * Save a file uploaded to the server (local mode). Raster images are resized to max 1920px and stored as WebP.
 * Returns { url, type }.
 */
export async function saveFile(file) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomBytes(8).toString('hex');
  const base = path.parse(file.originalname).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'file';

  if (IMAGE.test(file.mimetype) && !/svg|gif/.test(file.mimetype)) {
    const { default: sharp } = await import('sharp');
    const name = `${base}-${id}.webp`;
    await sharp(file.buffer).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, name));
    return { url: `/uploads/${name}`, type: 'image' };
  }
  const ext = path.extname(file.originalname).toLowerCase() || (VIDEO.test(file.mimetype) ? '.mp4' : '');
  const name = `${base}-${id}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/${name}`, type: VIDEO.test(file.mimetype) ? 'video' : 'image' };
}

/** Delete a file we stored (local uploads folder or Vercel Blob). Seed media under /media is never deleted. */
export async function removeFile(url) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
  } else if (STORAGE === 'blob' && /\.blob\.vercel-storage\.com\//.test(url)) {
    const { del } = await import('@vercel/blob');
    await del(url).catch(() => {});
  }
}
