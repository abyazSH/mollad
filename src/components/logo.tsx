export function Logo({
  variant = 'full',
  className = '',
}: {
  variant?: 'mark' | 'full';
  className?: string;
}) {
  return (
    <span
      className={'inline-flex items-center gap-3 ' + className}
      aria-label="mollad"
    >
      <svg
        width="38"
        height="38"
        viewBox="0 0 64 64"
        role="img"
        aria-label="Logo mollad"
      >
        <rect width="64" height="64" rx="20" fill="#46B4A0" />
        <path
          d="M16 44V29a8 8 0 0 1 16 0v15M32 29a8 8 0 0 1 16 0v15"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="15" r="5" fill="#FFA6C1" />
      </svg>
      {variant === 'full' && (
        <span className="text-[28px] font-extrabold tracking-[-.045em] text-inherit">
          mollad<span className="sr-only"> — Atur uang, tanpa ribet.</span>
        </span>
      )}
    </span>
  );
}
