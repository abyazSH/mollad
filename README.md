# mollad

**Atur uang, tanpa ribet.** Pengelola keuangan pribadi berbahasa Indonesia dengan saldo dompet, transaksi, transfer, laporan, anggaran, dan scan struk yang selalu direview sebelum disimpan.

## Setup lokal

Gunakan Node.js 22 dan npm. mollad memakai PostgreSQL Neon. Buat proyek Neon dan isi NEON_DATABASE_URL (pooled) serta NEON_DIRECT_URL (direct) di .env sebelum menjalankan migrasi. Dari direktori repo:

```sh
node scripts/init-env.mjs
npm install
npm run db:deploy
npm run db:check
npm run ocr:prepare
npm run dev
```

Buka http://localhost:3000. Script init-env membuat .env dari .env.example dengan secret acak, tanpa menimpa konfigurasi yang sudah ada. Alternatif: salin .env.example ke .env dan isi NEXTAUTH_SECRET minimal 32 karakter.

Buka /daftar untuk membuat akun baru. Jika membutuhkan data contoh pada branch pengembangan khusus, jalankan npm run db:seed. Demo: **demo@m.local** / **DemoM2026!**. Seed membuat satu akun, dua dompet, 30 transaksi dan tiga anggaran bulan saat ini; menjalankan ulang tidak menimpa data. Jangan menambahkan akun demo dengan kata sandi publik ini pada branch produksi.

## Koneksi Neon

NEON_DATABASE_URL adalah koneksi pooled (hostname mengandung -pooler) untuk aplikasi. NEON_DIRECT_URL adalah koneksi direct ke branch/database/role yang sama untuk migrasi. Pertahankan sslmode=require pada keduanya. DATABASE_URL=file:./dev.db hanya merupakan konfigurasi SQLite lama dan tidak dipakai skema PostgreSQL yang aktif.

Migrasi PostgreSQL berada di prisma/migrations. Skema dan migrasi SQLite sebelumnya diarsipkan di prisma/sqlite-archive; file prisma/dev.db tidak diubah. Data lama tidak otomatis dipindahkan. Jangan menerapkan migrasi SQLite pada Neon. Untuk perubahan skema selanjutnya gunakan npx prisma migrate dev pada branch development, lalu npm run db:deploy pada tujuan deployment.

Gunakan branch Neon khusus untuk pengujian Playwright karena tes membuat akun dan transaksi. Jangan menjalankannya terhadap database pribadi/produksi.

## Anggaran persentase penghasilan

Di halaman Anggaran, pilih bulan, lalu Buat anggaran/Ubah anggaran → Cara menentukan anggaran → Persentase penghasilan (%). Masukkan persentase bulat 1–100 untuk kategori tersebut; preview menampilkan nominal Rupiah sebelum disimpan. Mode Nominal tetap (Rp) tetap tersedia.

Contoh: pemasukan Rp5.000.000 dan alokasi Makanan 30% menghasilkan batas Rp1.500.000. Dasarnya seluruh transaksi INCOME milik pengguna pada bulan yang dipilih, tidak termasuk saldo awal atau transfer. Batas dihitung ulang saat halaman/API dibaca, sehingga menambah, mengubah, atau menghapus pemasukan bulan itu akan mengubah nominal alokasi. Tidak ada perubahan otomatis ke bulan lain.

Persentase dapat disimpan sebelum ada pemasukan; alokasi saat itu Rp0 dan tetap menampilkan peringatan jika sudah ada pengeluaran. Nilai persentase tersimpan di Budget.incomePercent; Budget.amount dipakai untuk mode nominal tetap (bernilai 0 sebagai placeholder pada mode persentase). Pembulatan ke Rupiah terdekat memakai perhitungan integer. Total rencana boleh melebihi pemasukan, tetapi UI memperingatkannya; ini memungkinkan pencatatan rencana yang perlu disesuaikan.

## OCR

Default OCR_PROVIDER=tesseract menggunakan bahasa ind+eng. npm run ocr:prepare mengunduh data bahasa ke .cache/tesseract. Tanpa langkah ini, unduhan dilakukan saat scan pertama. Foto JPG/PNG/WebP maksimal 8 MB dan 25 MP diperiksa signature dan decoding, diputar otomatis, metadata dibuang, serta dirender ulang. Salinan OCR di-resize, grayscale, normalize kontras, dan sharpen.

Untuk vision, isi .env:

```dotenv
OCR_PROVIDER=vision
VISION_API_KEY=your-private-key
VISION_API_URL=https://api.openai.com/v1/chat/completions
VISION_MODEL=gpt-4.1-mini
```

Endpoint harus HTTPS dan mendukung kontrak Chat Completions dengan image_url dan response_format JSON. Restart server setelah mengubah env. Vision aktif hanya jika provider vision dan key tersedia; tanpa key memakai Tesseract. Foto dikirim ke layanan yang dikonfigurasi. JSON divalidasi Zod sebelum ditampilkan. API vision diuji melalui respons simulasi; pengujian live memerlukan key sendiri.

Hasil mencakup merchant, tanggal ISO atau null jika tidak terbaca, total/pajak/diskon integer rupiah, metode bayar, items, kategori saran dan confidence. Confidence adalah perkiraan, bukan jaminan akurasi. Review wajib; saat gagal/hasil rendah, form manual tetap menampilkan foto lokal browser. Foto scan baru diproses dalam memori dan tidak ditulis ke disk, database, maupun object storage oleh mollad. Setelah Simpan, yang tersimpan adalah transaksi dan data teks/JSON struk. Foto lokal dilepas saat meninggalkan halaman; memuat ulang halaman membutuhkan unggahan ulang. Deteksi duplikat tetap membutuhkan konfirmasi jika pengguna ingin menyimpan transaksi serupa.

Data hasil OCR sementara dapat tersimpan sebagai draft sebelum konfirmasi; transaksi baru dibuat setelah Simpan. Mode vision mengirim gambar ke layanan yang dikonfigurasi, sehingga retensi pada layanan tersebut mengikuti kebijakan penyedianya. Foto lama yang dibuat sebelum perubahan ini tetap tersedia untuk pemiliknya; perubahan tidak menghapus arsip lama.

## Brand dan ikon

Semua SVG asli ada di public/brand. Konsep dan token dijelaskan di docs/brand.md. Manrope memakai next/font/google.

```sh
npm run icons
```

scripts/generate-icons.ts menggunakan sharp untuk ICO 16/32/48, Apple 180px, ikon 192/512px, maskable safe zone, preview logo dan OG 1200×630. Metadata dan manifest.webmanifest mendukung Add to Home Screen. HTTPS diperlukan di deployment. Aplikasi memerlukan koneksi untuk data; belum menyediakan mode offline.

## Pemeriksaan

```sh
npm run check
npm run format:check
npm run build
npm run test:e2e:production
```

Playwright memerlukan npx playwright install chromium. Uji browser mencakup auth, keuangan/isolasi akun, laporan/CSV, dan OCR Tesseract nyata. Jalankan tes saat port 3000 bebas. Tes membuat akun dengan email example.test pada database lokal yang dikonfigurasi; gunakan database pengujian sendiri untuk menghindari data uji pada database pribadi.

## Struktur

- src/app: App Router, halaman dan route API terautentikasi.
- src/components: layout, Logo, form CRUD, grafik, dan review.
- src/lib: auth, query/mutasi, validasi Zod, saldo integer, CSV, dan OCR.
- prisma: skema/migrasi PostgreSQL aktif, arsip SQLite, seed idempoten.
- public/brand: aset identitas dan ikon.
- scripts: generator ikon, init env, unduhan bahasa OCR.
- tests: unit test, termasuk 12 contoh teks struk Indonesia.
- e2e: pengujian Playwright.
- uploads: arsip foto versi lama, akses privat melalui /api/receipts/[id]; scan baru tidak menulis file.
- docs/progress.md: hasil setiap tahap.

## Keamanan dan deployment

### Mengunggah ke GitHub

Kode dapat disimpan di repository GitHub. Folder proyek belum otomatis terhubung ke akun/repository GitHub. Setelah membuat repository kosong sendiri, jalankan dari folder proyek:

```sh
git init
git add .
git status
git commit -m "Siapkan aplikasi mollad"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Ganti USERNAME dan REPOSITORY. Periksa daftar berkas sebelum commit: `.env`, database lokal, foto lama di uploads, node_modules, dan cache tidak boleh ikut. `.env.example` berisi placeholder dan boleh disimpan di GitHub. Jika sebuah secret pernah terunggah, hapus dari riwayat Git dan ganti secret tersebut.

Workflow `.github/workflows/ci.yml` memeriksa lint, TypeScript, unit test, format, build, dan tiga pengujian browser autentikasi pada lebar HP 320/390/430 px saat push/pull request. Pengujian HP memakai halaman publik dan memblokir permintaan autentikasi sebelum dikirim. Workflow ini tidak memakai secret Neon, tidak menjalankan migrasi, tidak menulis data produksi, dan tidak melakukan deployment. Untuk pembaruan website otomatis, hubungkan repository ke layanan hosting dan atur variabel lingkungan di layanan itu.

Mengunggah kode ke GitHub berbeda dengan menjalankan aplikasi online. GitHub Pages tidak menjalankan backend Node mollad. Sebelum memakai Vercel, sesuaikan upload struk 8 MB terhadap batas request fungsi 4,5 MB, serta cache bahasa Tesseract yang saat ini ditulis ke `.cache/tesseract`. Hosting Node yang menyediakan filesystem writable sesuai kebutuhan OCR juga dapat digunakan. Set `APP_URL` ke origin website dan simpan koneksi Neon serta secret sesi pada pengaturan hosting.

Cookie sesi JWT HTTP-only, bcrypt, validasi origin, pembatasan login berbasis database, dan pembatasan upload per akun. Semua akses data bisnis dibatasi userId, termasuk pemeriksaan relasi sebelum mutasi dan lampiran struk. .env, database, uploads dan cache diabaikan Git. Set APP_URL sesuai origin deployment; produksi memakai HTTPS dan cookie Secure.

Gunakan server Node untuk OCR; database berada di Neon. Cache bahasa OCR dapat disiapkan saat deployment. Jika masih memiliki arsip foto versi lama, backup folder uploads juga. Scan baru tidak memerlukan penyimpanan foto persisten; draft teks/JSON yang ditinggalkan belum dibersihkan otomatis. Batas dua OCR bersamaan berlaku per proses; deployment banyak instance memerlukan antrean bersama. Login memiliki bucket global 100 percobaan/15 menit dan bucket email 10/15 menit.

Skema aktif menggunakan PostgreSQL melalui Prisma 6 dengan directUrl untuk migrasi. Maksimum nominal satu transaksi/saldo awal Rp2 miliar; agregat dihitung sebagai integer JavaScript.

Parser bersifat heuristik: struk buram, format tidak lazim, item kompleks, tanggal internasional, atau potongan ambigu mungkin perlu koreksi. Transfer tidak dihitung sebagai pemasukan/pengeluaran. Penghapusan dompet/kategori terpakai membutuhkan penyelesaian transaksi terkait. Belum ada reset password, email verification, sinkronisasi bank, atau backup otomatis.
