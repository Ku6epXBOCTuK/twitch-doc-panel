import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function hashFile(p) {
  const buf = await fs.readFile(p);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

export async function optimizeImage(src, dest, { width = 640, height = null } = {}) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  let img = sharp(src);
  img = height
    ? img.resize(width, height, { fit: 'cover' })
    : img.resize({ width, withoutEnlargement: true });
  await img.webp({ quality: 80 }).toFile(dest);
}
