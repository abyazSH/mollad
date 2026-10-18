# UI dan UX M

Lampiran pengguna membahas AI slop, bukan rubrik desain atau hasil riset pengguna. Arah perbaikan yang diterapkan: setiap elemen harus membantu membaca data, mengambil tindakan, atau memahami hasil tindakan. Efektivitas pada pengguna nyata belum diukur melalui usability testing.

## Perubahan

- Ringkasan membedakan total saldo saat ini (semua dompet) dari pemasukan, pengeluaran, dan selisih untuk bulan laporan. Nama bulan ditampilkan juga ketika pengguna memilih bulan lampau.
- Pengguna tanpa dompet mendapat langkah pertama yang jelas beserta tombol tambah dompet.
- Slogan berulang diganti penjelasan fungsi, periode grafik, dan langkah yang bisa dilakukan. Identitas warna dan logo M dipertahankan.
- Transaksi memakai kartu di layar kecil dan tabel di desktop. Kartu menampilkan tipe transaksi dalam teks, tanggal, kategori, dompet, nominal, serta aksi ubah/hapus.
- Label filter tetap terlihat. Hasil kosong membedakan belum ada transaksi dari pencarian tanpa hasil dan menyediakan tindakan lanjutan.
- Pada HP, pencarian selalu terlihat dan filter tambahan dapat dilipat agar daftar transaksi lebih cepat dijangkau. Pilihan filter tetap terisi saat panel dibuka kembali.
- Area awal scan lebih ringkas, tombol pilih foto/kamera sejajar, dan pratinjau menyesuaikan tinggi layar. Header mengikuti guliran pada HP; ruang bawah memperhitungkan navigasi dan safe area.
- Input seluler memakai ukuran teks 16 px untuk menghindari zoom otomatis saat fokus pada browser HP yang memicunya.
- Tombol utama dan tombol ikon memiliki tinggi minimal 44 px. Navigasi aktif memiliki penanda garis selain warna; fokus pemilih foto terlihat saat memakai keyboard.
- Scan menggunakan tahapan berurutan dengan penanda langkah saat ini, informasi format/ukuran, nama file, tombol hapus foto, serta tautan pencatatan manual.
- Foto yang sudah dipilih tetap tersedia jika pemilihan file dibatalkan atau file pengganti tidak valid. Foto hanya untuk review; memuat ulang halaman memerlukan unggah ulang.
- Error jaringan pada autentikasi dan scan ditampilkan dalam Bahasa Indonesia.
- Peringatan anggaran menjelaskan saat mendekati batas dan nominal kelebihan anggaran.

## Pemeriksaan

Lint, TypeScript, unit test, format, serta pemeriksaan browser untuk desktop, mode gelap, dan layar 320/390 px. Pemeriksaan browser komponen memakai data contoh terisolasi ketika Neon tidak dapat diakses; ini tidak membuktikan alur transaksi dengan database produksi. Preview tersimpan lokal di `.cache/previews/` dan tidak masuk Git.

Pemeriksaan mencakup periode laporan lampau, petunjuk dompet pertama, kartu transaksi seluler, overflow horizontal, penghapusan foto sebelum scan, dan pesan autentikasi saat jaringan terputus. Tidak ada perubahan data pengguna di Neon dalam pemeriksaan ini.
