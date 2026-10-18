'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, mutate } from '@/lib/client';
import { today } from '@/lib/dates';
type Option = { id: string; name: string };
export type TransactionValue = {
  id?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount?: number;
  date?: string;
  walletId?: string;
  categoryId?: string | null;
  destinationWalletId?: string | null;
  merchant?: string;
  note?: string;
  receiptId?: string;
};
export function TransactionForm({
  wallets,
  categories,
  initial = {},
  done,
  lowConfidence = [],
}: {
  wallets: Option[];
  categories: Option[];
  initial?: TransactionValue;
  done?: () => void;
  lowConfidence?: string[];
}) {
  const router = useRouter();
  const [type, setType] = useState(initial.type || 'EXPENSE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutate(
        'finance/transactions',
        {
          ...Object.fromEntries(new FormData(e.currentTarget)),
          type,
          id: initial.id,
          receiptId: initial.receiptId,
          allowDuplicate,
        },
        initial.id ? 'PATCH' : 'POST',
      );
      if (done) {
        done();
        router.refresh();
      } else {
        window.location.assign('/transaksi');
      }
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.code === 'DUPLICATE') setDuplicate(true);
    } finally {
      setBusy(false);
    }
  }
  if (!wallets.length || !categories.length)
    return (
      <div className="empty">
        <p>Buat dompet dan kategori terlebih dahulu.</p>
        <Link
          className="button"
          href={!wallets.length ? '/dompet' : '/kategori'}
        >
          Siapkan data
        </Link>
      </div>
    );
  const hint = (field: string) =>
    lowConfidence.includes(field) ? (
      <span className="mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-300">
        Perlu diperiksa kembali
      </span>
    ) : null;
  return (
    <form
      method="post"
      onSubmit={submit}
      className="space-y-5"
      onChange={(e) => {
        if (e.target.getAttribute('name') !== 'duplicateConfirmation') {
          setAllowDuplicate(false);
          setDuplicate(false);
        }
      }}
    >
      <label>
        Jenis transaksi
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </label>
      <div className="field-grid">
        <label>
          Nominal (Rp)
          <input
            name="amount"
            type="number"
            min="1"
            max="2000000000"
            step="1"
            required
            defaultValue={initial.amount || ''}
            placeholder="0"
          />
          {hint('total')}
        </label>
        <label>
          Tanggal
          <input
            name="date"
            type="date"
            required
            defaultValue={initial.date?.slice(0, 10) || today()}
          />
          {hint('tanggal')}
        </label>
      </div>
      <div className="field-grid">
        <label>
          {type === 'TRANSFER' ? 'Dompet asal' : 'Dompet'}
          <select
            name="walletId"
            defaultValue={initial.walletId || wallets[0].id}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        {type === 'TRANSFER' ? (
          <label>
            Dompet tujuan
            <select
              name="destinationWalletId"
              required
              defaultValue={initial.destinationWalletId || ''}
            >
              <option value="">Pilih dompet tujuan</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Kategori
            <select
              name="categoryId"
              required
              defaultValue={initial.categoryId || ''}
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {type !== 'TRANSFER' && (
        <label>
          Merchant
          <input
            name="merchant"
            maxLength={120}
            defaultValue={initial.merchant}
            placeholder="Contoh: Kopi Kenangan"
          />
          {hint('merchant')}
        </label>
      )}
      <label>
        Catatan
        <textarea
          name="note"
          rows={2}
          maxLength={1000}
          defaultValue={initial.note}
          placeholder="Opsional, misalnya belanja mingguan"
        />
      </label>
      {type === 'TRANSFER' && (
        <p className="rounded-xl bg-canvas p-3 text-xs leading-5 text-muted">
          Transfer mengubah saldo kedua dompet dan tidak masuk laporan
          pemasukan/pengeluaran.
        </p>
      )}
      {initial.receiptId && (
        <p className="text-xs text-muted">
          Foto hanya untuk review. Setelah Simpan, data transaksi tersimpan
          tanpa gambar struk.
        </p>
      )}
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {duplicate && (
        <label className="flex items-start gap-3 rounded-xl border border-amber-300 p-4 text-xs leading-5">
          <input
            name="duplicateConfirmation"
            type="checkbox"
            className="mt-0.5 w-4"
            checked={allowDuplicate}
            onChange={(e) => setAllowDuplicate(e.target.checked)}
          />
          Saya sudah memeriksa. Ini transaksi berbeda dan tetap ingin
          menyimpannya.
        </label>
      )}
      <button className="button button-primary w-full" disabled={busy}>
        {busy ? 'Menyimpan…' : 'Simpan transaksi'}
      </button>
    </form>
  );
}
