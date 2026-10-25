import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyReceipt } from '@/lib/ocr/schema';
const mocks = vi.hoisted(() => ({ recognize: vi.fn(), create: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    receipt: { create: mocks.create },
    transaction: { findMany: vi.fn(async () => []) },
  },
}));
vi.mock('@/lib/http', () => ({
  sameOrigin: vi.fn(),
  apiUser: vi.fn(async () => ({ id: 'user-test' })),
  rateLimit: vi.fn(),
  HttpError: class extends Error {},
  apiError: vi.fn(() => Response.json({ error: 'error' }, { status: 500 })),
}));
vi.mock('@/lib/ocr/images', () => ({
  readUpload: vi.fn(
    async () => new File(['image'], 'receipt.png', { type: 'image/png' }),
  ),
  prepareImage: vi.fn(async () => ({ processed: Buffer.from('image') })),
}));
vi.mock('@/lib/ocr/providers', () => ({
  getOcrProvider: () => ({ recognize: mocks.recognize }),
}));
import { POST } from '@/app/api/receipts/route';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockResolvedValue({ id: 'receipt-test' });
});
describe('Diagnostik pembacaan OCR', () => {
  it('membedakan kerusakan mesin dari foto dengan keyakinan rendah tanpa membocorkan error internal', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mocks.recognize.mockRejectedValue(
        new Error('secret/path/internal-detail'),
      );
      const response = await POST(
        new Request('http://localhost/api/receipts', { method: 'POST' }),
      );
      const body = await response.json();
      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        manual: true,
        ocrError: 'OCR_ENGINE_FAILED',
        data: { total: 0 },
      });
      expect(JSON.stringify(body)).not.toContain('secret');
      expect(JSON.stringify(log.mock.calls)).not.toContain('secret');
      expect(mocks.create.mock.calls[0][0].data.path).toBe('');
    } finally {
      log.mockRestore();
    }
  });
  it('menandai timeout agar pengguna dapat mencoba ulang', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mocks.recognize.mockRejectedValue(new Error('OcrTimeout'));
      const response = await POST(
        new Request('http://localhost/api/receipts', { method: 'POST' }),
      );
      expect(await response.json()).toMatchObject({
        manual: true,
        ocrError: 'OCR_TIMEOUT',
      });
    } finally {
      log.mockRestore();
    }
  });
  it('foto dengan tulisan tidak terbaca bukan dianggap kerusakan mesin', async () => {
    mocks.recognize.mockResolvedValue({ rawText: '', data: emptyReceipt });
    const response = await POST(
      new Request('http://localhost/api/receipts', { method: 'POST' }),
    );
    const body = await response.json();
    expect(body.manual).toBe(true);
    expect(body.rawText).toBe('');
    expect(body.ocrError).toBeUndefined();
  });
});
