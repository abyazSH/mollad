# mollad

mollad adalah pengelola keuangan pribadi. Nama ditulis dengan huruf kecil di UI, metadata, manifest, dan aset brand. Tagline: **Atur uang, tanpa ribet.**

## Konsep: dua lengkung dan satu langkah kecil

Simbol m memakai dua lengkung membulat untuk memberi kesan ramah dan stabil. Titik pink menjadi aksen langkah kecil yang berkelanjutan, bukan indikator pencapaian pengguna. Semua SVG dibuat khusus melalui koordinat vektor. Wordmark SVG mollad juga berupa path, tidak bergantung font eksternal. Ikon memakai siluet sederhana dan tetap diperiksa pada ukuran kecil.

## Sistem visual

| Token   | Warna                     | Penggunaan                                           |
| ------- | ------------------------- | ---------------------------------------------------- |
| Primary | Soft Tosca #46B4A0        | Progres normal, grafik pemasukan, navigasi aktif     |
| Pink    | Soft Pink #FFA6C1         | Tombol utama, aksen ikon, grafik pembanding, sorotan |
| Ink     | Medium Slate Teal #385A55 | Judul, teks utama, nominal, ikon                     |
| Mint    | Pale Mint #E7F7F4         | Sidebar, ringkasan saldo, trek progres               |
| Blush   | Rose Blush #FFF0F2        | Informasi positif, kartu bantuan, feedback sukses    |

Tampilan terang menjadi default. Mode gelap opsional memakai turunan hijau, tanpa navy. Token terpusat di tailwind.config.ts dan src/app/globals.css; alias emerald dipetakan ke keluarga tosca untuk kompatibilitas komponen. Warna kategori yang sudah dipilih pengguna tidak diubah di database. Peringatan/error mempertahankan amber/merah agar maknanya jelas. Tidak ada streak atau prestasi buatan.

Kontras terhitung: #385A55 di putih 7,60:1 dan di Pale Mint 6,88:1. Label tombol #173F38 di Soft Tosca 4,60:1; teks putih di tosca tidak digunakan. Soft Pink bukan warna teks kecil di atas putih. Aksen pink menggunakan teks teal pekat atau permukaan Rose Blush. Grafik pembanding memakai garis putus-putus dan label, bukan warna saja.

Manrope melalui next/font/google untuk heading, wordmark React, dan teks. Heading menggunakan bobot 800 dan tracking rapat; teks transaksi memakai angka tabular. Logo React mewarisi warna teks tema, sedangkan simbol konsisten di dua tema.

## Penggunaan

Ruang kosong minimum seperempat tinggi simbol. Jangan merenggangkan rasio atau memakai latar ramai. logo-full-dark.svg untuk latar gelap; logo-mono.svg untuk cetak. Ikon maskable mempunyai simbol 288px di kanvas 512px, seluruh bentuk berada dalam safe zone pusat. Animasi loading hanya opacity dan translasi ringan serta dinonaktifkan pada prefers-reduced-motion.

Jalankan npm run icons untuk seluruh PNG dan ICO. logo-preview.png untuk inspeksi visual. favicon.ico berisi ukuran 16/32/48 dengan payload PNG.
