import { describe, expect, it } from 'vitest';
import { cashFlow, walletBalance, type Movement } from '@/lib/finance';
import {
  transactionSchema,
  walletSchema,
  filterSchema,
} from '@/lib/validation';
import { isoDate } from '@/lib/dates';
const a = 'clw12345678901234567890123',
  b = 'clw12345678901234567890124';
describe('Saldo dan arus kas', () => {
  const rows: Movement[] = [
    { walletId: a, destinationWalletId: null, type: 'INCOME', amount: 1000000 },
    { walletId: a, destinationWalletId: null, type: 'EXPENSE', amount: 25000 },
    { walletId: a, destinationWalletId: b, type: 'TRANSFER', amount: 100000 },
  ];
  it('menghitung saldo kedua dompet tanpa menduplikasi transfer', () => {
    const left = walletBalance({ id: a, initialBalance: 50000 }, rows);
    const right = walletBalance({ id: b, initialBalance: 10000 }, rows);
    expect(left).toBe(925000);
    expect(right).toBe(110000);
    expect(left + right).toBe(60000 + 1000000 - 25000);
  });
  it('tidak memasukkan transfer dalam pemasukan/pengeluaran', () => {
    expect(cashFlow(rows)).toEqual({ income: 1000000, expense: 25000 });
  });
  it('tetap tepat melampaui batas integer 32-bit pada agregat', () => {
    expect(
      walletBalance({ id: a, initialBalance: 2000000000 }, [
        {
          walletId: a,
          destinationWalletId: null,
          type: 'INCOME',
          amount: 2000000000,
        },
      ]),
    ).toBe(4000000000);
  });
});
describe('Validasi keuangan', () => {
  const data = {
    walletId: a,
    destinationWalletId: b,
    type: 'TRANSFER',
    amount: 20000,
    date: '2026-10-08',
  };
  it('menolak transfer ke dompet sendiri', () =>
    expect(
      transactionSchema.safeParse({ ...data, destinationWalletId: a }).success,
    ).toBe(false));
  it('menolak pecahan dan nominal nol', () => {
    for (const amount of [0, -1, 1.5, 2000000001])
      expect(transactionSchema.safeParse({ ...data, amount }).success).toBe(
        false,
      );
  });
  it('menolak tanggal semu', () => {
    expect(isoDate.safeParse('2026-02-30').success).toBe(false);
    expect(isoDate.safeParse('2024-02-29').success).toBe(true);
  });
  it('mengharuskan kategori selain transfer', () =>
    expect(
      transactionSchema.safeParse({ ...data, type: 'EXPENSE' }).success,
    ).toBe(false));
  it('menerima saldo awal negatif dengan integer', () =>
    expect(
      walletSchema.parse({ name: 'Bank', kind: 'BANK', initialBalance: -100 })
        .initialBalance,
    ).toBe(-100));
  it('menolak rentang tanggal terbalik', () =>
    expect(
      filterSchema.safeParse({ from: '2026-10-09', to: '2026-10-01' }).success,
    ).toBe(false));
});
