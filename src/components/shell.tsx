'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Shapes,
  PieChart,
  ScanLine,
  LogOut,
} from 'lucide-react';
import { Logo } from './logo';
import { ThemeToggle } from './providers';
import { useEffect, useState } from 'react';
const links = [
  ['/', 'Ringkasan', LayoutDashboard],
  ['/transaksi', 'Transaksi', ArrowLeftRight],
  ['/dompet', 'Dompet', Wallet],
  ['/anggaran', 'Anggaran', PieChart],
  ['/kategori', 'Kategori', Shapes],
  ['/scan', 'Scan struk', ScanLine],
] as const;
export function Shell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      window.location.assign('/login');
    } catch {
      setError('Gagal keluar. Coba lagi.');
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Lewati ke konten
      </a>
      <aside className="sidebar">
        <Link href="/" className="px-3">
          <Logo />
        </Link>
        <p className="mb-4 mt-12 px-4 text-[10px] font-bold tracking-[.18em] text-muted">
          KEUANGAN PRIBADI
        </p>
        <nav aria-label="Navigasi utama">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={'nav-link ' + (pathname === href ? 'active' : '')}
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === '/scan' && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
              )}
            </Link>
          ))}
        </nav>
        <Link href="/scan" className="sidebar-note hover:border-emerald-300/40">
          <ScanLine size={22} className="mb-3 text-ink" />
          <span className="text-ink">Punya struk belanja?</span>
          <p className="mt-2 text-xs leading-6 text-muted">
            Foto struk, periksa hasilnya, lalu simpan transaksi.
          </p>
        </Link>
        <div className="mt-auto border-t border-line pt-5">
          <div className="flex items-center gap-3 px-2">
            <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="mt-1 text-[11px] text-muted">Akun pribadi</p>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface"
              aria-label="Keluar"
              onClick={logout}
              disabled={!ready}
            >
              <LogOut size={17} />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-xs text-red-300">
              {error}
            </p>
          )}
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="lg:hidden">
            <Logo variant="mark" />
          </div>
          <p className="ml-3 min-w-0 truncate text-sm font-bold lg:hidden">
            {links.find(([href]) => href === pathname)?.[1] || 'mollad'}
          </p>
          <p className="hidden text-xs text-muted lg:block">
            Keuangan pribadi <span className="mx-3 text-line">/</span>
            <span className="font-semibold text-ink">
              {links.find(([href]) => href === pathname)?.[1] || 'mollad'}
            </span>
          </p>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <div className="avatar hidden sm:flex lg:hidden">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <button
              className="icon-button lg:hidden"
              aria-label="Keluar"
              onClick={logout}
              disabled={!ready}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Navigasi seluler">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className={
                pathname === href
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : ''
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <main id="main" className="content" inert={!ready} aria-busy={!ready}>
          {children}
        </main>
      </div>
    </div>
  );
}
