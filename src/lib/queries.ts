import { db } from './db';
import { walletBalance } from './finance';
import { filterSchema } from './validation';
import type { Prisma } from '@prisma/client';
export async function walletList(userId: string) {
  const [wallets, transactions] = await Promise.all([
    db.wallet.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    db.transaction.findMany({
      where: { userId },
      select: {
        walletId: true,
        destinationWalletId: true,
        type: true,
        amount: true,
      },
    }),
  ]);
  return wallets.map((wallet) => ({
    ...wallet,
    balance: walletBalance(wallet, transactions),
  }));
}
export function categoryList(userId: string) {
  return db.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
}
export function transactionWhere(userId: string, input: unknown) {
  const f = filterSchema.parse(input);
  const where: Prisma.TransactionWhereInput = { userId };
  if (f.q)
    where.AND = [
      { OR: [{ merchant: { contains: f.q } }, { note: { contains: f.q } }] },
    ];
  if (f.type) where.type = f.type;
  if (f.walletId)
    where.OR = [{ walletId: f.walletId }, { destinationWalletId: f.walletId }];
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.from || f.to)
    where.date = {
      ...(f.from ? { gte: new Date(f.from + 'T00:00:00Z') } : {}),
      ...(f.to ? { lte: new Date(f.to + 'T23:59:59.999Z') } : {}),
    };
  return { where, filters: f };
}
export async function transactionList(userId: string, input: unknown) {
  const { where, filters } = transactionWhere(userId, input);
  const count = await db.transaction.count({ where });
  const pages = Math.max(1, Math.ceil(count / 15));
  const page = Math.min(filters.page, pages);
  const rows = await db.transaction.findMany({
    where,
    include: {
      wallet: true,
      destinationWallet: true,
      category: true,
      receipt: { select: { id: true, path: true } },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 15,
    skip: (page - 1) * 15,
  });
  return {
    rows: rows.map((row) => ({
      ...row,
      receipt: row.receipt?.path ? { id: row.receipt.id } : null,
    })),
    count,
    pages,
    page,
  };
}
