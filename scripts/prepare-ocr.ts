import { prepareLanguages } from '../src/lib/ocr/languages';
import path from 'node:path';
prepareLanguages(path.resolve('.cache/tesseract'))
  .then(() => console.log('Bahasa OCR ind+eng siap.'))
  .catch(() => {
    console.error(
      'Unduhan bahasa gagal. Periksa koneksi lalu jalankan ulang npm run ocr:prepare.',
    );
    process.exitCode = 1;
  });
