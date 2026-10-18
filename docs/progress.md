# Catatan tahap M

## Tahap 1 — fondasi

- Next.js App Router, TypeScript strict, Tailwind, Prisma SQLite, dan migrasi awal.
- Autentikasi bcrypt + sesi JWT HTTP-only, proteksi origin, pembatasan login berbasis database.
- Layout responsif, Manrope, mode terang/gelap, metadata, manifest, seluruh aset brand dan generator ikon.
- Preview logo dan Open Graph sudah dirender dan diperiksa visual.
- Build produksi berhasil; 6 unit test dan alur Playwright daftar → keluar → masuk lulus.
- Temuan uji browser: sidebar pendek tidak dapat digulir dan tombol/form sebelum hidrasi; keduanya diperbaiki.
- Belum: fitur keuangan, dashboard, OCR, seed demo, dokumentasi akhir.

## Tahap 2 — keuangan inti

- CRUD dompet, kategori, transaksi; transfer; saldo integer; filter, pencarian, pagination.
- Pemeriksaan kepemilikan semua relasi dan mutasi. Dompet/kategori terpakai terlindungi dari penghapusan.
- Lint dan TypeScript bersih; 15 unit test lulus; Playwright CRUD/transfer/saldo/isolasi dua pengguna lulus.
- Belum: dashboard, anggaran, ekspor, OCR, seed dan polish akhir.

## Tahap 3 — laporan

- Dashboard saldo, pemasukan/pengeluaran, sisa uang, donut kategori, tren harian/bulanan, lima transaksi terbaru.
- Anggaran bulanan per kategori, peringatan di atas 80%/100%, CRUD anggaran.
- CSV mengikuti filter transaksi dengan mitigasi formula injection.
- Lint/TypeScript bersih, 18 unit test lulus, uji browser laporan/anggaran/CSV lulus pada build produksi.
- Belum: scan struk, seed demo, polish dan pemeriksaan akhir.

## Tahap 4 — scan struk

- Validasi foto nyata, UUID, foto privat, preprocessing sharp, Tesseract ind+eng dan provider vision.
- Review editable wajib, field kurang yakin, fallback manual dengan lampiran, dan konfirmasi duplikat saat simpan.
- 42 unit test lulus, termasuk 12 contoh struk Indonesia dan kontrak vision. Uji Tesseract nyata lulus.
- Build/lint/TypeScript bersih. Navigasi setelah simpan diperbaiki.
- Belum pada akhir tahap: seed, dokumentasi dan pemeriksaan visual akhir.

## Tahap 5 — hasil akhir

- Seed idempoten: satu akun demo, dua dompet, 30 transaksi, tiga anggaran.
- README setup, OCR, generator ikon, struktur, deployment, dan batasan.
- Preview desktop, mobile 390px, dan mode gelap sudah diperiksa visual.
- Penyegaran anggaran setelah mutasi diperbaiki.
- Pemeriksaan akhir: 42 unit test, lima alur Playwright, build produksi, lint, TypeScript dan format Prettier lulus.
- Seluruh tahap selesai. Vision live belum diuji karena membutuhkan API key; kontraknya diuji dengan simulasi. Batasan operasional tercantum di README.

## Integrasi Neon

- Skema aktif PostgreSQL dengan NEON_DATABASE_URL pooled dan NEON_DIRECT_URL untuk migrasi.
- Migrasi awal PostgreSQL diterapkan ke Neon; koneksi dan akses seluruh tabel diperiksa.
- Skema/migrasi SQLite diarsipkan di prisma/sqlite-archive; prisma/dev.db dipertahankan. Data lama belum disalin ke Neon.
- Perintah db:deploy dan db:check serta petunjuk README ditambahkan.
- Lint, TypeScript dan 42 unit test lulus. Tes browser yang menulis data perlu branch Neon pengujian terpisah.

## Perbaikan UI dan UX

- Ringkasan periode laporan lebih jelas, petunjuk dompet pertama, dan peringatan nominal kelebihan anggaran.
- Kartu transaksi pada HP, label filter terlihat, tindakan untuk hasil kosong, tombol lebih mudah disentuh, dan navigasi aktif lebih jelas.
- Scan memiliki tahapan, nama/ukuran file, hapus foto, pencatatan manual, petunjuk unggah ulang, dan pesan jaringan Bahasa Indonesia.
- Slogan berulang diganti penjelasan fungsi. Detail keputusan di docs/ui-ux.md.
- Lint, TypeScript, 42 unit test, dan build produksi lulus. Pemeriksaan browser memakai data contoh terisolasi: desktop, gelap, layar 320/390 px, petunjuk awal, kartu transaksi, reset foto, dan error jaringan autentikasi.
- Koneksi Neon belum dapat diakses saat pemeriksaan ini; alur database online tidak diuji ulang dan data pengguna tidak diubah.

## Penyempurnaan HP dan kesiapan GitHub — 18 Oktober 2026

- Filter transaksi dilipat di HP, tombol catat transaksi diperjelas, header mengikuti guliran, input 16 px, dan jarak konten bawah memperhitungkan safe area.
- Area foto struk dipadatkan, tombol kamera/unggah sejajar, dan tinggi pratinjau mengikuti layar.
- Koneksi Neon dan akses seluruh tabel kembali berhasil. Dashboard, transaksi, dan scan diperiksa melalui sesi sementara secara baca saja; tidak ada perubahan data pengguna.
- Tiga tes Playwright halaman publik pada lebar 320/390/430 px lulus; permintaan pendaftaran disimulasikan gagal sebelum mencapai server. Pemeriksaan komponen tambahan memverifikasi filter lipat, nilai filter yang tetap terisi, dialog, dan tombol kamera.
- Lint, TypeScript, 42 unit test, format, dan build produksi lulus. Tiga tes HP juga lulus pada build produksi. Cache preview dikecualikan dari lint/TypeScript.
- Workflow GitHub ditambahkan untuk pemeriksaan kode, build, dan tes HP tanpa secret/data Neon. Audit kandidat unggahan tidak menyertakan berkas privat/generated atau nilai secret lokal.
- Folder belum diinisialisasi sebagai repository Git utama dan belum diunggah ke GitHub. Deployment hosting tetap memerlukan konfigurasi lingkungan dan penyesuaian OCR untuk Vercel.

## Anggaran persentase penghasilan

- Pilihan nominal tetap atau persentase bulat 1–100% per kategori/bulan, dengan preview Rupiah dan informasi penghasilan bulan terpilih.
- Persentase disimpan dan batas dihitung ulang dari transaksi pemasukan milik pengguna pada bulan terkait. Saldo awal dan transfer tidak termasuk; tanpa pemasukan alokasi Rp0.
- Peringatan total rencana melebihi penghasilan, penanganan alokasi nol tanpa NaN/Infinity, dan tampilan persentase di ringkasan dashboard.
- Migrasi tambahan kolom nullable incomePercent dan constraint 1–100 diterapkan ke Neon tanpa menghapus anggaran lama.
- 58 unit test lulus, termasuk perhitungan/pembulatan, perubahan pemasukan, aturan input, penyimpanan mode, kompatibilitas klien lama, dan pembatasan pemilik. Lint, TypeScript, format, dan build produksi lulus.
- Formulir HP 320/390 px diperiksa dengan data contoh: preview, batas persentase, dan pengaturan saat edit. Tes tidak membuat transaksi atau anggaran pada database pribadi.

## Identitas mollad

- Nama produk diperbarui menjadi mollad di UI, metadata, manifest, ekspor CSV, paket, dan README; sesi/data pengguna dipertahankan.
- Soft Tosca #46B4A0, Soft Pink #FFA6C1, Medium Slate Teal #385A55, Pale Mint #E7F7F4, dan Rose Blush #FFF0F2 diterapkan. Tampilan terang menjadi default dan mode gelap memakai turunan hijau.
- Simbol m dan wordmark SVG, favicon/ikon PNG/maskable, serta OG dibuat ulang dan diperiksa visual.
- Teks tombol memakai #173F38 pada tosca (kontras 4,60:1). Sidebar mint, informasi positif blush, dan grafik tosca/pink dengan garis pembanding putus-putus. Warna kategori pengguna tidak diubah.
- Lint, TypeScript, 58 unit test, serta pemeriksaan browser komponen desktop/gelap/HP lulus. Tidak ada perubahan skema atau data Neon pada rebranding.
