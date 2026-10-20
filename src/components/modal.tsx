'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Text, useLanguage } from './language-provider';
export function Modal({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = before;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      className={
        'm-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl backdrop:bg-slate-950/60 sm:p-8 ' +
        (wide ? 'max-w-5xl' : 'max-w-xl')
      }
      aria-label={t(title)}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold">
          <Text>{title}</Text>
        </h2>
        <button
          type="button"
          className="icon-button"
          onClick={close}
          aria-label={t('Tutup')}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
