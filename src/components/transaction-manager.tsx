'use client';
import { useEffect, useState } from 'react';
import { Text } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ScanLine,
  Paperclip,
} from 'lucide-react';
import { Modal } from './modal';
import { TransactionForm, type TransactionValue } from './transaction-form';
import { formatRupiah } from '@/lib/money';
import { formatDate } from '@/lib/dates';
import { typeLabels } from '@/lib/finance';
import { mutate } from '@/lib/client';
import { categoryColorStyle } from '@/lib/category-colors';
import { ScanClient } from './scan-client';
type Option = { id: string; name: string };
export type TransactionRow = TransactionValue & {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  date: string;
  wallet: Option;
  destinationWallet: Option | null;
  category: (Option & { color: string }) | null;
  receipt: { id: string } | null;
};
export function TransactionManager({
  rows,
  wallets,
  categories,
  count,
  page,
  pages,
  filters,
  provider,
  initialScan = false,
}: {
  rows: TransactionRow[];
  wallets: Option[];
  categories: Option[];
  count: number;
  page: number;
  pages: number;
  filters: Record<string, string>;
  provider: string;
  initialScan?: boolean;
}) {
  const router = useRouter();
  const [edit, setEdit] = useState<TransactionValue | null>(
    initialScan ? {} : null,
  );
  const [scan, setScan] = useState(initialScan);
  function closeEntry() {
    setEdit(null);
    setScan(false);
    if (initialScan) router.replace('/transaksi', { scroll: false });
  }
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'page' && Boolean(value),
  );
  const [filtersExpanded, setFiltersExpanded] = useState(hasFilters);
  useEffect(() => {
    setFiltersExpanded(
      hasFilters || window.matchMedia('(min-width: 640px)').matches,
    );
  }, [hasFilters]);
  const pageUrl = (p: number) =>
    '/transaksi?' + new URLSearchParams({ ...filters, page: String(p) });
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await mutate('finance/transactions', { id: removing }, 'DELETE');
      setRemoving(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Text>{'RIWAYAT KEUANGAN'}</Text>
          </span>
          <h1 className="page-title">
            <Text>{'Transaksi'}</Text>
          </h1>
          <p className="text-sm text-muted">
            <Text>
              {
                'Cari, periksa, dan kelola pemasukan, pengeluaran, serta transfer.'
              }
            </Text>
          </p>
        </div>
        <div className="transaction-actions flex w-full flex-wrap gap-2 sm:w-auto">
          <button className="button" onClick={() => setEdit({})}>
            <Plus size={16} />
            <Text>{'Catat transaksi'}</Text>
          </button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <form className="border-b border-line p-5" action="/transaksi">
          <label>
            <span>
              <Text>{'Cari transaksi'}</Text>
            </span>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-[22px] text-muted"
              />
              <input
                className="pl-10"
                name="q"
                defaultValue={filters.q}
                placeholder="Cari merchant atau catatan…"
              />
            </div>
          </label>
          <details
            open={filtersExpanded}
            onToggle={(event) => setFiltersExpanded(event.currentTarget.open)}
            className="mt-4"
          >
            <summary className="min-h-11 cursor-pointer rounded-lg bg-canvas px-3 py-3 text-xs font-bold">
              <Text>{'Filter tambahan'}</Text>
              <Text>{hasFilters ? ' · Ada filter aktif' : ''}</Text>
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label>
                <span>
                  <Text>{'Filter tipe'}</Text>
                </span>
                <select name="type" defaultValue={filters.type}>
                  <option value="">
                    <Text>{'Semua tipe'}</Text>
                  </option>
                  {Object.entries(typeLabels).map(([v, l]) => (
                    <option value={v} key={v}>
                      <Text>{l}</Text>
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  <Text>{'Filter kategori'}</Text>
                </span>
                <select name="categoryId" defaultValue={filters.categoryId}>
                  <option value="">
                    <Text>{'Semua kategori'}</Text>
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  <Text>{'Filter dompet'}</Text>
                </span>
                <select name="walletId" defaultValue={filters.walletId}>
                  <option value="">
                    <Text>{'Semua dompet'}</Text>
                  </option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label>
                <Text>{'Dari tanggal'}</Text>
                <input name="from" type="date" defaultValue={filters.from} />
              </label>
              <label>
                <Text>{'Sampai tanggal'}</Text>
                <input name="to" type="date" defaultValue={filters.to} />
              </label>
            </div>
          </details>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="button" type="submit">
              <Text>{'Terapkan filter'}</Text>
            </button>
            {hasFilters && (
              <Link
                href="/transaksi"
                className="px-3 py-3 text-xs font-bold text-muted"
              >
                <Text>{'Reset'}</Text>
              </Link>
            )}
            <span className="ml-auto py-3 text-xs text-muted">
              {count}
              <Text>{'transaksi'}</Text>
            </span>
          </div>
        </form>
        <div
          className="divide-y divide-line sm:hidden"
          aria-label="Daftar transaksi"
        >
          {rows.map((row) => (
            <article key={row.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">
                    {formatDate(row.date)} · <Text>{typeLabels[row.type]}</Text>
                  </p>
                  <h2 className="mt-1 break-words text-sm font-bold">
                    {row.merchant ||
                      (row.type === 'TRANSFER'
                        ? 'Transfer antar dompet'
                        : row.note || typeLabels[row.type])}
                  </h2>
                </div>
                <p
                  className={
                    'shrink-0 text-sm font-extrabold tabular-nums ' +
                    (row.type === 'INCOME'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : '')
                  }
                >
                  <Text>
                    {row.type === 'INCOME'
                      ? '+'
                      : row.type === 'EXPENSE'
                        ? '−'
                        : ''}
                  </Text>
                  {formatRupiah(row.amount)}
                </p>
              </div>
              <p className="mt-2 break-words text-xs text-muted">
                {row.category?.name || 'Transfer'} · {row.wallet.name}
                {row.destinationWallet
                  ? ' → ' + row.destinationWallet.name
                  : ''}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                {row.receipt && (
                  <a
                    className="icon-button"
                    aria-label="Lihat struk"
                    href={'/api/receipts/' + row.receipt.id}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Paperclip size={16} />
                  </a>
                )}
                <button
                  className="button button-secondary px-3 text-xs"
                  aria-label={
                    'Ubah transaksi ' + (row.merchant || typeLabels[row.type])
                  }
                  onClick={() => setEdit(row)}
                >
                  <Pencil size={15} />
                  <Text>{'Ubah'}</Text>
                </button>
                <button
                  className="icon-button"
                  aria-label={
                    'Hapus transaksi ' + (row.merchant || typeLabels[row.type])
                  }
                  onClick={() => {
                    setError('');
                    setRemoving(row.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[690px] text-left text-sm">
            <thead className="bg-canvas text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-6 py-4">
                  <Text>{'Transaksi'}</Text>
                </th>
                <th className="p-4">
                  <Text>{'Kategori'}</Text>
                </th>
                <th className="p-4">
                  <Text>{'Dompet'}</Text>
                </th>
                <th className="p-4 text-right">
                  <Text>{'Nominal'}</Text>
                </th>
                <th className="p-4">
                  <span className="sr-only">
                    <Text>{'Aksi'}</Text>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const Icon =
                  row.type === 'INCOME'
                    ? ArrowDownLeft
                    : row.type === 'TRANSFER'
                      ? ArrowLeftRight
                      : ArrowUpRight;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-line hover:bg-canvas/60"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            'rounded-xl p-2.5 ' +
                            (row.type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.type === 'TRANSFER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-canvas text-muted')
                          }
                        >
                          <Icon size={17} />
                        </span>
                        <div>
                          <p className="max-w-[220px] truncate text-xs font-bold">
                            {row.merchant ||
                              (row.type === 'TRANSFER'
                                ? 'Transfer antar dompet'
                                : row.note || typeLabels[row.type])}
                          </p>
                          <p className="mt-1 text-[10px] text-muted">
                            {formatDate(row.date)}
                            {row.note && (
                              <span title={row.note}>
                                {' '}
                                · {row.note.slice(0, 30)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1">
                        <span
                          className="category-color h-1.5 w-1.5 rounded-full"
                          style={categoryColorStyle(
                            row.category?.color || '#64748B',
                          )}
                        />
                        {row.category?.name || 'Transfer'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted">
                      {row.wallet.name}
                      {row.destinationWallet && (
                        <> → {row.destinationWallet.name}</>
                      )}
                    </td>
                    <td
                      className={
                        'whitespace-nowrap p-4 text-right text-xs font-extrabold tabular-nums ' +
                        (row.type === 'INCOME'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : '')
                      }
                    >
                      <Text>
                        {row.type === 'INCOME'
                          ? '+'
                          : row.type === 'EXPENSE'
                            ? '−'
                            : ''}
                      </Text>
                      {formatRupiah(row.amount)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {row.receipt && (
                          <a
                            className="icon-button"
                            aria-label="Lihat struk"
                            href={'/api/receipts/' + row.receipt.id}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Paperclip size={14} />
                          </a>
                        )}
                        <button
                          className="icon-button"
                          aria-label={
                            'Ubah transaksi ' +
                            (row.merchant || typeLabels[row.type])
                          }
                          onClick={() => setEdit(row)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={
                            'Hapus transaksi ' +
                            (row.merchant || typeLabels[row.type])
                          }
                          onClick={() => {
                            setError('');
                            setRemoving(row.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="empty">
            <ReceiptText size={30} />
            <h2 className="font-bold text-ink">
              <Text>
                {hasFilters
                  ? 'Tidak ada transaksi yang cocok'
                  : 'Belum ada transaksi'}
              </Text>
            </h2>
            <p>
              <Text>
                {hasFilters
                  ? 'Coba rentang tanggal lain atau hapus filter pencarian.'
                  : 'Tambahkan pemasukan atau pengeluaran pertamamu.'}
              </Text>
            </p>
            {hasFilters ? (
              <Link className="button button-secondary" href="/transaksi">
                <Text>{'Hapus semua filter'}</Text>
              </Link>
            ) : (
              <button className="button" onClick={() => setEdit({})}>
                <Text>{'Catat transaksi'}</Text>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-line p-5 text-xs text-muted">
          <span>
            <Text>{'Halaman'}</Text>
            {page}
            <Text>{'dari'}</Text>
            {pages}
          </span>
          <div className="flex gap-3">
            {page > 1 && (
              <Link
                className="button button-secondary"
                href={pageUrl(page - 1)}
              >
                <Text>{'Sebelumnya'}</Text>
              </Link>
            )}
            {page < pages && (
              <Link
                className="button button-secondary"
                href={pageUrl(page + 1)}
              >
                <Text>{'Berikutnya'}</Text>
              </Link>
            )}
          </div>
        </div>
      </div>
      {edit && (
        <Modal
          title={edit.id ? 'Ubah transaksi' : 'Catat transaksi'}
          close={closeEntry}
          wide={scan}
        >
          {!edit.id && (
            <div
              className="mb-6 grid grid-cols-2 gap-2"
              role="group"
              aria-label="Cara mencatat transaksi"
            >
              <button
                type="button"
                className={scan ? 'icon-button w-full gap-2 px-3' : 'button'}
                aria-pressed={!scan}
                onClick={() => setScan(false)}
              >
                <Pencil size={16} />
                <Text>{'Manual'}</Text>
              </button>
              <button
                type="button"
                className={scan ? 'button' : 'icon-button w-full gap-2 px-3'}
                aria-pressed={scan}
                onClick={() => setScan(true)}
              >
                <ScanLine size={16} />
                <Text>{'Scan struk'}</Text>
              </button>
            </div>
          )}
          {scan && !edit.id ? (
            <ScanClient
              wallets={wallets}
              categories={categories}
              provider={provider}
              manual={() => setScan(false)}
              done={() => {
                closeEntry();
                router.refresh();
              }}
            />
          ) : (
            <TransactionForm
              wallets={wallets}
              categories={categories}
              initial={edit}
              done={closeEntry}
            />
          )}
        </Modal>
      )}
      {removing && (
        <Modal title="Hapus transaksi?" close={() => setRemoving(null)}>
          <p className="mb-5 text-sm text-muted">
            <Text>
              {'Saldo dompet akan dihitung kembali setelah transaksi dihapus.'}
            </Text>
          </p>
          {error && (
            <p role="alert" className="error-box mb-4">
              {error}
            </p>
          )}
          <button className="button" disabled={busy} onClick={remove}>
            <Text>{'Hapus transaksi'}</Text>
          </button>
        </Modal>
      )}
    </>
  );
}
