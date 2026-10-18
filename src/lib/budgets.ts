import { db } from './db';
import { monthRange } from './dates';
import { budgetProgress } from './analytics';
import { percentageBudget } from './budget-calculation';
export async function budgetOverview(userId: string, month: string) {
  const [budgets, spent, earnings] = await Promise.all([
    db.budget.findMany({
      where: { userId, month },
      include: { category: true },
      orderBy: { category: { name: 'asc' } },
    }),
    db.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: monthRange(month) },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { userId, type: 'INCOME', date: monthRange(month) },
      _sum: { amount: true },
    }),
  ]);
  const income = earnings._sum.amount || 0;
  const resolved = budgets.map((b) => {
    const spentAmount =
      spent.find((s) => s.categoryId === b.categoryId)?._sum.amount || 0;
    const amount =
      b.incomePercent == null
        ? b.amount
        : percentageBudget(income, b.incomePercent);
    return {
      ...b,
      amount,
      spent: spentAmount,
      ...budgetProgress(spentAmount, amount),
    };
  });
  return { budgets: resolved, income };
}
export async function budgetList(userId: string, month: string) {
  return (await budgetOverview(userId, month)).budgets;
}
