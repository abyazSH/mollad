import { z } from 'zod';
import { isoDate } from '@/lib/dates';
import { MAX_AMOUNT } from '@/lib/money';
export const receiptSchema = z.object({
  merchant: z.string().trim().max(120),
  tanggal: isoDate.nullable(),
  total: z.number().int().min(0).max(MAX_AMOUNT),
  pajak: z.number().int().min(0).max(MAX_AMOUNT),
  diskon: z.number().int().min(0).max(MAX_AMOUNT),
  metode_bayar: z.string().max(80),
  items: z
    .array(
      z.object({
        nama: z.string().max(160),
        qty: z.number().positive().max(100000),
        harga: z.number().int().min(0).max(MAX_AMOUNT),
      }),
    )
    .max(200),
  kategori_saran: z.string().max(40),
  confidence: z.number().min(0).max(1),
});
export type ReceiptData = z.infer<typeof receiptSchema>;
export const emptyReceipt: ReceiptData = {
  merchant: '',
  tanggal: null,
  total: 0,
  pajak: 0,
  diskon: 0,
  metode_bayar: '',
  items: [],
  kategori_saran: 'Lainnya',
  confidence: 0,
};
