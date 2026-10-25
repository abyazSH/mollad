import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { access, mkdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(async () => {}),
}));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('Bahasa OCR pada deployment', () => {
  it('membaca model yang dibundel tanpa menulis ke filesystem read-only', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.mocked(access).mockResolvedValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { ensureLanguages } = await import('@/lib/ocr/languages');
    expect(await ensureLanguages()).toBe(path.resolve('.cache/tesseract'));
    expect(mkdir).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('menggunakan folder sementara jika model tidak tersedia pada runtime Vercel', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.mocked(access).mockRejectedValue(new Error('ENOENT'));
    const fetchMock = vi.fn(
      async () => new Response(new Uint8Array(gzipSync('test model'))),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { ensureLanguages } = await import('@/lib/ocr/languages');
    const results = await Promise.all([ensureLanguages(), ensureLanguages()]);
    expect(results).toEqual([
      path.join(tmpdir(), 'mollad-tesseract'),
      path.join(tmpdir(), 'mollad-tesseract'),
    ]);
    expect(mkdir).toHaveBeenCalledWith(
      path.join(tmpdir(), 'mollad-tesseract'),
      { recursive: true },
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rename).toHaveBeenCalledTimes(2);
  });
  it('persiapan build tetap menulis model ke folder yang disertakan dalam deployment', async () => {
    vi.stubEnv('VERCEL', '1');
    vi.mocked(access).mockResolvedValue(undefined);
    const { prepareLanguages } = await import('@/lib/ocr/languages');
    const directory = path.resolve('.cache/tesseract');
    expect(await prepareLanguages(directory)).toBe(directory);
    expect(mkdir).toHaveBeenCalledWith(directory, { recursive: true });
  });
});
