import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ScanLine,
  Plus,
  Wallet,
  ArrowLeftRight,
} from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { walletList } from '@/lib/queries';
import { today, monthSchema, monthRange, formatDate } from '@/lib/dates';
import { summarize } from '@/lib/analytics';
import { budgetList } from '@/lib/budgets';
import { formatRupiah } from '@/lib/money';
import { FinanceCharts } from '@/components/charts';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const valid = monthSchema.safeParse(params.month || today().slice(0, 7));
  if (!valid.success) return <p className="error-box">Bulan tidak valid.</p>;
  const month = valid.data;
  const monthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(month + '-01T00:00:00Z'));
  const range = monthRange(month);
  const start = new Date(range.gte);
  start.setUTCMonth(start.getUTCMonth() - 5);
  const [wallets, rows, recent, budgets] = await Promise.all([
    walletList(user.id),
    db.transaction.findMany({
      where: { userId: user.id, date: { gte: start, lt: range.lt } },
      include: { category: true },
    }),
    db.transaction.findMany({
      where: { userId: user.id },
      include: { wallet: true, category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    }),
    budgetList(user.id, month),
  ]);
  const stats = summarize(rows, month);
  const balance = wallets.reduce((s, w) => s + w.balance, 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{monthLabel}</span>
          <h1 className="page-title">Ringkasan keuangan</h1>
          <p className="text-sm text-muted">
            Halo, {user.name.split(' ')[0]}. Lihat saldo dan arus uangmu di
            sini.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form action="/" className="flex items-end gap-2">
            <label className="text-xs" htmlFor="dashboard-month">
              Bulan laporan
              <input
                id="dashboard-month"
                type="month"
                name="month"
                defaultValue={month}
                className="w-40"
                required
              />
            </label>
            <button className="icon-button h-11" aria-label="Tampilkan bulan">
              <ArrowRight size={16} />
            </button>
          </form>
          <Link href="/transaksi" className="button">
            <Plus size={16} />
            Catat transaksi
          </Link>
        </div>
      </div>
      {!wallets.length && (
        <section
          className="card mb-7 border-emerald-300 p-6 dark:border-emerald-800"
          aria-labelledby="getting-started"
        >
          <span className="eyebrow">MULAI MENGGUNAKAN MOLLAD</span>
          <h2 id="getting-started" className="mt-2 text-lg font-bold">
            Tambahkan dompet pertamamu
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Buat dompet Tunai, Bank, atau E-wallet dan isi saldo awalnya.
            Setelah itu, catat transaksi secara manual atau dari foto struk.
          </p>
          <Link href="/dompet" className="button button-primary mt-4">
            <Plus size={16} />
            Tambah dompet
          </Link>
        </section>
      )}
      <div className="mb-7 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl bg-brand-mint p-7 text-ink sm:p-8">
          <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[35px] border-emerald-400/[.05]" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs text-muted">
                <Wallet size={16} />
                Total saldo saat ini
              </p>
              <span className="rounded-full border border-line px-3 py-1 text-[10px] text-muted">
                {wallets.length} dompet
              </span>
            </div>
            <p className="my-5 break-words text-3xl font-extrabold tracking-tight tabular-nums sm:text-[42px]">
              {formatRupiah(balance)}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5">
              {wallets.slice(0, 3).map((w) => (
                <div key={w.id}>
                  <p className="text-[10px] text-muted">{w.name}</p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {formatRupiah(w.balance)}
                  </p>
                </div>
              ))}
              <Link
                href="/dompet"
                className="ml-auto flex items-center gap-2 text-[10px] font-bold text-ink"
              >
                {wallets.length ? 'Lihat dompet' : 'Tambah dompet'}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>
        <Link
          href="/scan"
          className="group flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-7 dark:border-emerald-900 dark:bg-emerald-950/50"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-white p-3 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <ScanLine size={25} />
            </span>
            <ArrowUpRight
              className="text-emerald-700 dark:text-emerald-300"
              size={21}
            />
          </div>
          <div>
            <span className="mt-5 inline-block text-[9px] font-extrabold tracking-widest text-emerald-800 dark:text-emerald-300">
              CATAT DARI FOTO
            </span>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">
              Scan struk belanja
            </h2>
            <p className="mt-2 max-w-[270px] text-xs leading-5 text-emerald-800 dark:text-emerald-200">
              Unggah foto, periksa nominal dan tanggal, lalu simpan. Foto tidak
              disimpan oleh mollad.
            </p>
          </div>
        </Link>
      </div>
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Pemasukan',
            amount: stats.income,
            caption: monthLabel,
            Icon: ArrowDownLeft,
            color: 'bg-emerald-100 text-emerald-800',
          },
          {
            label: 'Pengeluaran',
            amount: stats.expense,
            caption: monthLabel,
            Icon: ArrowUpRight,
            color: 'bg-brand-blush text-ink',
          },
          {
            label: 'Selisih',
            amount: stats.remainder,
            caption: 'Pemasukan − pengeluaran · ' + monthLabel,
            Icon: Wallet,
            color: 'bg-brand-pink text-brand-onPrimary',
          },
        ].map((c) => (
          <section key={c.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted">{c.label}</p>
              <span className={'rounded-lg p-2 ' + c.color}>
                <c.Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight tabular-nums">
              {formatRupiah(c.amount)}
            </p>
            <p className="mt-2 text-[10px] text-muted">{c.caption}</p>
          </section>
        ))}
      </div>
      <FinanceCharts {...stats} />
      <div className="mt-7 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-sm font-extrabold">Catatan terbaru</h2>
            <Link
              href="/transaksi"
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
            >
              Lihat semua
              <ArrowRight size={13} />
            </Link>
          </div>
          {!recent.length && (
            <div className="empty">
              <p className="font-semibold text-ink">Belum ada transaksi</p>
              <p>
                Catat pemasukan atau pengeluaran untuk mulai melihat riwayatmu.
              </p>
              <Link
                className="button button-secondary"
                href={wallets.length ? '/transaksi' : '/dompet'}
              >
                {wallets.length ? 'Catat transaksi' : 'Tambah dompet'}
              </Link>
            </div>
          )}
          {recent.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 border-t border-line px-6 py-4"
            >
              <span className="rounded-xl bg-canvas p-2.5 text-muted">
                {r.type === 'TRANSFER' ? (
                  <ArrowLeftRight size={17} />
                ) : r.type === 'INCOME' ? (
                  <ArrowDownLeft size={17} />
                ) : (
                  <ArrowUpRight size={17} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">
                  {r.merchant ||
                    (r.type === 'TRANSFER'
                      ? 'Transfer antar dompet'
                      : r.category?.name || 'Transaksi')}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {formatDate(r.date)} · {r.wallet.name}
                </p>
              </div>
              <p
                className={
                  'text-xs font-bold tabular-nums ' +
                  (r.type === 'INCOME'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : '')
                }
              >
                {r.type === 'EXPENSE' ? '−' : r.type === 'INCOME' ? '+' : ''}
                {formatRupiah(r.amount)}
              </p>
            </div>
          ))}
        </section>
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Anggaran kategori</h2>
            <Link
              href={'/anggaran?month=' + month}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
            >
              Atur anggaran →
            </Link>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Pengeluaran dibandingkan batas anggaran · {monthLabel}
          </p>
          {!budgets.length && (
            <div className="empty">
              <p>Belum ada anggaran bulan ini.</p>
              <Link className="button button-secondary" href="/anggaran">
                Buat anggaran
              </Link>
            </div>
          )}
          {budgets.slice(0, 4).map((b) => (
            <div key={b.id} className="mt-6">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">{b.category.name}</span>
                <span
                  className={
                    b.status === 'over'
                      ? 'text-red-600 dark:text-red-300'
                      : 'text-muted'
                  }
                >
                  {b.amount === 0 ? 'Belum ada alokasi' : b.percent + '%'}
                </span>
              </div>
              <div className="my-2 h-1.5 rounded-full bg-canvas">
                <div
                  className={
                    'h-full rounded-full ' +
                    (b.status === 'over'
                      ? 'bg-red-500'
                      : b.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500')
                  }
                  style={{ width: Math.min(100, b.percent) + '%' }}
                />
              </div>
              <p className="text-[10px] text-muted">
                {formatRupiah(b.spent)}{' '}
                <span className="float-right">
                  dari {formatRupiah(b.amount)}
                </span>
              </p>
              {b.incomePercent != null && (
                <p className="mt-2 text-xs text-muted">
                  {b.incomePercent}% dari penghasilan bulan laporan
                </p>
              )}
              {b.status !== 'safe' && (
                <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
                  {b.status === 'over'
                    ? 'Melebihi anggaran sebesar ' +
                      formatRupiah(b.spent - b.amount)
                    : 'Mendekati batas anggaran'}
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
      <footer className="mt-8 flex justify-between text-[10px] text-muted">
        <span>mollad · Atur uang, tanpa ribet.</span>
        <span>Semua nominal dalam Rupiah</span>
      </footer>
    </>
  );
}
