'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  UserRound,
} from 'lucide-react';
import { Logo } from './logo';
import { useEffect, useState } from 'react';
import { useLanguage } from './language-provider';
const links = [
  ['/dashboard', 'Ringkasan', LayoutDashboard],
  ['/transaksi', 'Transaksi', ArrowLeftRight],
  ['/dompet', 'Dompet', Wallet],
  ['/anggaran', 'Anggaran', PieChart],
  ['/profil', 'Profil', UserRound],
] as const;
export function Shell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t('Lewati ke konten')}
      </a>
      <aside className="sidebar">
        <Link href="/dashboard" className="px-3">
          <Logo />
        </Link>
        <p className="mb-4 mt-12 px-4 text-[10px] font-bold tracking-[.18em] text-muted">
          {t('KEUANGAN PRIBADI')}
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
              <span>{t(label)}</span>
            </Link>
          ))}
        </nav>
        <Link
          href="/profil"
          className="mt-auto flex items-center gap-3 rounded-2xl bg-surface px-3 py-3"
        >
          <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="mt-1 text-[11px] text-muted">
              {t('Pengaturan akun')}
            </p>
          </div>
        </Link>
      </aside>
      <div className="main-wrap">
        <nav className="mobile-nav" aria-label="Navigasi seluler">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{t(label)}</span>
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
