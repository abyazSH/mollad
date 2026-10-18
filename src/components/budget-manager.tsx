'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Target, TriangleAlert } from 'lucide-react';
import { Modal } from './modal';
import { mutate } from '@/lib/client';
import { formatRupiah } from '@/lib/money';
import { percentageBudget } from '@/lib/budget-calculation';
type Budget = {
  id: string;
  categoryId: string;
  amount: number;
  incomePercent: number | null;
  spent: number;
  percent: number;
  status: 'safe' | 'warning' | 'over';
  category: { name: string; color: string };
};
export function BudgetManager({
  budgets,
  categories,
  month,
  income,
}: {
  budgets: Budget[];
  categories: { id: string; name: string }[];
  month: string;
  income: number;
}) {
  const [edit, setEdit] = useState<Partial<Budget> | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'fixed' | 'percentage'>('fixed');
  const [incomePercent, setIncomePercent] = useState('30');
  const total = budgets.reduce((sum, b) => sum + b.amount, 0);
  const allocationPercent = budgets.reduce(
    (sum, b) => sum + (b.incomePercent || 0),
    0,
  );
  const validPercent =
    Number.isInteger(Number(incomePercent)) &&
    Number(incomePercent) >= 1 &&
    Number(incomePercent) <= 100;
  const preview = validPercent
    ? percentageBudget(income, Number(incomePercent))
    : 0;
  function openBudget(budget: Partial<Budget>) {
    setError('');
    setMode(budget.incomePercent != null ? 'percentage' : 'fixed');
    setIncomePercent(String(budget.incomePercent || 30));
    setEdit(budget);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await mutate(
        'budgets',
        {
          ...Object.fromEntries(new FormData(e.currentTarget)),
          month,
          id: edit?.id,
          mode,
        },
        edit?.id ? 'PATCH' : 'POST',
      );
      setEdit(null);
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setError('');
    setBusy(true);
    try {
      await mutate('budgets', { id: removeId }, 'DELETE');
      setRemoveId(null);
      window.location.reload();
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
          <span className="eyebrow">RENCANA BULANAN</span>
          <h1 className="page-title">Anggaran</h1>
          <p className="text-sm text-muted">
            Tentukan batas pengeluaran dalam Rupiah atau persentase penghasilan.
          </p>
        </div>
        <button className="button" onClick={() => openBudget({})}>
          <Plus size={16} />
          Buat anggaran
        </button>
      </div>
      <form action="/anggaran" className="mb-6 flex flex-wrap items-end gap-3">
        <label>
          Bulan
          <input type="month" name="month" defaultValue={month} required />
        </label>
        <button className="button button-secondary">Tampilkan</button>
      </form>
      <div className="mb-7 flex flex-wrap gap-8 rounded-2xl bg-brand-mint p-6 text-ink">
        <div>
          <p className="text-xs text-muted">Penghasilan bulan terpilih</p>
          <p className="mt-2 text-2xl font-extrabold">{formatRupiah(income)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Total rencana</p>
          <p className="mt-2 text-2xl font-extrabold">{formatRupiah(total)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">
            Terpakai pada kategori beranggaran
          </p>
          <p className="mt-2 text-2xl font-extrabold text-ink">
            {formatRupiah(budgets.reduce((s, b) => s + b.spent, 0))}
          </p>
        </div>
      </div>
      <p className="mb-5 text-sm text-muted">
        Dasar persentase adalah seluruh pemasukan pada bulan {month}, tanpa
        saldo awal atau transfer. Nominal anggaran persentase otomatis mengikuti
        perubahan pemasukan.
      </p>
      {(allocationPercent > 100 || (income > 0 && total > income)) && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Total rencana melebihi penghasilan bulan ini
          {allocationPercent > 100
            ? `; alokasi persentase berjumlah ${allocationPercent}%`
            : ''}
          . Periksa kembali pembagian anggaranmu.
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((b) => (
          <article key={b.id} className="card p-6">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: b.category.color }}
              />
              <h2 className="flex-1 text-sm font-bold">{b.category.name}</h2>
              <button
                className="icon-button"
                aria-label={'Ubah anggaran ' + b.category.name}
                onClick={() => openBudget(b)}
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-button"
                aria-label={'Hapus anggaran ' + b.category.name}
                onClick={() => {
                  setError('');
                  setRemoveId(b.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <p className="mt-6 text-2xl font-extrabold tabular-nums">
              {formatRupiah(b.spent)}
            </p>
            <p className="mt-1 text-xs text-muted">
              dari {formatRupiah(b.amount)}
            </p>
            {b.incomePercent != null && (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {b.incomePercent}% dari penghasilan · Otomatis
              </p>
            )}
            {b.incomePercent != null && income === 0 && (
              <p className="mt-2 text-xs text-muted">
                Belum ada pemasukan. Alokasi akan dihitung setelah pemasukan
                dicatat.
              </p>
            )}
            <div
              className="my-5 h-2 overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-label={'Anggaran ' + b.category.name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(b.percent, 100)}
              aria-valuetext={
                b.amount === 0
                  ? 'Belum ada alokasi dari penghasilan'
                  : b.percent + '% terpakai'
              }
            >
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
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">
                {b.amount === 0
                  ? 'Belum ada alokasi'
                  : b.percent + '% terpakai'}
              </span>
              <span className="font-bold">
                {b.status === 'over'
                  ? 'Lebih ' + formatRupiah(b.spent - b.amount)
                  : 'Sisa ' + formatRupiah(b.amount - b.spent)}
              </span>
            </div>
            {b.status !== 'safe' && (
              <p
                className={
                  'mt-4 flex items-start gap-2 rounded-lg p-3 text-xs ' +
                  (b.status === 'over'
                    ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200')
                }
              >
                <TriangleAlert size={15} className="shrink-0" />
                {b.status === 'over'
                  ? 'Sudah melewati anggaran. Saatnya atur ulang rencana.'
                  : 'Lebih dari 80% terpakai. Perhatikan pengeluaran berikutnya.'}
              </p>
            )}
          </article>
        ))}
      </div>
      {!budgets.length && (
        <div className="card empty">
          <Target size={32} />
          <h2 className="font-bold text-ink">
            Mulai dengan satu rencana kecil.
          </h2>
          <p>Atur batas pengeluaran kategori untuk bulan ini.</p>
        </div>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Ubah anggaran' : 'Buat anggaran'}
          close={() => setEdit(null)}
        >
          <form method="post" onSubmit={submit} className="space-y-5">
            <label>
              Kategori
              <select
                name="categoryId"
                required
                defaultValue={edit.categoryId || ''}
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cara menentukan anggaran
              <select
                value={mode}
                onChange={(event) => setMode(event.target.value as typeof mode)}
              >
                <option value="fixed">Nominal tetap (Rp)</option>
                <option value="percentage">Persentase penghasilan (%)</option>
              </select>
            </label>
            {mode === 'fixed' ? (
              <label>
                Anggaran (Rp)
                <input
                  name="amount"
                  type="number"
                  required
                  step="1"
                  min="1"
                  max="2000000000"
                  defaultValue={edit.amount}
                />
              </label>
            ) : (
              <>
                <label>
                  Persentase penghasilan (%)
                  <input
                    name="incomePercent"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="100"
                    step="1"
                    required
                    value={incomePercent}
                    onChange={(event) => setIncomePercent(event.target.value)}
                  />
                </label>
                <div
                  className="rounded-xl bg-canvas p-4"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xs text-muted">
                    {validPercent
                      ? `${incomePercent}% × ${formatRupiah(income)}`
                      : 'Masukkan persentase bulat 1–100%.'}
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatRupiah(preview)}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {income === 0
                      ? 'Belum ada pemasukan bulan ini. Persentase tetap dapat disimpan; nominal akan terisi setelah pemasukan dicatat.'
                      : 'Dibulatkan ke Rupiah terdekat dan dihitung ulang saat pemasukan berubah.'}
                  </p>
                </div>
              </>
            )}
            <p className="text-xs text-muted">
              Bulan {month}. Menyimpan kategori yang sama akan memperbarui
              anggaran bulan tersebut.
            </p>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <button
              className="button w-full"
              disabled={busy || (mode === 'percentage' && !validPercent)}
            >
              Simpan anggaran
            </button>
          </form>
        </Modal>
      )}
      {removeId && (
        <Modal title="Hapus anggaran?" close={() => setRemoveId(null)}>
          <p className="mb-5 text-sm text-muted">
            Rencana anggaran ini akan dihapus. Catatan transaksi tetap
            tersimpan.
          </p>
          {error && (
            <p className="error-box mb-4" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy} onClick={remove}>
            Hapus anggaran
          </button>
        </Modal>
      )}
    </>
  );
}
