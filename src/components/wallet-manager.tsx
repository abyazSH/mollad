'use client';
import { useState } from 'react';
import { Text } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Wallet,
  Landmark,
  Smartphone,
  Pencil,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { Modal } from './modal';
import { formatRupiah } from '@/lib/money';
import { walletLabels } from '@/lib/finance';
import { mutate } from '@/lib/client';
type Item = {
  id: string;
  name: string;
  kind: 'CASH' | 'BANK' | 'EWALLET';
  initialBalance: number;
  balance: number;
};
export function WalletManager({ wallets }: { wallets: Item[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutate(
        'finance/wallets',
        {
          ...Object.fromEntries(new FormData(event.currentTarget)),
          id: edit?.id,
        },
        edit?.id ? 'PATCH' : 'POST',
      );
      setEdit(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await mutate('finance/wallets', { id: removing?.id }, 'DELETE');
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
            <Text>{'SATU TEMPAT, SEMUA AKUN'}</Text>
          </span>
          <h1 className="page-title">
            <Text>{'Dompetmu.'}</Text>
          </h1>
          <p className="text-sm text-muted">
            <Text>{'Kenali saldo di setiap sudut keuanganmu.'}</Text>
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setError('');
            setEdit({ kind: 'CASH', initialBalance: 0 });
          }}
        >
          <Plus size={16} />
          <Text>{'Tambah dompet'}</Text>
        </button>
      </div>
      <div className="balance-hero mb-7 rounded-2xl p-7">
        <p className="text-xs text-muted">
          <Text>{'Total saldo semua dompet'}</Text>
        </p>
        <p className="mt-3 text-3xl font-extrabold tabular-nums">
          {formatRupiah(wallets.reduce((sum, w) => sum + w.balance, 0))}
        </p>
        <p className="mt-4 flex items-center gap-2 text-xs text-ink">
          <ArrowUpRight size={14} />
          {wallets.length}
          <Text>{'dompet terhubung dengan catatanmu'}</Text>
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w) => {
          const Icon =
            w.kind === 'BANK'
              ? Landmark
              : w.kind === 'EWALLET'
                ? Smartphone
                : Wallet;
          return (
            <article key={w.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                  <Icon size={21} />
                </div>
                <span className="rounded-full bg-canvas px-3 py-1 text-[10px] font-bold text-muted">
                  <Text>{walletLabels[w.kind]}</Text>
                </span>
              </div>
              <h2 className="mt-5 text-base font-bold">{w.name}</h2>
              <p className="mt-2 text-2xl font-extrabold tabular-nums">
                {formatRupiah(w.balance)}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="text-xs text-muted">
                  <Text>{'Awal'}</Text>
                  {formatRupiah(w.initialBalance)}
                </span>
                <div className="flex gap-2">
                  <button
                    aria-label={'Ubah ' + w.name}
                    className="icon-button"
                    onClick={() => {
                      setError('');
                      setEdit(w);
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label={'Hapus ' + w.name}
                    className="icon-button"
                    onClick={() => {
                      setError('');
                      setRemoving(w);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!wallets.length && (
        <div className="card empty">
          <Wallet size={32} />
          <h2 className="font-bold text-ink">
            <Text>{'Uangmu tinggal di mana?'}</Text>
          </h2>
          <p>
            <Text>{'Tambahkan dompet pertama, misalnya Tunai atau Bank.'}</Text>
          </p>
        </div>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Ubah dompet' : 'Tambah dompet'}
          close={() => setEdit(null)}
        >
          <form method="post" onSubmit={submit} className="space-y-5">
            <label>
              <Text>{'Nama dompet'}</Text>
              <input
                name="name"
                required
                maxLength={60}
                defaultValue={edit.name}
                placeholder="Contoh: Bank utama"
              />
            </label>
            <label>
              <Text>{'Jenis'}</Text>
              <select name="kind" defaultValue={edit.kind}>
                <option value="CASH">
                  <Text>{'Tunai'}</Text>
                </option>
                <option value="BANK">
                  <Text>{'Bank'}</Text>
                </option>
                <option value="EWALLET">
                  <Text>{'E-wallet'}</Text>
                </option>
              </select>
            </label>
            <label>
              <Text>{'Saldo awal (Rp)'}</Text>
              <input
                name="initialBalance"
                type="number"
                step="1"
                min="-2000000000"
                max="2000000000"
                required
                defaultValue={edit.initialBalance}
              />
            </label>
            <p className="text-xs leading-5 text-muted">
              <Text>
                {
                  'Saldo saat ini dihitung dari saldo awal ditambah pemasukan, dikurangi pengeluaran, dan perpindahan dana.'
                }
              </Text>
            </p>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <button className="button w-full" disabled={busy}>
              <Text>{busy ? 'Menyimpan…' : 'Simpan dompet'}</Text>
            </button>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Hapus dompet?" close={() => setRemoving(null)}>
          <p className="mb-5 text-sm text-muted">
            {removing.name}
            <Text>
              {
                'akan dihapus. Dompet yang masih memiliki transaksi tidak dapat dihapus.'
              }
            </Text>
          </p>
          {error && (
            <p role="alert" className="error-box mb-4">
              {error}
            </p>
          )}
          <button className="button" onClick={remove} disabled={busy}>
            <Text>{'Hapus dompet'}</Text>
          </button>
        </Modal>
      )}
    </>
  );
}
