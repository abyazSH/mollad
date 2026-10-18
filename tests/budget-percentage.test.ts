import { describe, it, expect, vi, beforeEach } from 'vitest';
import { budgetInput, percentageBudget } from '@/lib/budget-calculation';
import { budgetProgress } from '@/lib/analytics';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  groupBy: vi.fn(),
  aggregate: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    budget: { findMany: mocks.findMany },
    transaction: { groupBy: mocks.groupBy, aggregate: mocks.aggregate },
  },
}));
import { budgetOverview } from '@/lib/budgets';

describe('Anggaran persentase penghasilan', () => {
  it('menghitung persentase dan membulatkan ke rupiah terdekat', () => {
    expect(percentageBudget(5000000, 30)).toBe(1500000);
    expect(percentageBudget(101, 50)).toBe(51);
    expect(percentageBudget(0, 30)).toBe(0);
    expect(percentageBudget(2000000000, 100)).toBe(2000000000);
  });
  it('menjaga akurasi ketika perkalian sementara melebihi integer aman', () => {
    expect(percentageBudget(Number.MAX_SAFE_INTEGER, 100)).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });
  it.each([0, -1, 101, 1.5, NaN])(
    'menolak persentase tidak valid %s',
    (percent) => {
      expect(() => percentageBudget(1000000, percent)).toThrow();
    },
  );
  it('memvalidasi input kedua mode dan mengabaikan nominal buatan pada mode persentase', () => {
    const base = { categoryId: 'cm123456789012345678901234', month: '2026-10' };
    const percentage = budgetInput.parse({
      ...base,
      mode: 'percentage',
      incomePercent: '30',
      amount: 999999,
    });
    expect(percentage).toMatchObject({ mode: 'percentage', incomePercent: 30 });
    expect(percentage).not.toHaveProperty('amount');
    expect(
      budgetInput.parse({ ...base, mode: 'fixed', amount: '150000' }),
    ).toHaveProperty('amount', 150000);
    for (const percent of [0, 101, 1.5, '', 'abc']) {
      expect(
        budgetInput.safeParse({
          ...base,
          mode: 'percentage',
          incomePercent: percent,
        }).success,
      ).toBe(false);
    }
  });
  it('menangani alokasi nol tanpa NaN atau Infinity', () => {
    expect(budgetProgress(0, 0)).toEqual({ percent: 0, status: 'safe' });
    expect(budgetProgress(1000, 0)).toEqual({ percent: 100, status: 'over' });
  });
});

describe('Perhitungan dinamis dan isolasi data anggaran', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([
      { id: 'percentage', categoryId: 'food', amount: 0, incomePercent: 30 },
      {
        id: 'fixed',
        categoryId: 'transport',
        amount: 100000,
        incomePercent: null,
      },
    ]);
    mocks.groupBy.mockResolvedValue([
      { categoryId: 'food', _sum: { amount: 700000 } },
    ]);
  });
  it('mengikuti perubahan pemasukan tanpa mengubah batas nominal tetap', async () => {
    mocks.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 2000000 } })
      .mockResolvedValueOnce({ _sum: { amount: 3000000 } });
    const first = await budgetOverview('owner', '2026-10');
    const next = await budgetOverview('owner', '2026-10');
    expect(first.budgets[0]).toMatchObject({ amount: 600000, status: 'over' });
    expect(next.budgets[0]).toMatchObject({ amount: 900000, status: 'safe' });
    expect(next.budgets[1].amount).toBe(100000);
    expect(mocks.aggregate).toHaveBeenCalledWith({
      where: {
        userId: 'owner',
        type: 'INCOME',
        date: { gte: new Date('2026-10-01'), lt: new Date('2026-11-01') },
      },
      _sum: { amount: true },
    });
    expect(mocks.groupBy.mock.calls[0][0].where).toMatchObject({
      userId: 'owner',
      type: 'EXPENSE',
    });
    expect(mocks.findMany.mock.calls[0][0].where).toEqual({
      userId: 'owner',
      month: '2026-10',
    });
  });
  it('menampilkan alokasi nol dan status terlampaui saat ada pengeluaran tanpa pemasukan', async () => {
    mocks.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const result = await budgetOverview('owner', '2026-10');
    expect(result.income).toBe(0);
    expect(result.budgets[0]).toMatchObject({
      amount: 0,
      percent: 100,
      status: 'over',
    });
  });
});
