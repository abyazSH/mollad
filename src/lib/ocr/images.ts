import sharp from 'sharp';
import { HttpError } from '@/lib/http';
export const MAX_UPLOAD = 8 * 1024 * 1024;
export function detectImageMime(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
  return null;
}
export async function prepareImage(buffer: Buffer, claimedMime: string) {
  if (!buffer.length || buffer.length > MAX_UPLOAD)
    throw new HttpError(400, 'Foto maksimal 8 MB.');
  const mime = detectImageMime(buffer);
  if (!mime || (claimedMime && mime !== claimedMime))
    throw new HttpError(400, 'Gunakan foto JPG, PNG, atau WebP asli.');
  try {
    const metadata = await sharp(buffer, {
      limitInputPixels: 25_000_000,
      animated: false,
    }).metadata();
    if (
      !['jpeg', 'png', 'webp'].includes(metadata.format || '') ||
      (metadata.pages || 1) > 1
    )
      throw new Error('InvalidImage');
    // Re-encode: remove EXIF/GPS and any non-image payload; preserve a color review image.
    const original = await sharp(buffer, { limitInputPixels: 25_000_000 })
      .rotate()
      .resize({
        width: 2400,
        height: 3200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#fff' })
      .jpeg({ quality: 90 })
      .toBuffer();
    const processed = await sharp(original)
      .resize({
        width: 1800,
        height: 2600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
    return { original, processed };
  } catch {
    throw new HttpError(
      400,
      'Foto tidak dapat dibaca atau resolusinya terlalu besar (maks. 25 MP).',
    );
  }
}
export async function readUpload(request: Request) {
  const limit = MAX_UPLOAD + 64 * 1024;
  if (Number(request.headers.get('content-length') || 0) > limit)
    throw new HttpError(413, 'Foto maksimal 8 MB.');
  if (!request.body) throw new HttpError(400, 'Pilih foto struk.');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Foto maksimal 8 MB.');
      }
      parts.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  let form: FormData;
  try {
    form = await new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': request.headers.get('content-type') || '' },
      body: new Uint8Array(Buffer.concat(parts)),
    }).formData();
  } catch {
    throw new HttpError(400, 'Unggahan tidak valid.');
  }
  const files = form.getAll('file');
  if (files.length !== 1 || !(files[0] instanceof File))
    throw new HttpError(400, 'Pilih satu foto struk.');
  return files[0];
}
