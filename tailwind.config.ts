import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--primary)',
          pink: 'var(--accent-detail)',
          ink: 'var(--ink)',
          onPrimary: '#173F38',
          mint: 'var(--brand-mint)',
          blush: 'var(--brand-blush)',
          light: '#FCFEFD',
        },
        // Compatibility shades for existing finance components.
        emerald: {
          50: 'rgb(var(--tone-50) / <alpha-value>)',
          100: 'rgb(var(--tone-100) / <alpha-value>)',
          200: 'rgb(var(--tone-200) / <alpha-value>)',
          300: 'rgb(var(--tone-300) / <alpha-value>)',
          400: 'rgb(var(--tone-400) / <alpha-value>)',
          500: 'rgb(var(--tone-500) / <alpha-value>)',
          600: 'rgb(var(--tone-600) / <alpha-value>)',
          700: 'rgb(var(--tone-700) / <alpha-value>)',
          800: 'rgb(var(--tone-800) / <alpha-value>)',
          900: 'rgb(var(--tone-900) / <alpha-value>)',
          950: 'rgb(var(--tone-950) / <alpha-value>)',
        },
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
      },
      fontFamily: { sans: ['var(--font-manrope)', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config;
