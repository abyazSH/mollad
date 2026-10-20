'use client';
import { useState } from 'react';
import { Text } from '@/components/language-provider';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Shapes } from 'lucide-react';
import { Modal } from './modal';
import { mutate } from '@/lib/client';
import { categoryColorStyle, categoryPalette } from '@/lib/category-colors';
type Item = { id: string; name: string; color: string };
export function CategoryManager({ categories }: { categories: Item[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Partial<Item> | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const preview = categoryPalette(edit?.color || '#46B4A0');
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
          <span className="eyebrow">
            <Text>{'RAPIKAN SETIAP CATATAN'}</Text>
          </span>
          <h2 className="page-title">
            <Text>{'Kategori.'}</Text>
          </h2>
          <p className="text-sm text-muted">
            <Text>{'Kelompok kecil untuk gambaran yang lebih jelas.'}</Text>
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
          <Text>{'Tambah kategori'}</Text>
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <article className="card flex items-center gap-4 p-5" key={c.id}>
            <span
              className="category-color h-3 w-3 rounded-full"
              style={categoryColorStyle(c.color)}
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
          <p>
            <Text>{'Tambahkan kategori untuk mulai mencatat transaksi.'}</Text>
          </p>
        </div>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Ubah kategori' : 'Tambah kategori'}
          close={() => setEdit(null)}
        >
          <form method="post" onSubmit={submit} className="space-y-5">
            <label>
              <Text>{'Nama kategori'}</Text>
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={edit.name}
              />
            </label>
            <label>
              <Text>{'Warna dasar'}</Text>
              <input
                name="color"
                type="color"
                className="h-12"
                value={edit.color || '#46B4A0'}
                onChange={(event) =>
                  setEdit({ ...edit, color: event.target.value })
                }
              />
            </label>
            <div>
              <p className="mb-2 text-xs font-semibold">
                <Text>{'Pratinjau warna kategori'}</Text>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-xs text-[#385A55]">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preview.light }}
                  />
                  <Text>{'Mode terang'}</Text>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-[#151316] p-3 text-xs text-[#FFF5FA]">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: preview.dark }}
                  />
                  <Text>{'Mode gelap'}</Text>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted">
                <Text>
                  {
                    'Pilih satu warna dasar. mollad menyesuaikan kecerahan secara otomatis agar penanda kategori tetap terlihat pada kedua mode.'
                  }
                </Text>
              </p>
            </div>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button className="button w-full" disabled={busy}>
              <Text>{'Simpan kategori'}</Text>
            </button>
          </form>
        </Modal>
      )}
      {removing && (
        <Modal title="Hapus kategori?" close={() => setRemoving(null)}>
          <p className="mb-5 text-sm text-muted">
            <Text>{'Hapus'}</Text>
            {removing.name}
            <Text>
              {
                '? Kategori yang digunakan transaksi perlu diganti dahulu. Anggaran kategori ini juga akan dihapus.'
              }
            </Text>
          </p>
          {error && (
            <p className="error-box mb-4" role="alert">
              {error}
            </p>
          )}
          <button className="button" onClick={remove} disabled={busy}>
            <Text>{'Hapus kategori'}</Text>
          </button>
        </Modal>
      )}
    </>
  );
}
