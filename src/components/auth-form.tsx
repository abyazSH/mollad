'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ScanLine, ShieldCheck } from 'lucide-react';
import { Logo } from './logo';
import { ThemeToggle } from './providers';
export function AuthForm({ register = false }: { register?: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(
        '/api/auth/' + (register ? 'register' : 'login'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign('/');
    } catch (error) {
      setError(
        error instanceof TypeError
          ? 'Tidak dapat menghubungi mollad. Periksa koneksi dan coba lagi.'
          : error instanceof Error
            ? error.message
            : 'Tidak dapat terhubung.',
      );
      setBusy(false);
    }
  }
  return (
    <main className="auth-grid">
      <section className="auth-story">
        <Logo />
        <div>
          <span className="eyebrow text-ink">KEUANGAN PRIBADI</span>
          <h1>
            Lihat saldomu.
            <br />
            <span className="text-ink">Pahami pengeluaranmu.</span>
          </h1>
          <p>
            Catat pemasukan dan pengeluaran, kelola beberapa dompet, dan periksa
            anggaran dalam satu tempat.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-muted">
            <ScanLine className="text-ink" /> Scan struk dan periksa sebelum
            menyimpan.
          </div>
        </div>
        <p className="text-xs text-muted">mollad · Atur uang, tanpa ribet.</p>
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <span className="eyebrow">MULAI DARI SINI</span>
          <h2 className="mt-3 text-3xl font-extrabold">
            {register ? 'Buat akun mollad' : 'Masuk ke mollad'}
          </h2>
          <p className="mb-8 mt-3 text-sm text-muted">
            {register
              ? 'Gunakan email dan kata sandi untuk menyimpan catatan keuanganmu.'
              : 'Masuk untuk melihat saldo, transaksi, dan anggaranmu.'}
          </p>
          <form onSubmit={submit} method="post" className="space-y-5">
            {register && (
              <label>
                Nama
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="Nama panggilanmu"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="kamu@email.com"
              />
            </label>
            <label>
              Kata sandi
              <input
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={8}
                maxLength={72}
                placeholder="Minimal 8 karakter"
              />
            </label>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <button className="button w-full" disabled={busy || !ready}>
              {busy ? 'Sebentar, ya…' : register ? 'Buat akun' : 'Masuk'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-muted">
            {register ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <Link
              className="font-bold text-emerald-700 dark:text-emerald-300"
              href={register ? '/login' : '/daftar'}
            >
              {register ? 'Masuk' : 'Daftar sekarang'}
            </Link>
          </p>
          <p className="mt-12 flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck size={15} /> Keuanganmu, ruang pribadimu.
          </p>
        </div>
      </section>
    </main>
  );
}
