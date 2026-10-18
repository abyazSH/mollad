import { z } from 'zod';
import { MAX_AMOUNT } from './money';
import { isoDate } from './dates';
export const idSchema = z.string().cuid('Identitas data tidak valid.');
const amount = z.coerce
  .number()
  .int('Nominal harus berupa rupiah utuh.')
  .min(1, 'Nominal harus lebih dari nol.')
  .max(MAX_AMOUNT, 'Nominal maksimal Rp2 miliar.');
export const walletSchema = z.object({
  name: z.string().trim().min(1, 'Nama dompet wajib diisi.').max(60),
  kind: z.enum(['CASH', 'BANK', 'EWALLET']),
  initialBalance: z.coerce.number().int().min(-MAX_AMOUNT).max(MAX_AMOUNT),
});
export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi.').max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Warna tidak valid.'),
});
export const transactionSchema = z
  .object({
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amount,
    date: isoDate,
    walletId: idSchema,
    categoryId: z.union([idSchema, z.literal('')]).optional(),
    destinationWalletId: z.union([idSchema, z.literal('')]).optional(),
    merchant: z.string().trim().max(120).default(''),
    note: z.string().trim().max(1000).default(''),
    receiptId: idSchema.optional(),
    allowDuplicate: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === 'TRANSFER' &&
      (!data.destinationWalletId || data.destinationWalletId === data.walletId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pilih dompet tujuan yang berbeda.',
        path: ['destinationWalletId'],
      });
    }
    if (data.type !== 'TRANSFER' && !data.categoryId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pilih kategori.',
        path: ['categoryId'],
      });
  });
export const filterSchema = z
  .object({
    q: z.string().trim().max(120).default(''),
    type: z.enum(['', 'INCOME', 'EXPENSE', 'TRANSFER']).default(''),
    walletId: z.union([idSchema, z.literal('')]).default(''),
    categoryId: z.union([idSchema, z.literal('')]).default(''),
    from: z.union([isoDate, z.literal('')]).default(''),
    to: z.union([isoDate, z.literal('')]).default(''),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'Tanggal akhir harus setelah tanggal awal.',
  });
export type TransactionInput = z.infer<typeof transactionSchema>;
