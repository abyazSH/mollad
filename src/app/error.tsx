'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-12 text-center">
      <h1 className="text-2xl font-bold">Ada kendala sebentar.</h1>
      <p className="my-4 text-muted">
        Data belum bisa dimuat. Silakan coba lagi.
      </p>
      <button className="button" onClick={reset}>
        Coba lagi
      </button>
    </div>
  );
}
