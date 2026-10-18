import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  apiError,
  apiUser,
  HttpError,
  jsonInput,
  sameOrigin,
} from '@/lib/http';
import { idSchema } from '@/lib/validation';
import { monthSchema, today } from '@/lib/dates';
import { budgetList } from '@/lib/budgets';
import { budgetInput } from '@/lib/budget-calculation';
export async function GET(request: Request) {
  try {
    const user = await apiUser();
    const month = monthSchema.parse(
      new URL(request.url).searchParams.get('month') || today().slice(0, 7),
    );
    return NextResponse.json(await budgetList(user.id, month));
  } catch (e) {
    return apiError(e);
  }
}
async function save(request: Request) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const raw = await jsonInput(request);
    // Older clients that send only an amount continue to create fixed budgets.
    const data = budgetInput.parse(
      typeof raw === 'object' && raw !== null ? { mode: 'fixed', ...raw } : raw,
    );
    const id =
      request.method === 'PATCH'
        ? z.object({ id: idSchema }).parse(raw).id
        : null;
    const result = await db.$transaction(async (tx) => {
      if (
        !(await tx.category.findFirst({
          where: { userId: user.id, id: data.categoryId },
        }))
      )
        throw new HttpError(404, 'Kategori tidak ditemukan.');
      const saved = {
        categoryId: data.categoryId,
        month: data.month,
        // Percentage limits are resolved from monthly income when queried.
        amount: data.mode === 'fixed' ? data.amount : 0,
        incomePercent: data.mode === 'percentage' ? data.incomePercent : null,
      };
      if (id) {
        const result = await tx.budget.updateMany({
          where: { userId: user.id, id },
          data: saved,
        });
        if (!result.count)
          throw new HttpError(404, 'Anggaran tidak ditemukan.');
        return { id };
      }
      return tx.budget.upsert({
        where: {
          userId_categoryId_month: {
            userId: user.id,
            categoryId: data.categoryId,
            month: data.month,
          },
        },
        create: { ...saved, userId: user.id },
        update: { amount: saved.amount, incomePercent: saved.incomePercent },
      });
    });
    revalidatePath('/', 'layout');
    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
export const POST = save;
export const PATCH = save;
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const user = await apiUser();
    const { id } = z.object({ id: idSchema }).parse(await jsonInput(request));
    const result = await db.budget.deleteMany({
      where: { id, userId: user.id },
    });
    if (!result.count) throw new HttpError(404, 'Anggaran tidak ditemukan.');
    revalidatePath('/', 'layout');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
