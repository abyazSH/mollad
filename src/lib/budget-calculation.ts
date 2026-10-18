import { z } from 'zod';
import { idSchema } from './validation';
import { monthSchema } from './dates';
import { MAX_AMOUNT } from './money';

export const budgetInput = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('fixed'),
    categoryId: idSchema,
    month: monthSchema,
    amount: z.coerce
      .number()
      .int()
      .min(1, 'Anggaran harus lebih dari nol.')
      .max(MAX_AMOUNT),
  }),
  z.object({
    mode: z.literal('percentage'),
    categoryId: idSchema,
    month: monthSchema,
    incomePercent: z.coerce
      .number()
      .int('Gunakan persentase bulat.')
      .min(1, 'Persentase minimal 1%.')
      .max(100, 'Persentase maksimal 100%.'),
  }),
]);

export function percentageBudget(income: number, percent: number) {
  if (
    !Number.isSafeInteger(income) ||
    income < 0 ||
    !Number.isInteger(percent) ||
    percent < 1 ||
    percent > 100
  )
    throw new Error('Dasar anggaran tidak valid.');
  // Round to whole rupiah without losing precision in the intermediate product.
  return Number((BigInt(income) * BigInt(percent) + 50n) / 100n);
}
