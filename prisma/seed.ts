import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { defaultCategories } from '../src/lib/defaults';
const db = new PrismaClient();
async function main() {
  const email = 'demo@m.local';
  if (await db.user.findUnique({ where: { email } })) {
    console.log('Akun demo sudah ada; data dipertahankan.');
    return;
  }
  const user = await db.user.create({
    data: {
      name: 'Nadia',
      email,
      passwordHash: await hash('DemoM2026!', 12),
      categories: {
        create: defaultCategories.map(([name, color]) => ({ name, color })),
      },
    },
  });
  const bank = await db.wallet.create({
    data: {
      userId: user.id,
      name: 'Bank utama',
      kind: 'BANK',
      initialBalance: 2500000,
    },
  });
  const cash = await db.wallet.create({
    data: {
      userId: user.id,
      name: 'Tunai',
      kind: 'CASH',
      initialBalance: 350000,
    },
  });
  const categories = await db.category.findMany({ where: { userId: user.id } });
  const names = [
    'Makanan',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
  ];
  const merchants = [
    'Kopi Kenangan',
    'Pertamina',
    'Indomaret',
    'PLN',
    'Cinema',
    'Apotek Sehat',
    'Gramedia',
  ];
  const now = new Date();
  const month = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  })
    .format(now)
    .slice(0, 7);
  for (let i = 0; i < 30; i++) {
    const income = i === 0 || i === 15,
      transfer = i === 29;
    const category = categories.find(
      (c) => c.name === (income ? 'Gaji' : names[i % 7]),
    )!;
    await db.transaction.create({
      data: {
        userId: user.id,
        walletId: i % 3 ? bank.id : cash.id,
        destinationWalletId: transfer ? cash.id : null,
        type: transfer ? 'TRANSFER' : income ? 'INCOME' : 'EXPENSE',
        categoryId: transfer ? null : category.id,
        amount: transfer
          ? 150000
          : income
            ? 3500000
            : [35000, 100000, 125000, 275000, 60000, 45000, 85000][i % 7],
        date: new Date(
          month +
            '-' +
            String(Math.min(i + 1, 28)).padStart(2, '0') +
            'T00:00:00Z',
        ),
        merchant: transfer ? '' : income ? 'Gaji bulanan' : merchants[i % 7],
        note: 'Data demo M',
      },
    });
  }
  for (const [name, amount] of [
    ['Makanan', 600000],
    ['Transportasi', 600000],
    ['Belanja', 500000],
  ] as const)
    await db.budget.create({
      data: {
        userId: user.id,
        categoryId: categories.find((c) => c.name === name)!.id,
        month,
        amount,
      },
    });
  console.log('Demo M siap: demo@m.local / DemoM2026!');
}
main()
  .catch(() => {
    console.error('Seed demo gagal.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
