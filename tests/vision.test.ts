import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VisionLlmProvider,
  TesseractProvider,
  getOcrProvider,
} from '@/lib/ocr/providers';
import { emptyReceipt } from '@/lib/ocr/schema';
describe('Kontrak provider vision', () => {
  beforeEach(() => vi.stubEnv('VISION_API_KEY', 'unit-test-key'));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  it('memvalidasi JSON dari provider sebelum digunakan', async () => {
    const data = {
      ...emptyReceipt,
      merchant: 'Kopi',
      tanggal: '2026-10-12',
      total: 25000,
      confidence: 0.9,
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(data) } }],
          }),
        ),
      ),
    );
    expect(
      (await new VisionLlmProvider().recognize(Buffer.from('fixture'))).data,
    ).toEqual(data);
  });
  it('menolak nominal negatif atau JSON di luar skema', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({ ...emptyReceipt, total: -1 }),
                },
              },
            ],
          }),
        ),
      ),
    );
    await expect(
      new VisionLlmProvider().recognize(Buffer.from('fixture')),
    ).rejects.toThrow();
  });
  it('menggunakan Tesseract ketika key vision tidak tersedia', () => {
    vi.stubEnv('OCR_PROVIDER', 'vision');
    vi.stubEnv('VISION_API_KEY', '');
    expect(getOcrProvider()).toBeInstanceOf(TesseractProvider);
  });
});
