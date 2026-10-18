import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  apiError,
  apiUser,
  HttpError,
  rateLimit,
  sameOrigin,
} from '@/lib/http';
import { prepareImage, readUpload } from '@/lib/ocr/images';
import { getOcrProvider } from '@/lib/ocr/providers';
import { emptyReceipt, type ReceiptData } from '@/lib/ocr/schema';
import { lowConfidenceFields } from '@/lib/ocr/parser';
import { normalizeMerchant } from '@/lib/duplicates';
export const runtime = 'nodejs';
export const maxDuration = 180;
let active = 0;
export async function POST(request: Request) {
  let acquired = false;
  try {
    sameOrigin(request);
    const user = await apiUser();
    await rateLimit('upload:' + user.id, 10);
    if (active >= 2)
      throw new HttpError(429, 'Pemindai sedang sibuk. Coba sebentar lagi.');
    active++;
    acquired = true;
    const file = await readUpload(request);
    const { processed } = await prepareImage(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    let data: ReceiptData = { ...emptyReceipt },
      rawText = '',
      failed = false;
    try {
      const result = await getOcrProvider().recognize(processed);
      data = result.data;
      rawText = result.rawText;
    } catch {
      failed = true;
      console.error('[mollad] OCR gagal; review manual tersedia.');
    }
    // Only text/structured data persists. Image buffers are request-scoped;
    // the review uses the original browser File through a local blob URL.
    const receipt = await db.receipt.create({
      data: {
        userId: user.id,
        path: '',
        rawText,
        extracted: data,
        confidence: data.confidence,
      },
    });
    const candidates =
      data.tanggal && data.total && data.merchant
        ? await db.transaction.findMany({
            where: {
              userId: user.id,
              date: new Date(data.tanggal + 'T00:00:00Z'),
              amount: data.total,
            },
            select: { merchant: true },
          })
        : [];
    const duplicate = candidates.some(
      (c) => normalizeMerchant(c.merchant) === normalizeMerchant(data.merchant),
    );
    return NextResponse.json(
      {
        id: receipt.id,
        data,
        duplicate,
        manual: failed || data.confidence < 0.55 || !data.total,
        lowConfidence: lowConfidenceFields(data),
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  } finally {
    if (acquired) active--;
  }
}
