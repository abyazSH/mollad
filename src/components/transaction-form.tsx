'use client';
import { useState } from 'react';
import { Text } from '@/components/language-provider';
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
        <p>
          <Text>{'Buat dompet dan kategori terlebih dahulu.'}</Text>
        </p>
        <Link
          className="button"
          href={!wallets.length ? '/dompet' : '/dompet#kategori'}
        >
          <Text>{'Siapkan data'}</Text>
        </Link>
      </div>
    );
  const hint = (field: string) =>
    lowConfidence.includes(field) ? (
      <span className="mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-300">
        <Text>{'Perlu diperiksa kembali'}</Text>
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
        <Text>{'Jenis transaksi'}</Text>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="EXPENSE">
            <Text>{'Pengeluaran'}</Text>
          </option>
          <option value="INCOME">
            <Text>{'Pemasukan'}</Text>
          </option>
          <option value="TRANSFER">
            <Text>{'Transfer'}</Text>
          </option>
        </select>
      </label>
      <div className="field-grid">
        <label>
          <Text>{'Nominal (Rp)'}</Text>
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
          <Text>{'Tanggal'}</Text>
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
          <Text>{type === 'TRANSFER' ? 'Dompet asal' : 'Dompet'}</Text>
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
            <Text>{'Dompet tujuan'}</Text>
            <select
              name="destinationWalletId"
              required
              defaultValue={initial.destinationWalletId || ''}
            >
              <option value="">
                <Text>{'Pilih dompet tujuan'}</Text>
              </option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            <Text>{'Kategori'}</Text>
            <select
              name="categoryId"
              required
              defaultValue={initial.categoryId || ''}
            >
              <option value="">
                <Text>{'Pilih kategori'}</Text>
              </option>
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
          <Text>{'Merchant'}</Text>
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
        <Text>{'Catatan'}</Text>
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
          <Text>
            {
              'Transfer mengubah saldo kedua dompet dan tidak masuk laporan pemasukan/pengeluaran.'
            }
          </Text>
        </p>
      )}
      {initial.receiptId && (
        <p className="text-xs text-muted">
          <Text>
            {
              'Foto hanya untuk review. Setelah Simpan, data transaksi tersimpan tanpa gambar struk.'
            }
          </Text>
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
          <Text>
            {
              'Saya sudah memeriksa. Ini transaksi berbeda dan tetap ingin menyimpannya.'
            }
          </Text>
        </label>
      )}
      <button className="button button-primary w-full" disabled={busy}>
        <Text>{busy ? 'Menyimpan…' : 'Simpan transaksi'}</Text>
      </button>
    </form>
  );
}
