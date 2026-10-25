# Pendaftaran gagal setelah deploy

Error `PrismaClientInitializationError` berarti Prisma gagal menyiapkan engine atau koneksi database. Nama error saja belum membedakan environment yang hilang, kredensial salah, koneksi tidak terjangkau, atau engine yang tidak sesuai.

## Periksa environment Production

Di Vercel, buka proyek mollad → Settings → Environment Variables. Tambahkan variabel berikut pada lingkungan Production:

| Nama              | Nilai                                             |
| ----------------- | ------------------------------------------------- |
| NEON_DATABASE_URL | Connection string PostgreSQL Neon pooled          |
| NEON_DIRECT_URL   | Connection string PostgreSQL Neon direct/unpooled |
| NEXTAUTH_SECRET   | Secret privat minimal 32 karakter                 |
| APP_URL           | https://mollad.vercel.app                         |

Value connection string hanya `postgresql://…`, tanpa pembungkus tanda kutip atau awalan `NEON_DATABASE_URL=`. `.env` lokal tidak otomatis diunggah ke Vercel. DATABASE_URL SQLite tidak dipakai skema aktif. Jangan mengirim kredensial ke chat atau commit Git.

Setelah mengubah environment, buka Deployments → deployment Production terbaru → Redeploy. Uji kembali pendaftaran. Perubahan environment tidak mengubah deployment lama yang sudah berjalan.

## Jika masih gagal

Kode menyediakan buildCommand di vercel.json yang menjalankan `npm run vercel:build`: Prisma Client dibuat ulang sebelum Next.js build. Perubahan kode ini perlu di-commit dan di-push agar masuk deployment; perubahan lokal saja tidak memperbarui website online. Jika ada Build Command override di pengaturan proyek Vercel, pastikan konsisten dengan perintah ini.

Log inisialisasi baru hanya mencetak klasifikasi environment (missing/invalid/configured), kode Prisma jika tersedia, dan indikasi masalah engine. Connection string, pesan error mentah, username, password, dan host tidak dicetak. configured berarti format URL dikenali, bukan bukti koneksi berhasil.

Kode P1000 mengarah ke kredensial yang ditolak; P1001 ke server database yang tidak terjangkau. Gunakan kode serta klasifikasi untuk pemeriksaan lanjutan, bukan menebak dari pesan error umum pada UI. Jangan reset database atau menjalankan seed pada database pribadi untuk mengatasi kegagalan koneksi.

## Scan struk selalu masuk mode manual di Vercel

Pesan lama “Sebagian tulisan belum terbaca...” dapat berarti hasil OCR kurang jelas maupun mesin OCR gagal berjalan. Setelah pembaruan, kegagalan mesin menampilkan pesan tersendiri dan tombol Coba baca lagi. Logs hanya mencatat OCR_ENGINE_FAILED atau OCR_TIMEOUT; jangan membagikan struk, credential, atau error mentah.

Gunakan Build Command `npm run vercel:build` (juga diatur di vercel.json). Perintah ini menyiapkan bahasa ind+eng sebelum Next build. next.config.ts menyertakan model bahasa, worker Node, WASM, dan dependency worker dalam trace route /api/receipts. Pada runtime model dibaca tanpa menulis ke folder aplikasi; fallback download memakai folder sementara sistem.

Browser memperkecil foto asli di atas 3,5 MB sebelum dikirim. Preview tetap memakai foto asli lokal. Ini memberi headroom terhadap [batas payload Vercel 4,5 MB](https://vercel.com/docs/functions/limitations); foto tidak ditulis ke database atau object storage. Pengaturan ukuran route tidak dapat menaikkan batas platform tersebut.

Setelah kode di-push, tunggu deployment baru atau lakukan Redeploy. Pastikan build log mencetak Bahasa OCR ind+eng siap. Tidak perlu mengubah database/menjalankan seed. Uji menggunakan struk jelas; jika mesin berjalan tetapi hasil tetap rendah, koreksi manual atau evaluasi foto contoh. Pembacaan OCR tidak dijamin sempurna.
