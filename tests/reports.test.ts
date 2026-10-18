import { describe, it, expect } from 'vitest';
import { summarize, budgetProgress } from '@/lib/analytics';
import { toCsv, csvCell } from '@/lib/csv';
describe('Laporan dan anggaran', () => {
  it('memisahkan periode dan tidak menganggap transfer sebagai arus kas', () => {
    const result = summarize(
      [
        {
          type: 'INCOME',
          amount: 1000,
          date: new Date('2026-10-01'),
          category: null,
        },
        {
          type: 'EXPENSE',
          amount: 400,
          date: new Date('2026-10-02'),
          category: { name: 'Makanan', color: '#10B981' },
        },
        {
          type: 'TRANSFER',
          amount: 500,
          date: new Date('2026-10-03'),
          category: null,
        },
        {
          type: 'EXPENSE',
          amount: 200,
          date: new Date('2026-09-30'),
          category: null,
        },
      ],
      '2026-10',
    );
    expect(result.income).toBe(1000);
    expect(result.expense).toBe(400);
    expect(result.remainder).toBe(600);
    expect(result.categories[0].value).toBe(400);
    expect(result.daily).toHaveLength(31);
    expect(result.monthly[4].expense).toBe(200);
  });
  it('memperingatkan hanya ketika melewati 80% dan 100%', () => {
    expect(budgetProgress(80, 100).status).toBe('safe');
    expect(budgetProgress(81, 100).status).toBe('warning');
    expect(budgetProgress(100, 100).status).toBe('warning');
    expect(budgetProgress(101, 100).status).toBe('over');
  });
  it('mencegah formula injection dan menangani koma/kutip/baris baru di CSV', () => {
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(
      toCsv([
        ['Nama', 'Nominal'],
        ['Toko', 12500],
      ]),
    ).toContain('"Toko","12500"');
  });
});
