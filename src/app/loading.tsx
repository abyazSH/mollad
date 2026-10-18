import { Logo } from '@/components/logo';
export default function Loading() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-5"
      role="status"
    >
      <div className="logo-breathe">
        <Logo variant="mark" />
      </div>
      <p className="text-sm text-muted">Menyiapkan ruang keuanganmu…</p>
    </div>
  );
}
