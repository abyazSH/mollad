'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Shapes } from 'lucide-react';
import { Modal } from './modal';
import { mutate } from '@/lib/client';
type Item = { id: string; name: string; color: string };
export function CategoryManager({ categories }: { categories: Item[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await mutate(
        'finance/categories',
        { ...Object.fromEntries(new FormData(e.currentTarget)), id: edit?.id },
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
      await mutate('finance/categories', { id: removing?.id }, 'DELETE');
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
          <span className="eyebrow">RAPIKAN SETIAP CATATAN</span>
          <h1 className="page-title">Kategori.</h1>
          <p className="text-sm text-muted">
            Kelompok kecil untuk gambaran yang lebih jelas.
          </p>
        </div>
        <button
          className="button"
          onClick={() => {
            setError('');
            setEdit({ color: '#46B4A0' });
          }}
        >
          <Plus size={16} />
          Tambah kategori
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <article className="card flex items-center gap-4 p-5" key={c.id}>
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: c.color }}
            />
            <h2 className="flex-1 text-sm font-bold">{c.name}</h2>
            <button
              className="icon-button"
              aria-label={'Ubah ' + c.name}
              onClick={() => {
                setError('');
                setEdit(c);
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              className="icon-button"
              aria-label={'Hapus ' + c.name}
              onClick={() => {
                setError('');
                setRemoving(c);
              }}
            >
              <Trash2 size={14} />
            </button>
          </article>
        ))}
      </div>
      {!categories.length && (
        <div className="card empty">
          <Shapes />
          <p>Tambahkan kategori untuk mulai mencatat transaksi.</p>
        </div>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Ubah kategori' : 'Tambah kategori'}
          close={() => setEdit(null)}
        >
          <form method="post" onSubmit={submit} className="space-y-5">
            <label>
              Nama kategori
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={edit.name}
              />
            </label>
            <label>
              Warna
              <input
                name="color"
                type="color"
                className="h-12"
                defaultValue={edit.color}
              />
            </label>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button className="button w-full" disabled={busy}>
              Simpan kategori
            </button>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Hapus kategori?" close={() => setRemoving(null)}>
          <p className="mb-5 text-sm text-muted">
            Hapus {removing.name}? Kategori yang digunakan transaksi perlu
            diganti dahulu. Anggaran kategori ini juga akan dihapus.
          </p>
          {error && (
            <p className="error-box mb-4" role="alert">
              {error}
            </p>
          )}
          <button className="button" onClick={remove} disabled={busy}>
            Hapus kategori
          </button>
        </Modal>
      )}
    </>
  );
}
