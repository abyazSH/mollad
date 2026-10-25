// Leave headroom for multipart headers below the hosting request body limit.
import { z } from 'zod';
import { receiptSchema } from './ocr/schema';
export const RECEIPT_TRANSPORT_LIMIT = 3_500_000;
const scanResponse = z.object({
  id: z.string().min(1).max(128),
  data: receiptSchema,
  rawText: z.string().max(100000).optional(),
  duplicate: z.boolean(),
  manual: z.boolean(),
  lowConfidence: z.array(z.string().max(40)).max(20),
  ocrError: z.enum(['OCR_TIMEOUT', 'OCR_ENGINE_FAILED']).optional(),
});

export async function prepareReceiptUpload(file: File): Promise<Blob> {
  if (file.size <= RECEIPT_TRANSPORT_LIMIT) return file;
  const url = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            'Foto tidak dapat dibuka. Coba foto JPG atau PNG yang lain.',
          ),
        );
      image.src = url;
    });
    const scale = Math.min(
      1,
      2400 / image.naturalWidth,
      3200 / image.naturalHeight,
    );
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('Foto belum dapat diproses. Coba foto yang lebih kecil.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.88, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', quality),
      );
      if (blob && blob.size <= RECEIPT_TRANSPORT_LIMIT) return blob;
    }
    throw new Error(
      'Foto masih terlalu besar. Potong area di luar struk atau pilih foto yang lebih kecil.',
    );
  } finally {
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function readReceiptResponse(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 413)
      throw new Error(
        'Foto terlalu besar untuk diunggah. Potong area di luar struk, lalu coba lagi.',
      );
    if (response.status === 504)
      throw new Error(
        'Pembacaan struk terlalu lama. Coba lagi dengan foto yang lebih jelas atau catat manual.',
      );
    const message =
      body &&
      typeof body === 'object' &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : 'Pemindai belum dapat dihubungi. Coba lagi atau catat transaksi secara manual.';
    throw new Error(message);
  }
  const result = scanResponse.safeParse(body);
  if (!result.success)
    throw new Error('Hasil pemindaian tidak valid. Silakan coba lagi.');
  return result.data;
}
