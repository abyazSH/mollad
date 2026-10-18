import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';
const font = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'mollad',
  description:
    'Atur uang, tanpa ribet. Catat transaksi, kelola dompet, dan scan struk bersama mollad.',
  applicationName: 'mollad',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/brand/icon.svg?v=mollad', type: 'image/svg+xml' },
      { url: '/brand/favicon.ico?v=mollad' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
  openGraph: {
    title: 'mollad',
    description: 'Atur uang, tanpa ribet.',
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630 }],
    locale: 'id_ID',
    type: 'website',
  },
  appleWebApp: { capable: true, title: 'mollad', statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E7F7F4' },
    { media: '(prefers-color-scheme: dark)', color: '#193932' },
  ],
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={font.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
