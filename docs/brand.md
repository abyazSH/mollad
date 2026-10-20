# mollad

mollad adalah pengelola keuangan pribadi. Nama ditulis dengan huruf kecil di UI, metadata, manifest, dan aset brand. Tagline: **Atur uang, tanpa ribet.**

## Konsep: dua lengkung dan satu langkah kecil

Simbol m memakai dua lengkung membulat untuk memberi kesan ramah dan stabil. Titik pink menjadi aksen langkah kecil yang berkelanjutan, bukan indikator pencapaian pengguna. Semua SVG dibuat khusus melalui koordinat vektor. Wordmark SVG mollad juga berupa path, tidak bergantung font eksternal. Ikon memakai siluet sederhana dan tetap diperiksa pada ukuran kecil.

## Sistem visual

| Token   | Warna                     | Penggunaan                                                     |
| ------- | ------------------------- | -------------------------------------------------------------- |
| Primary | Soft Tosca #46B4A0        | Tombol utama, progres normal, grafik pemasukan, navigasi aktif |
| Pink    | Soft Pink #FFA6C1         | Kartu bantuan/feedback, aksen ikon, grafik pembanding, sorotan |
| Ink     | Medium Slate Teal #385A55 | Judul, teks utama, nominal, ikon                               |
| Mint    | Pale Mint #E7F7F4         | Sidebar, ringkasan saldo, trek progres                         |
| Blush   | Rose Blush #FFF0F2        | Informasi positif, kartu bantuan, feedback sukses              |

Tampilan terang menjadi default. Mode gelap opsional memakai turunan hijau, tanpa navy. Token terpusat di tailwind.config.ts dan src/app/globals.css; alias emerald dipetakan ke keluarga tosca untuk kompatibilitas komponen. Warna kategori yang sudah dipilih pengguna tidak diubah di database. Peringatan/error mempertahankan amber/merah agar maknanya jelas. Tidak ada streak atau prestasi buatan.

Kontras terhitung: #385A55 di putih 7,60:1 dan di Pale Mint 6,88:1. Sesuai preferensi pengguna, tulisan tombol serta teks/ikon di kartu pink memakai putih. Kombinasi putih dengan latar pastel bukan jaminan kontras AA untuk teks kecil; jangan menyatakan seluruh palet lolos AA. Grafik pembanding memakai garis putus-putus dan label, bukan warna saja.

## Kategori pada dua tema

Kategori tetap menyimpan satu warna dasar. `src/lib/category-colors.ts` menghasilkan dua warna tampilan: versi terang yang tetap terpisah dari permukaan putih dan versi dark mode yang lebih cerah. Kontras minimal 3:1 diuji untuk penanda grafis terhadap permukaan masing-masing tema; ini terpisah dari standar kontras teks. Warna tidak digunakan sebagai satu-satunya informasi karena nama kategori, nominal, dan persentase tetap tampil.

Variabel CSS pada `.category-color` mengganti warna secara langsung ketika tema berubah, tanpa menunggu JavaScript mendeteksi tema. Diagram donut, legenda, penanda transaksi, kategori, dan anggaran memakai pasangan yang sama. Form kategori memperlihatkan pratinjau kedua mode sebelum menyimpan. Warna dasar dan data historis tidak dimigrasikan atau diganti. Grafik arus kas menggunakan tosca/pink yang lebih pekat di light mode dan lebih terang di dark mode; tooltip, sumbu, serta label mengikuti warna teks tema.

Manrope melalui next/font/google untuk heading, wordmark React, dan teks. Heading menggunakan bobot 800 dan tracking rapat; teks transaksi memakai angka tabular. Logo React mewarisi warna teks tema, sedangkan simbol konsisten di dua tema.

## Penggunaan

Ruang kosong minimum seperempat tinggi simbol. Jangan merenggangkan rasio atau memakai latar ramai. logo-full-dark.svg untuk latar gelap; logo-mono.svg untuk cetak. Ikon maskable mempunyai simbol 288px di kanvas 512px, seluruh bentuk berada dalam safe zone pusat. Animasi loading hanya opacity dan translasi ringan serta dinonaktifkan pada prefers-reduced-motion.

Jalankan npm run icons untuk seluruh PNG dan ICO. logo-preview.png untuk inspeksi visual. favicon.ico berisi ukuran 16/32/48 dengan payload PNG.

### Aksen pink antarmuka

Pink diperluas ke kartu total saldo pada Ringkasan/Dompet, navigasi aktif desktop/HP, avatar, garis aksen kartu, dan ekspor Profil. Sidebar memakai Rose Blush agar hijau dan pink lebih seimbang. Permukaan pink utama memakai turunan rose #B84268–#96395F dengan konten putih; #FFA6C1 tetap dipakai pada detail pastel. Warna kategori pengguna dipertahankan. Tampilan diperiksa pada desktop terang dan HP gelap tanpa overflow; lint, TypeScript, dan 78 unit test lulus.

Pembaruan warna: pink utama diperhalus menjadi #F6B8CE, dengan gradient kartu #FFD5E3 → #F6B8CE dan hover #F0AAC4. Ini menggantikan rose gelap sebelumnya agar permukaan lebih pucat dan lembut. Konten putih mengikuti preferensi pengguna.

Kartu saldo kini memakai gradasi dominan putih #FFFFFF → #FFF6F9 → #FFE4EE. Pada permukaan hampir putih ini, teks/ikon menggunakan slate #385A55 (termasuk mode gelap) agar terbaca. Ini menggantikan gradasi pink pastel sebelumnya khusus kartu saldo.

Penyempurnaan terarah: kartu saldo dikembalikan ke gradient pink pastel #FFD5E3 → #F6B8CE dengan konten putih. Navigasi aktif memakai gradasi blush #FFF6F9 → #FFE4EE dengan teks mauve; mode gelap memiliki varian rose redup. Aksen atas kartu Pengeluaran/Arus Keuangan dipertipis menjadi 2px dengan pink pucat, dan ikon ringkasan memakai panel blush yang lebih lembut.

Navigasi aktif kini memakai pink pekat untuk teks, ikon, dan penanda atas di HP (#B92F65 pada tema terang, #FF91B9 pada tema gelap), dengan latar blush tetap lembut. Teks/ikon kartu saldo dikembalikan ke slate #385A55, sedangkan latar pink pastel tetap sama. Warna computed browser telah diperiksa pada kedua tema; format dan lint bersih.

### Palet aktif: terang hijau, gelap hitam-pink

Palet UI kini dibedakan per tema melalui token CSS bersama. Pada mode terang, tombol/logo, navigasi aktif, panel saldo, aksen kartu, dan grafik arus kas memakai keluarga hijau/mint. Pada mode gelap, latar utama #09090B dan permukaan kartu #151316 dipadukan dengan tombol pink #C44B7C, navigasi pink terang, dan panel saldo rose redup. Teks menyesuaikan kontras permukaannya. Warna kategori tetap mengikuti data pengguna dan pasangan warna kategori yang sudah ada.

Kelas aksen dinamai netral (accent-panel, balance-hero, accent-card) agar mengikuti tema. Logo React juga membaca warna tema. Aset SVG/ikon unduhan tetap memakai identitas merek yang tersimpan. Pemeriksaan browser mencakup halaman ruang pribadi, persistensi tema, warna logo/tombol/grafik, serta lebar 390px dan 1440px; tidak ada data Neon yang diubah.

Grafik arus kas memakai pasangan warna yang lebih berbeda: terang—Income #087F5B (hijau), Expense #C05A12 (jingga); gelap—Income #67E8F9 (cyan), Expense #FF8FB8 (pink). Kedua garis setebal 3px; Expense tetap putus-putus. Legenda mengikuti warna garis, dan uji browser memeriksa kontras minimum 3:1 terhadap permukaan grafik pada kedua tema.

Navigasi disempurnakan dengan menu desktop berbentuk pill, sidebar berujung membulat, serta navbar HP mengambang beradius 28px dengan inset tepi dan safe area. Penanda aktif tetap tanpa garis highlight. Jarak antar menu dan ikon lebih lapang, transisi menghormati reduced motion, dan target sentuh minimal 44px. Pengujian lebar 320/390/1440px lulus tanpa overflow.
