import { ensureLanguages } from '../src/lib/ocr/languages';
ensureLanguages()
  .then(() => console.log('Bahasa OCR ind+eng siap.'))
  .catch(() => {
    console.error(
      'Unduhan bahasa gagal. Periksa koneksi lalu jalankan ulang npm run ocr:prepare.',
    );
    process.exitCode = 1;
  });
