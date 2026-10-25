import { describe, expect, it } from 'vitest';
import {
  prepareReceiptUpload,
  readReceiptResponse,
} from '@/lib/receipt-upload';
import { emptyReceipt } from '@/lib/ocr/schema';
describe('Respons upload struk', () => {
  it('menjelaskan batas hosting meskipun respons 413 bukan JSON', async () => {
    await expect(
      readReceiptResponse(
        new Response('FUNCTION_PAYLOAD_TOO_LARGE', { status: 413 }),
      ),
    ).rejects.toThrow('Foto terlalu besar');
  });
  it('menjelaskan timeout hosting tanpa membocorkan HTML respons', async () => {
    await expect(
      readReceiptResponse(
        new Response('<html>Timeout</html>', { status: 504 }),
      ),
    ).rejects.toThrow('terlalu lama');
  });
  it('menangani kegagalan non-JSON dan mempertahankan pesan server yang aman', async () => {
    await expect(
      readReceiptResponse(new Response('<html>Error</html>', { status: 500 })),
    ).rejects.toThrow('Pemindai belum dapat dihubungi');
    await expect(
      readReceiptResponse(
        Response.json(
          { error: 'Silakan masuk terlebih dahulu.' },
          { status: 401 },
        ),
      ),
    ).rejects.toThrow('Silakan masuk');
  });
  it('memvalidasi hasil OCR sebelum ditampilkan', async () => {
    const valid = {
      id: 'receipt-test',
      data: emptyReceipt,
      duplicate: false,
      manual: true,
      lowConfidence: ['total'],
      ocrError: 'OCR_ENGINE_FAILED',
    };
    expect(await readReceiptResponse(Response.json(valid))).toEqual(valid);
    await expect(
      readReceiptResponse(Response.json({ ...valid, data: { total: 'abc' } })),
    ).rejects.toThrow('tidak valid');
  });
  it('tidak mengompresi ulang file kecil', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    expect(await prepareReceiptUpload(file)).toBe(file);
  });
});
