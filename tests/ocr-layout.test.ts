import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  recognize: vi.fn(),
  parameters: vi.fn(),
  terminate: vi.fn(),
}));
vi.mock('tesseract.js', () => ({
  PSM: { SINGLE_BLOCK: '6', AUTO: '3', SPARSE_TEXT: '11' },
  createWorker: vi.fn(async () => ({
    recognize: mocks.recognize,
    setParameters: mocks.parameters,
    terminate: mocks.terminate,
  })),
}));
vi.mock('@/lib/ocr/languages', () => ({
  ensureLanguages: vi.fn(async () => '/models'),
}));
import { TesseractProvider } from '@/lib/ocr/providers';
beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  mocks.recognize.mockReset();
});
describe('Pemulihan OCR yang hanya mengenali merchant', () => {
  it('mencoba tata letak otomatis jika pembacaan blok hanya menemukan header', async () => {
    mocks.recognize
      .mockResolvedValueOnce({ data: { text: 'KOPI PAGI', confidence: 95 } })
      .mockResolvedValueOnce({
        data: { text: 'KOPI PAGI\n25/10/2026\nTOTAL 25.000', confidence: 85 },
      });
    const result = await new TesseractProvider().recognize(
      Buffer.from('image'),
    );
    expect(result.data.total).toBe(25000);
    expect(result.data.tanggal).toBe('2026-10-25');
    expect(mocks.recognize).toHaveBeenCalledTimes(2);
    expect(mocks.parameters.mock.calls[1][0].tessedit_pageseg_mode).toBe('3');
    expect(mocks.terminate).toHaveBeenCalledTimes(1);
  });
  it('tidak mengulangi OCR jika data pokok sudah terbaca', async () => {
    mocks.recognize.mockResolvedValue({
      data: { text: 'KOPI PAGI\n25/10/2026\nTOTAL 25.000', confidence: 90 },
    });
    expect(
      (await new TesseractProvider().recognize(Buffer.from('image'))).data
        .total,
    ).toBe(25000);
    expect(mocks.recognize).toHaveBeenCalledTimes(1);
  });
  it('tidak mengarang nominal ketika semua tata letak gagal', async () => {
    mocks.recognize.mockResolvedValue({
      data: { text: 'KOPI PAGI', confidence: 90 },
    });
    expect(
      (await new TesseractProvider().recognize(Buffer.from('image'))).data
        .total,
    ).toBe(0);
    expect(mocks.recognize).toHaveBeenCalledTimes(3);
  });
});
