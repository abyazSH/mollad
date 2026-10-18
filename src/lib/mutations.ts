import { db } from './db';
import { HttpError } from './http';
import { normalizeMerchant } from './duplicates';
import {
  categorySchema,
  idSchema,
  transactionSchema,
  walletSchema,
} from './validation';
export async function saveWallet(userId: string, input: unknown, id?: string) {
  const data = walletSchema.parse(input);
  if (!id) return db.wallet.create({ data: { ...data, userId } });
  idSchema.parse(id);
  const result = await db.wallet.updateMany({ where: { id, userId }, data });
  if (!result.count) throw new HttpError(404, 'Dompet tidak ditemukan.');
  return { id };
}
export async function saveCategory(
  userId: string,
  input: unknown,
  id?: string,
) {
  const data = categorySchema.parse(input);
  if (!id) return db.category.create({ data: { ...data, userId } });
  idSchema.parse(id);
  const result = await db.category.updateMany({ where: { id, userId }, data });
  if (!result.count) throw new HttpError(404, 'Kategori tidak ditemukan.');
  return { id };
}
export async function saveTransaction(
  userId: string,
  input: unknown,
  id?: string,
) {
  const value = transactionSchema.parse(input);
  if (id) idSchema.parse(id);
  return db.$transaction(async (tx) => {
    if (id && !(await tx.transaction.findFirst({ where: { id, userId } })))
      throw new HttpError(404, 'Transaksi tidak ditemukan.');
    const walletIds = [
      value.walletId,
      ...(value.type === 'TRANSFER' ? [value.destinationWalletId!] : []),
    ];
    if (
      (await tx.wallet.count({ where: { id: { in: walletIds }, userId } })) !==
      walletIds.length
    )
      throw new HttpError(404, 'Dompet tidak ditemukan.');
    const categoryId = value.type === 'TRANSFER' ? null : value.categoryId!;
    if (
      categoryId &&
      !(await tx.category.findFirst({ where: { id: categoryId, userId } }))
    )
      throw new HttpError(404, 'Kategori tidak ditemukan.');
    if (
      value.receiptId &&
      !(await tx.receipt.findFirst({
        where: { id: value.receiptId, userId, transactionId: null },
      }))
    )
      throw new HttpError(409, 'Struk tidak tersedia atau sudah disimpan.');
    const data = {
      userId,
      type: value.type,
      amount: value.amount,
      date: new Date(value.date + 'T00:00:00.000Z'),
      walletId: value.walletId,
      destinationWalletId:
        value.type === 'TRANSFER' ? value.destinationWalletId! : null,
      categoryId,
      note: value.note,
      merchant: value.merchant,
    };
    if (value.receiptId && value.merchant && !value.allowDuplicate) {
      const candidates = await tx.transaction.findMany({
        where: {
          userId,
          amount: value.amount,
          date: data.date,
          ...(id ? { id: { not: id } } : {}),
        },
        select: { merchant: true },
      });
      if (
        candidates.some(
          (candidate) =>
            normalizeMerchant(candidate.merchant) ===
            normalizeMerchant(value.merchant),
        )
      ) {
        throw new HttpError(
          409,
          'Transaksi serupa sudah ada. Periksa kembali, lalu konfirmasi jika ini transaksi yang berbeda.',
          'DUPLICATE',
        );
      }
    }
    const saved = id
      ? await tx.transaction.update({ where: { id, userId }, data })
      : await tx.transaction.create({ data });
    if (value.receiptId) {
      const attached = await tx.receipt.updateMany({
        where: { id: value.receiptId, userId, transactionId: null },
        data: { transactionId: saved.id },
      });
      if (!attached.count)
        throw new HttpError(409, 'Struk sudah disimpan oleh permintaan lain.');
    }
    return saved;
  });
}
export async function deleteRecord(
  userId: string,
  resource: string,
  id: string,
) {
  idSchema.parse(id);
  if (resource === 'wallets') {
    const used = await db.transaction.count({
      where: { userId, OR: [{ walletId: id }, { destinationWalletId: id }] },
    });
    if (used)
      throw new HttpError(
        409,
        'Dompet masih memiliki transaksi. Pindahkan atau hapus transaksinya dahulu.',
      );
    const result = await db.wallet.deleteMany({ where: { userId, id } });
    if (!result.count) throw new HttpError(404, 'Dompet tidak ditemukan.');
  } else if (resource === 'categories') {
    // Keep the historical category until the user explicitly recategorizes its transactions.
    const used = await db.transaction.count({
      where: { userId, categoryId: id },
    });
    if (used)
      throw new HttpError(
        409,
        'Kategori masih digunakan. Ubah kategori pada transaksi terkait dahulu.',
      );
    const result = await db.category.deleteMany({ where: { userId, id } });
    if (!result.count) throw new HttpError(404, 'Kategori tidak ditemukan.');
  } else if (resource === 'transactions') {
    const result = await db.transaction.deleteMany({ where: { userId, id } });
    if (!result.count) throw new HttpError(404, 'Transaksi tidak ditemukan.');
  } else throw new HttpError(404, 'Data tidak ditemukan.');
  return { ok: true };
}
