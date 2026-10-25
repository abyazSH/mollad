import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['tesseract.js', 'sharp'],
  outputFileTracingIncludes: {
    '/api/receipts': [
      './.cache/tesseract/*.traineddata',
      './node_modules/tesseract.js/**',
      './node_modules/tesseract.js-core/**',
      './node_modules/wasm-feature-detect/**',
      './node_modules/regenerator-runtime/**',
      './node_modules/is-url/**',
      './node_modules/zlibjs/**',
      './node_modules/bmp-js/**',
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};
export default config;
