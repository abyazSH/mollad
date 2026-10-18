import { cashFlow } from './finance';
import type { TransactionType } from '@prisma/client';
export function budgetProgress(spent: number, amount: number) {
  if (amount <= 0)
    return {
      percent: spent > 0 ? 100 : 0,
      status: spent > 0 ? 'over' : 'safe',
    } as const;
  const percent = Math.round((spent / amount) * 100);
  return {
    percent,
    status: spent > amount ? 'over' : spent > amount * 0.8 ? 'warning' : 'safe',
  } as const;
}
export function summarize(
  rows: {
    type: TransactionType;
    amount: number;
    date: Date;
    category: { name: string; color: string } | null;
  }[],
  month: string,
) {
  const selected = rows.filter((r) => r.date.toISOString().startsWith(month));
  const totals = cashFlow(selected);
  const categories = new Map<
    string,
    { name: string; color: string; value: number }
  >();
  selected
    .filter((r) => r.type === 'EXPENSE')
    .forEach((r) => {
      const name = r.category?.name || 'Tanpa kategori';
      const entry = categories.get(name) || {
        name,
        color: r.category?.color || '#64748B',
        value: 0,
      };
      entry.value += r.amount;
      categories.set(name, entry);
    });
  const days = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  const daily = Array.from({ length: days }, (_, i) => {
    const date = month + '-' + String(i + 1).padStart(2, '0');
    return {
      label: String(i + 1),
      ...cashFlow(
        selected.filter((r) => r.date.toISOString().startsWith(date)),
      ),
    };
  });
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(month + '-01T00:00:00Z');
    date.setUTCMonth(date.getUTCMonth() - 5 + i);
    const prefix = date.toISOString().slice(0, 7);
    return {
      label: new Intl.DateTimeFormat('id-ID', {
        month: 'short',
        timeZone: 'UTC',
      }).format(date),
      ...cashFlow(rows.filter((r) => r.date.toISOString().startsWith(prefix))),
    };
  });
  return {
    ...totals,
    remainder: totals.income - totals.expense,
    categories: [...categories.values()].sort((a, b) => b.value - a.value),
    daily,
    monthly,
  };
}
