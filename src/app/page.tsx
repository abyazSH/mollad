import Link from 'next/link';
import {
  ArrowRight,
  Wallet,
  ScanLine,
  PieChart,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { requireGuest } from '@/lib/auth';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/providers';

export default async function HomePage() {
  await requireGuest();
  return (
    <div className="min-h-screen">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <header className="border-b border-line bg-surface">
        <nav
          aria-label="Navigasi publik"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8"
        >
          <Link href="/" aria-label="Halaman utama mollad">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-3 text-sm font-bold"
            >
              Masuk
            </Link>
            <Link href="/register" className="button hidden sm:inline-flex">
              Buat akun
            </Link>
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="eyebrow">KEUANGAN PRIBADI, LEBIH TERATUR</p>
            <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Kenali uangmu.
              <br />
              Atur sesuai rencanamu.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-muted">
              mollad membantu mencatat pemasukan dan pengeluaran, melihat saldo
              setiap dompet, serta mengatur anggaran bulanan. Mulai dari catatan
              manual atau foto struk belanja.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="button">
                Buat akun mollad <ArrowRight size={17} />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 py-3 text-sm font-bold hover:bg-brand-mint"
              >
                Sudah punya akun? Masuk
              </Link>
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted">
              <ShieldCheck className="mt-1 shrink-0" size={16} />
              Data dompet, transaksi, dan anggaran hanya tersedia setelah kamu
              masuk ke akunmu.
            </p>
          </div>
          <div className="rounded-3xl border border-line bg-brand-mint p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ScanLine size={26} />
              <h2 className="text-lg font-extrabold">Dari struk ke catatan</h2>
            </div>
            <ol className="space-y-4">
              {[
                [
                  'Ambil atau unggah foto',
                  'Gunakan foto struk yang jelas agar tanggal dan nominal terbaca.',
                ],
                [
                  'Periksa hasil pembacaan',
                  'Koreksi data dan pilih kategori serta dompet yang sesuai.',
                ],
                [
                  'Simpan saat sudah tepat',
                  'Transaksi dicatat setelah konfirmasi. Foto tidak disimpan oleh mollad.',
                ],
              ].map(([title, description], index) => (
                <li
                  key={title}
                  className="flex gap-3 rounded-2xl bg-surface p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section aria-labelledby="features" className="mt-16 sm:mt-24">
          <h2 id="features" className="text-2xl font-extrabold tracking-tight">
            Catatan yang membantu mengambil keputusan
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                Icon: Wallet,
                title: 'Semua dompet dalam satu tempat',
                body: 'Pisahkan Tunai, Bank, dan E-wallet. Lihat saldo masing-masing dan catat transfer antar dompet.',
              },
              {
                Icon: ScanLine,
                title: 'Transaksi lebih mudah dicatat',
                body: 'Catat manual atau scan struk, cari riwayat transaksi, dan ekspor catatan ke CSV saat dibutuhkan.',
              },
              {
                Icon: PieChart,
                title: 'Anggaran sesuai penghasilan',
                body: 'Tentukan nominal tetap atau persentase pemasukan per kategori. Pantau pengeluaran dan batas anggaran.',
              },
            ].map(({ Icon, title, body }) => (
              <article key={title} className="card p-6">
                <Icon
                  size={25}
                  className="mb-4 text-emerald-700 dark:text-emerald-300"
                />
                <h3 className="text-base font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="accent-panel mt-10 flex flex-wrap items-center justify-between gap-5 rounded-3xl p-6 sm:p-8">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Check size={17} />
              Mulai dengan dompet pertamamu
            </p>
            <h2 className="text-2xl font-extrabold">Atur uang, tanpa ribet.</h2>
          </div>
          <Link href="/register" className="button border border-white/50">
            Buat akun <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <footer className="border-t border-line px-4 py-6 text-center text-xs text-muted">
        mollad · Atur uang, tanpa ribet.
      </footer>
    </div>
  );
}
