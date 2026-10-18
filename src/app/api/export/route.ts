import { apiError, apiUser } from '@/lib/http';
import { db } from '@/lib/db';
import { transactionWhere } from '@/lib/queries';
import { toCsv } from '@/lib/csv';
import { typeLabels } from '@/lib/finance';
export async function GET(request: Request) {
  try {
    const user = await apiUser();
    const { where } = transactionWhere(
      user.id,
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const rows = await db.transaction.findMany({
      where,
      include: { wallet: true, destinationWallet: true, category: true },
      orderBy: { date: 'desc' },
    });
    const csv = toCsv([
      [
        'Tanggal',
        'Jenis',
        'Nominal (IDR)',
        'Kategori',
        'Dompet',
        'Dompet tujuan',
        'Merchant',
        'Catatan',
      ],
      ...rows.map((r) => [
        r.date.toISOString().slice(0, 10),
        typeLabels[r.type],
        r.amount,
        r.category?.name || '',
        r.wallet.name,
        r.destinationWallet?.name || '',
        r.merchant,
        r.note,
      ]),
    ]);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mollad-transaksi.csv"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
