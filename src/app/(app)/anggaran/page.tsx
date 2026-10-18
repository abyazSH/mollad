import { requireUser } from '@/lib/auth';
import { monthSchema, today } from '@/lib/dates';
import { budgetOverview } from '@/lib/budgets';
import { categoryList } from '@/lib/queries';
import { BudgetManager } from '@/components/budget-manager';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const month = monthSchema.safeParse(params.month || today().slice(0, 7));
  if (!month.success) return <p className="error-box">Bulan tidak valid.</p>;
  const [overview, categories] = await Promise.all([
    budgetOverview(user.id, month.data),
    categoryList(user.id),
  ]);
  return (
    <BudgetManager
      budgets={overview.budgets}
      income={overview.income}
      categories={categories}
      month={month.data}
    />
  );
}
