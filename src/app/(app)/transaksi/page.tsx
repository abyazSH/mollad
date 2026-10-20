import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { categoryList, walletList, transactionList } from '@/lib/queries';
import { TransactionManager } from '@/components/transaction-manager';
import { filterSchema } from '@/lib/validation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const parsed = filterSchema.safeParse(raw);
  if (!parsed.success)
    return (
      <div className="card p-8">
        <h1 className="text-xl font-bold">Filter tidak valid.</h1>
        <p className="my-4 text-muted">{parsed.error.issues[0].message}</p>
        <Link href="/transaksi" className="button">
          Reset filter
        </Link>
      </div>
    );
  const [wallets, categories, result] = await Promise.all([
    walletList(user.id),
    categoryList(user.id),
    transactionList(user.id, parsed.data),
  ]);
  return (
    <TransactionManager
      {...result}
      rows={result.rows.map((row) => ({
        ...row,
        date: row.date.toISOString(),
      }))}
      wallets={wallets}
      categories={categories}
      provider={
        process.env.OCR_PROVIDER === 'vision' && process.env.VISION_API_KEY
          ? 'vision'
          : 'tesseract'
      }
      initialScan={raw.catat === 'scan'}
      filters={Object.fromEntries(
        Object.entries(parsed.data).map(([k, v]) => [k, String(v)]),
      )}
    />
  );
}
