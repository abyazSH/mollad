import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#46B4A0',
          pink: '#FFA6C1',
          ink: 'var(--ink)',
          onPrimary: '#173F38',
          mint: 'var(--brand-mint)',
          blush: 'var(--brand-blush)',
          light: '#FCFEFD',
        },
        // Compatibility shades for existing finance components.
        emerald: {
          50: '#F2FBF8',
          100: '#E7F7F4',
          200: '#C7EAE3',
          300: '#8ED3C5',
          400: '#46B4A0',
          500: '#46B4A0',
          600: '#2C8C7B',
          700: '#385A55',
          800: '#385A55',
          900: '#284B44',
          950: '#193932',
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
