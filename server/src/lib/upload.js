import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

import { fileURLToPath } from 'node:url';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const UPLOAD_DIR = path.resolve(SERVER_ROOT, process.env.UPLOAD_DIR || 'uploads');

const IMAGE = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/;
const VIDEO = /^video\/(mp4|webm|quicktime)$/;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 80) * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE.test(file.mimetype) || VIDEO.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPG, PNG, WebP, GIF, AVIF, SVG) and videos (MP4, WebM, MOV) can be uploaded.'));
  },
});

/**
 * Save an uploaded file. Raster images are resized to max 1920px and stored as WebP.
 * Returns { url, type }.
 */
export async function saveFile(file) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomBytes(8).toString('hex');
  const base = path.parse(file.originalname).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'file';

  if (IMAGE.test(file.mimetype) && !/svg|gif/.test(file.mimetype)) {
    const name = `${base}-${id}.webp`;
    await sharp(file.buffer).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, name));
    return { url: `/uploads/${name}`, type: 'image' };
  }
  const ext = path.extname(file.originalname).toLowerCase() || (VIDEO.test(file.mimetype) ? '.mp4' : '');
  const name = `${base}-${id}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return { url: `/uploads/${name}`, type: VIDEO.test(file.mimetype) ? 'video' : 'image' };
}

/** Delete a file we stored, ignoring anything outside the uploads dir. */
export async function removeFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const target = path.join(UPLOAD_DIR, path.basename(url));
  await fs.unlink(target).catch(() => {});
}
