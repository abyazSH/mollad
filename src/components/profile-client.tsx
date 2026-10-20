'use client';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Download,
  Languages,
  LogOut,
  Palette,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useLanguage } from './language-provider';
type Option = { id: string; name: string };
export function ProfileClient({
  user,
  wallets,
  categories,
}: {
  user: { name: string; email: string };
  wallets: Option[];
  categories: Option[];
}) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  async function exportCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExportError('');
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    data.forEach((value, key) => params.set(key, String(value)));
    if (
      params.get('from') &&
      params.get('to') &&
      params.get('from')! > params.get('to')!
    ) {
      setExportError('Tanggal akhir harus setelah tanggal awal.');
      return;
    }
    setExporting(true);
    try {
      const response = await fetch('/api/export?' + params);
      if (!response.ok)
        throw new Error('Ekspor belum berhasil. Silakan coba lagi.');
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mollad-transaksi.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('Ekspor belum berhasil. Silakan coba lagi.');
    } finally {
      setExporting(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      window.location.assign('/');
    } catch {
      setError('Gagal keluar. Coba lagi.');
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('AKUN & PREFERENSI')}</span>
          <h1 className="page-title">{t('Profil')}</h1>
          <p className="text-sm text-muted">
            {t('Kelola preferensi dan data keuanganmu di satu tempat.')}
          </p>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-6">
          <section className="card p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-mint">
                <UserRound size={26} />
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold">{user.name}</h2>
                <p className="break-all text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={16} />
              {t('Akun pribadi')}
            </p>
          </section>
          <section className="card accent-card space-y-6 p-6 sm:p-8">
            <h2 className="text-lg font-bold">{t('Preferensi')}</h2>
            <label>
              <span className="flex items-center gap-2">
                <Languages size={17} />
                {t('Bahasa')}
              </span>
              <select
                aria-label={t('Bahasa')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'id' | 'en')}
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              <span className="flex items-center gap-2">
                <Palette size={17} />
                {t('Tampilan')}
              </span>
              <select
                aria-label={t('Tampilan')}
                value={theme || 'light'}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">{t('Terang')}</option>
                <option value="dark">{t('Gelap')}</option>
                <option value="system">{t('Sistem')}</option>
              </select>
            </label>
            <p className="text-xs text-muted">
              {t('Berlaku pada perangkat ini.')}
            </p>
          </section>
          <section className="card p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold">{t('Keluar dari akun')}</h2>
            {error && (
              <p role="alert" className="error-box mb-4">
                {t(error)}
              </p>
            )}
            <button
              type="button"
              className="button w-full"
              disabled={busy}
              onClick={logout}
            >
              <LogOut size={17} />
              {t(busy ? 'Sedang keluar…' : 'Keluar')}
            </button>
          </section>
        </div>
        <section className="card p-6 sm:p-8">
          <span className="accent-panel mb-4 inline-flex rounded-xl p-3">
            <Download size={23} />
          </span>
          <h2 className="text-lg font-bold">{t('Ekspor CSV')}</h2>
          <p className="mb-6 mt-2 text-sm text-muted">
            {t(
              'Ekspor seluruh transaksi atau pilih rentang tanggal dan filter di bawah.',
            )}
          </p>
          <form onSubmit={exportCsv} className="space-y-5">
            <div className="field-grid">
              <label>
                {t('Dari tanggal')}
                <input type="date" name="from" />
              </label>
              <label>
                {t('Sampai tanggal')}
                <input type="date" name="to" />
              </label>
            </div>
            <label>
              {t('Dompet')}
              <select name="walletId" aria-label={t('Dompet')}>
                <option value="">{t('Semua dompet')}</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('Kategori')}
              <select name="categoryId" aria-label={t('Kategori')}>
                <option value="">{t('Semua kategori')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('Jenis transaksi')}
              <select name="type" aria-label={t('Jenis transaksi')}>
                <option value="">{t('Semua tipe')}</option>
                <option value="INCOME">{t('Pemasukan')}</option>
                <option value="EXPENSE">{t('Pengeluaran')}</option>
                <option value="TRANSFER">{t('Transfer')}</option>
              </select>
            </label>
            {exportError && (
              <p className="error-box" role="alert">
                {t(exportError)}
              </p>
            )}
            <button
              className="button button-accent w-full"
              type="submit"
              disabled={exporting}
            >
              <Download size={17} />
              {t(exporting ? 'Menyiapkan CSV…' : 'Unduh transaksi')}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
