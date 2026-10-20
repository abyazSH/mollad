'use client';
import { useEffect, useState } from 'react';
import { Text } from '@/components/language-provider';
import Image from 'next/image';
import Link from 'next/link';
import {
  Camera,
  UploadCloud,
  ScanLine,
  Check,
  ArrowLeft,
  TriangleAlert,
  ShieldCheck,
} from 'lucide-react';
import { TransactionForm } from './transaction-form';
import { Logo } from './logo';
import { formatRupiah } from '@/lib/money';
import type { ReceiptData } from '@/lib/ocr/schema';
type Result = {
  id: string;
  data: ReceiptData;
  manual: boolean;
  duplicate: boolean;
  lowConfidence: string[];
};
type Option = { id: string; name: string };
export function ScanClient({
  wallets,
  categories,
  provider,
  done,
  manual,
}: {
  wallets: Option[];
  categories: Option[];
  provider: string;
  done?: () => void;
  manual?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function choose(value?: File) {
    if (!value) return;
    if (value.size > 8 * 1024 * 1024) {
      setError('Foto maksimal 8 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(value.type)) {
      setError('Pilih foto JPG, PNG, atau WebP.');
      return;
    }
    setError('');
    setResult(null);
    setFile(value);
  }
  async function scan() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/receipts', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(
        e instanceof TypeError
          ? 'Tidak dapat menghubungi mollad. Periksa koneksi internet, lalu coba lagi. Foto masih tersedia di halaman ini.'
          : e instanceof Error
            ? e.message
            : 'Foto belum berhasil diproses. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Text>{'CATAT PENGELUARAN'}</Text>
          </span>
          <h1 className="page-title">
            <Text>{result ? 'Periksa hasil scan' : 'Scan struk'}</Text>
          </h1>
          <p className="text-sm text-muted">
            <Text>
              {result
                ? 'Cocokkan nominal, tanggal, kategori, dan dompet dengan foto sebelum menyimpan.'
                : 'Unggah atau foto struk belanja untuk mengisi transaksi. Hasilnya bisa kamu koreksi.'}
            </Text>
          </p>
        </div>
        {result && (
          <button
            className="button button-secondary"
            onClick={() => {
              setResult(null);
              setFile(null);
            }}
          >
            <ArrowLeft size={16} />
            <Text>{'Scan struk lain'}</Text>
          </button>
        )}
      </div>
      <ol
        aria-label="Tahapan scan struk"
        className="mb-8 grid grid-cols-3 gap-2 rounded-xl border border-line bg-surface p-3 text-xs sm:gap-6 sm:p-4"
      >
        {['Unggah foto', 'Periksa hasil', 'Simpan transaksi'].map(
          (label, i) => (
            <li
              key={label}
              aria-current={i === (result ? 1 : 0) ? 'step' : undefined}
              className={
                'flex items-center gap-2 ' +
                (i === (result ? 1 : 0)
                  ? 'font-bold text-emerald-700 dark:text-emerald-300'
                  : 'text-muted')
              }
            >
              <span
                className={
                  'flex h-6 w-6 items-center justify-center rounded-full ' +
                  (i === (result ? 1 : 0)
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-surface')
                }
              >
                {result && i === 0 ? <Check size={13} /> : i + 1}
              </span>
              <Text>{label}</Text>
            </li>
          ),
        )}
      </ol>
      {!wallets.length && (
        <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <Text>{'Tambahkan dompet sebelum menyimpan hasil scan.'}</Text>{' '}
          <Link className="underline" href="/dompet">
            <Text>{'Buka dompet'}</Text>
          </Link>
        </p>
      )}
      <div className="grid items-start gap-7 lg:grid-cols-2">
        <section className="card p-4 sm:p-6">
          {preview || result ? (
            <div className="relative h-[min(48dvh,360px)] overflow-hidden rounded-xl bg-canvas sm:h-[540px]">
              <Image
                src={preview}
                alt="Foto struk untuk diperiksa"
                fill
                unoptimized
                className="object-contain p-3"
              />
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-canvas p-5 text-center sm:min-h-80 sm:p-8">
              <span className="mb-4 rounded-2xl bg-emerald-100 p-3 text-emerald-800 sm:p-5">
                <ScanLine size={38} />
              </span>
              <h2 className="text-lg font-extrabold">
                <Text>{'Pilih foto struk'}</Text>
              </h2>
              <p className="mt-3 max-w-xs text-xs leading-6 text-muted">
                <Text>
                  {
                    'Pastikan seluruh struk terlihat, cahaya cukup, dan tulisan tidak buram.'
                  }
                </Text>
              </p>
            </div>
          )}
          {!result && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                <label className="scan-file-choice button button-secondary cursor-pointer px-2 sm:px-5">
                  <UploadCloud size={16} />
                  <Text>{'Pilih foto'}</Text>
                  <input
                    aria-label="Unggah foto struk"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => choose(e.target.files?.[0])}
                  />
                </label>
                <label className="scan-file-choice button button-secondary cursor-pointer px-2 sm:px-5">
                  <Camera size={16} />
                  <Text>{'Ambil foto'}</Text>
                  <input
                    aria-label="Ambil foto struk"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => choose(e.target.files?.[0])}
                  />
                </label>
              </div>
              <p className="mt-3 text-center text-[10px] text-muted">
                <Text>{'JPG, PNG, WebP · Maksimal 8 MB'}</Text>
              </p>
              {file && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-canvas p-3 text-xs">
                  <span className="min-w-0 truncate" title={file.name}>
                    {file.name} · {(file.size / 1024 / 1024).toFixed(1)}
                    <Text>{'MB'}</Text>
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    className="min-h-11 shrink-0 px-2 font-bold text-muted underline"
                    onClick={() => setFile(null)}
                  >
                    <Text>{'Hapus foto'}</Text>
                  </button>
                </div>
              )}
              {file && (
                <button
                  onClick={scan}
                  className="button button-primary mt-5 w-full"
                  disabled={busy}
                >
                  <ScanLine size={17} />
                  <Text>{busy ? 'Membaca struk…' : 'Baca struk'}</Text>
                </button>
              )}
            </>
          )}
          <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-muted">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            <Text>
              {provider === 'vision'
                ? 'Foto diproses sementara oleh layanan AI yang dikonfigurasi. mollad menyimpan data struk tanpa menyimpan gambarnya.'
                : 'Foto diproses sementara. Setelah Simpan, hanya data struk yang tersimpan; gambar tidak disimpan oleh mollad.'}
            </Text>
          </p>
        </section>
        <section>
          {error && (
            <p className="error-box mb-5" role="alert">
              {error}
            </p>
          )}
          {busy ? (
            <div
              className="card flex min-h-80 flex-col items-center justify-center p-8 text-center"
              role="status"
            >
              <div className="logo-breathe">
                <Logo variant="mark" />
              </div>
              <h2 className="mt-6 font-bold">
                <Text>{'Sedang membaca struk…'}</Text>
              </h2>
              <p className="mt-3 max-w-xs text-xs leading-6 text-muted">
                <Text>
                  {
                    'Proses dapat memerlukan sekitar satu menit. Biarkan halaman ini terbuka. Setelah selesai, periksa hasilnya sebelum menyimpan.'
                  }
                </Text>
              </p>
            </div>
          ) : result ? (
            <div className="card p-6 sm:p-8">
              <h2 className="mb-2 text-lg font-extrabold">
                <Text>
                  {result.manual ? 'Lengkapi secara manual' : 'Hasil pembacaan'}
                </Text>
              </h2>
              <p className="mb-6 text-xs text-muted">
                <Text>{'Keyakinan pembacaan:'}</Text>
                {Math.round(result.data.confidence * 100)}
                <Text>{'%. Tetap periksa setiap angka.'}</Text>
              </p>
              {result.manual && (
                <p className="mb-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <Text>
                    {
                      'Sebagian tulisan belum terbaca dengan baik. Isi data di bawah; foto tetap terlihat selama review dan tidak disimpan.'
                    }
                  </Text>
                </p>
              )}
              {result.duplicate && (
                <p
                  role="alert"
                  className="mb-5 flex gap-2 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                  <TriangleAlert size={18} className="shrink-0" />
                  <Text>
                    {
                      'Ada transaksi dengan merchant, tanggal, dan total yang sama. Periksa agar tidak tercatat dua kali.'
                    }
                  </Text>
                </p>
              )}
              <TransactionForm
                done={done}
                wallets={wallets}
                categories={categories}
                lowConfidence={result.lowConfidence}
                initial={{
                  type: 'EXPENSE',
                  receiptId: result.id,
                  merchant: result.data.merchant,
                  date: result.data.tanggal || undefined,
                  amount: result.data.total,
                  categoryId: categories.find(
                    (c) =>
                      c.name.toLowerCase() ===
                      result.data.kategori_saran.toLowerCase(),
                  )?.id,
                  note: '',
                }}
              />
              {!!result.data.items.length && (
                <details className="mt-6 border-t border-line pt-5 text-xs">
                  <summary className="cursor-pointer font-bold">
                    <Text>{'Detail barang ('}</Text>
                    {result.data.items.length})
                  </summary>
                  <ul className="mt-3 space-y-2 text-muted">
                    {result.data.items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          {item.qty} × {item.nama}
                        </span>
                        <span>{formatRupiah(item.harga)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-muted">
                    <Text>{'Pajak'}</Text>
                    {formatRupiah(result.data.pajak)}
                    <Text>{'· Diskon'}</Text> {formatRupiah(result.data.diskon)}{' '}
                    · {result.data.metode_bayar || 'Metode belum terbaca'}
                  </p>
                </details>
              )}
            </div>
          ) : (
            <div className="card p-6 sm:p-8">
              <h2 className="text-lg font-bold">
                <Text>{'Agar struk terbaca dengan baik'}</Text>
              </h2>
              <p className="mt-2 text-sm text-muted">
                <Text>
                  {
                    'Gunakan foto yang jelas dan pastikan nominal total terlihat.'
                  }
                </Text>
              </p>
              <div className="mt-8 space-y-6">
                {[
                  [
                    '01',
                    'Ambil dengan jelas',
                    'Letakkan struk di permukaan rata. Hindari bayangan dan pantulan cahaya.',
                  ],
                  [
                    '02',
                    'Periksa hasilnya',
                    'mollad membantu membaca, kamu memastikan tanggal, nominal, dan dompetnya.',
                  ],
                  [
                    '03',
                    'Simpan saat sudah yakin',
                    'Tidak ada transaksi yang dicatat sebelum kamu menekan Simpan.',
                  ],
                ].map(([n, title, body]) => (
                  <div key={n} className="flex gap-4">
                    <span className="pt-1 text-xs font-bold text-emerald-600">
                      {n}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">
                        <Text>{title}</Text>
                      </h3>
                      <p className="mt-2 max-w-sm text-xs leading-6 text-muted">
                        <Text>{body}</Text>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 border-t border-line pt-5">
                <p className="mb-3 text-sm text-muted">
                  <Text>
                    {'Tidak punya struk atau ingin mengetik sendiri?'}
                  </Text>
                </p>
                <button
                  type="button"
                  onClick={manual}
                  className="button button-secondary"
                >
                  <Text>{'Catat transaksi manual'}</Text>
                </button>
                <p className="mt-4 text-xs leading-6 text-muted">
                  <Text>
                    {
                      'Foto hanya tersedia selama halaman ini terbuka. Jika halaman dimuat ulang, unggah kembali fotonya.'
                    }
                  </Text>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
