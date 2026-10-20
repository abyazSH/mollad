import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="p-16 text-center">
      <h1 className="text-3xl font-bold">Halaman tidak ditemukan.</h1>
      <Link className="button mt-6" href="/">
        Kembali ke halaman utama
      </Link>
    </main>
  );
}
