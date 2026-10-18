import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.cache/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettier,
];
export default config;
