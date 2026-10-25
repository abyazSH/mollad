import { mkdir, access, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
async function ready(directory: string) {
  try {
    await Promise.all(
      ['ind', 'eng'].map((lang) =>
        access(path.join(directory, lang + '.traineddata')),
      ),
    );
    return true;
  } catch {
    return false;
  }
}
let pending: Promise<string> | undefined;
export function ensureLanguages() {
  if (!pending)
    pending = prepare().catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}
async function prepare() {
  const bundled = path.resolve('.cache/tesseract');
  // Deployment assets are read-only. Do not mkdir/write when models are bundled.
  if (await ready(bundled)) return bundled;
  const directory = process.env.VERCEL
    ? path.join(tmpdir(), 'mollad-tesseract')
    : bundled;
  return prepareLanguages(directory);
}
export async function prepareLanguages(directory: string) {
  await mkdir(directory, { recursive: true });
  for (const lang of ['ind', 'eng']) {
    const target = path.join(directory, lang + '.traineddata');
    try {
      await access(target);
      continue;
    } catch {
      /* Fetch a fixed trusted language asset on first run. */
    }
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@tesseract.js-data/' +
        lang +
        '/4.0.0_best_int/' +
        lang +
        '.traineddata.gz',
      { signal: AbortSignal.timeout(60000) },
    );
    if (!response.ok) throw new Error('LanguageDownloadError');
    const bytes = gunzipSync(Buffer.from(await response.arrayBuffer()), {
      maxOutputLength: 64 * 1024 * 1024,
    });
    const temporary = target + '.' + randomUUID() + '.tmp';
    await writeFile(temporary, bytes);
    try {
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(() => {});
    }
  }
  return directory;
}
