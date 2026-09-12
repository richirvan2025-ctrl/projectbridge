# Production Roadmap — ProjectBridge

> Dokumen kerja untuk mengubah MVP kompetisi menjadi produk yang layak dipakai
> nyata oleh kampus, mahasiswa, dan mitra. Prioritas mengikuti prinsip: amankan
> dulu, rapikan operasional, baru perluas fitur dan skala.

## 1. Konteks dan tujuan

ProjectBridge menang kompetisi dan akan mendapat pendanaan. MVP saat ini sudah
menyelesaikan alur inti (posting, lamaran, status, rating, sertifikat), tetapi
masih berisi asumsi demo yang berbahaya kalau langsung dipakai di production.

Tujuan roadmap ini:

- Menjadikan sistem aman dan patuh sebelum menyentuh data pengguna sungguhan.
- Menyiapkan fondasi yang memungkinkan lebih dari satu developer dan lebih dari
  satu environment tanpa regresi.
- Mengarahkan fitur berikutnya ke kebutuhan produk yang sebenarnya, bukan
  sekadar menambah permukaan aplikasi.

Status saat ini: MVP demo — belum siap production.

---

## 2. Prinsip pengambilan keputusan

1. Keamanan dan integritas data di atas kecepatan fitur.
2. Satu sumber kebenaran untuk skema database: tidak ada lagi tempel SQL manual
   di dashboard sebagai satu-satunya cara migrasi.
3. Setiap alur penting punya smoke-test otomatis sebelum rilis.
4. Lingkungan terpisah wajib: local, staging, production.
5. Data pribadi dipertahankan seminimal mungkin dan bisa dihapus/diekspor.

Rekomendasi pengurutan: Fase 0, Fase 1, Fase 2, Fase 3. Beberapa item bisa
berjalan paralel, tetapi Fase 0 bersifat blocking untuk produksi.

---

## 3. Fase 0 — Keamanan dan integritas data (blocking sebelum go-live)

Tujuan fase: tidak ada akun demo/backdoor, role tidak bisa diklaim sembarangan,
dan celah abuse yang paling umum sudah ditangani.

### 0.1 Pisahkan data demo dari production

- Dampak: tinggi.
- Masalah: seed demo menyentuh tabel auth langsung, membuat akun berpassword
  demo1234, dan dipakai untuk state demo.
- Aksi:
  - Pindahkan seed ke lokasi yang jelas bukan production.
  - Tambahkan guard environment agar seed demo menolak jalan di production.
  - Hapus akun demo dari production dan rotasi kredensial demo.
- Selesai jika: production tidak dapat berisi akun demo dan seed tidak bisa
  dijalankan tanpa sengaja ke production.

### 0.2 Verifikasi dan otorisasi role

- Dampak: tinggi.
- Masalah: siapa pun bisa signup sebagai partner, dan campus ditentukan hanya
  dari domain email.
- Aksi:
  - student: boleh self-service jika tetap berbasis email kampus.
  - partner: status pending sampai identitas/bisnis diverifikasi admin.
  - campus: pakai allowlist email atau flow approval; domain saja bukan izin.
  - Tambahkan status/verified_at di users dan sesuaikan RLS agar partner belum
    terverifikasi tidak bisa mengubah state proyek.
- Selesai jika: akun baru tidak langsung memiliki hak mutasi data sebelum
  diverifikasi.

### 0.3 Autentikasi yang lebih ketat

- Dampak: tinggi.
- Aksi:
  - Aktifkan konfirmasi email.
  - Naikkan kebijakan password ke 8-12 karakter, tolak password lemah.
  - Wajibkan MFA untuk campus; rekomendasikan MFA untuk partner.
  - Tentukan kebijakan sesi dan token yang jelas.
- Selesai jika: tidak ada akun tanpa verifikasi yang bisa mengubah data, dan
  akun privileged punya lapisan autentikasi kedua.

### 0.4 Rate limiting dan anti-abuse

- Dampak: tinggi.
- Aksi:
  - Batasi login, signup, dan reset password.
  - Batasi server action upload dan mutasi status.
  - Pertimbangkan reverse proxy/edge middleware atau rate limit Supabase.
- Selesai jika: brute-force manual atau alat sederhana tidak efektif dan upload
  tidak bisa dipakai untuk mengisi storage tanpa kendali.

### 0.5 Validasi upload dan kontrol akses file

- Dampak: tinggi.
- Masalah: ukuran dicek, tetapi tipe atau konten belum divalidasi ketat dan
  bucket portofolio publik.
- Aksi:
  - Validasi MIME/ekstensi dan deteksi konten dasar.
  - Ganti bucket publik dengan akses terbatas (signed URL atau policy).
  - Tambahkan batas kuota per user.
- Selesai jika: file tidak bisa dipakai sebagai vektor upload berbahaya dan URL
  portofolio tidak bocor ke publik.

### 0.6 Alur konversi SKS sungguhan

- Dampak: tinggi untuk nilai produk.
- Masalah: opsi konversi SKS hanya checkbox tampilan.
- Aksi:
  - Definisikan entitas pengajuan SKS, persyaratan jam kerja dan deliverable.
  - Buat flow persetujuan dosen atau koordinator.
  - Hubungkan sertifikat dengan bukti persetujuan.
- Selesai jika: konversi SKS punya status dan pihak yang bertanggung jawab,
  bukan sekadar label di kartu.

---

## 4. Fase 1 — Fondasi operasional

Tujuan fase: tim bisa mengembangkan, merilis, memantau, dan memulihkan sistem
dengan lebih dari satu environment tanpa bergantung pada langkah manual.

### 1.1 Migrasi database ter-versioning

- Aksi: adopsi Supabase CLI dan migration file dengan riwayat serta rollback.
- Selesai jika: file SQL manual tidak lagi menjadi jalur migrasi di production.

### 1.2 Environment terpisah dan CI/CD

- Aksi: buat staging dan production untuk Supabase dan Vercel; kunci production
  dari perubahan langsung.
- Pipeline: typecheck, lint, build, smoke test, deploy staging, generate
  migration, deploy production dengan approval.
- Selesai jika: rilis produksi konsisten, terdokumentasi, dan bisa diulang.

### 1.3 Observability

- Aksi: error tracking, logging terstruktur, monitoring uptime, dan ganti
  try/catch yang diam-diam dengan logging yang bisa ditelusuri.
- Selesai jika: kegagalan production menghasilkan sinyal, bukan hilang.

### 1.4 Automated test

- Aksi: unit/typecheck dan smoke-test E2E alur inti (posting, apply, terima,
  selesai, rating, sertifikat).
- Selesai jika: perubahan kecil tidak memutus alur inti tanpa terdeteksi CI.

### 1.5 Kepatuhan data pribadi (UU PDP Indonesia)

- Aksi: kebijakan privasi, dasar pemrosesan, consent, retensi, hak akses/hapus/
  ekspor, dan pembatasan akses berdasarkan kebutuhan peran.
- Selesai jika: ada dokumentasi kebijakan dan mekanisme teknis untuk hak subjek
  data, bukan hanya disclaimer.

### 1.6 Backup dan recovery

- Aksi: tentukan retention, jadwal backup, dan uji restore berkala.
- Selesai jika: restore pernah berhasil diuji di staging.

---

## 5. Fase 2 — Fitur yang hilang untuk pemakaian nyata

Tujuan fase: alur tidak lagi bergantung pada refresh manual dan komunikasi luar
sistem, serta luarannya dapat dipertanggungjawabkan secara formal.

### 2.1 Notifikasi

- Aksi: notifikasi in-app sebagai fondasi; email untuk kejadian penting
  (lamaran masuk, status berubah, proyek selesai); WhatsApp menyusul.
- Selesai jika: aktor tahu ada aksi menunggu tanpa membuka ulang halaman.

### 2.2 Sertifikat yang dapat diverifikasi

- Aksi: generate PDF, nomor unik, QR atau tautan verifikasi publik yang hanya
  berisi klaim terbatas.
- Selesai jika: kampus atau mitra bisa memeriksa keaslian sertifikat mandiri.

### 2.3 Komunikasi dan pelacakan proyek

- Aksi: ruang diskusi per proyek, milestone, deliverable, revisi, dan status
  kemajuan yang tercatat.
- Selesai jika: jejak proyek tidak hilang ke WhatsApp dan tim bisa melihat
  riwayat keputusan.

### 2.4 Admin dashboard fungsional

- Aksi: moderasi proyek, kelola user, suspensi akun, dan laporan dengan
  pagination atau filter server-side.
- Selesai jika: tim kampus tidak perlu menyentuh database untuk tugas harian.

### 2.5 Search dan pagination

- Aksi: ganti pencarian sederhana dengan Postgres full-text search, tambah
  pagination di daftar proyek dan dashboard kampus, serta cache yang aman.
- Selesai jika: penambahan data tidak membuat listing lambat atau berhenti.

### 2.6 Kompensasi terukur (opsional berdasar cakupan pendanaan)

- Aksi: status kompensasi yang bisa dilacak; escrow atau payment hanya jika
  produk betul-betul membutuhkan transaksi finansial.
- Selesai jika: kompensasi bukan sekadar teks bebas dan pihak terkait tahu
  statusnya.

---

## 6. Fase 3 — Skala dan keberlanjutan

Tujuan fase: produk bisa tumbuh ke lebih banyak kampus dan pengguna tanpa
merusak kualitas pengalaman di mobile.

### 3.1 Multi-kampus

- Aksi: model organisasi atau kampus, domain email per kampus, dan pemisahan
  data antar institusi dengan tetap memungkinkan laporan agregat.

### 3.2 Performance dan mobile-first

- Aksi: load testing, optimasi payload, pengukuran Core Web Vitals, dan uji
  pada jaringan seluler nyata.

### 3.3 Analitik produk

- Aksi: metrik konversi proyek, waktu penyelesaian, distribusi rating, dan
  retensi mahasiswa serta mitra.

### 3.4 Pencocokan cerdas

- Aksi: rekomendasi proyek berdasar skill, pengalaman, rating, dan riwayat
  penyelesaian.

---

## 7. Definition of Done untuk rilis production pertama

Sistem boleh disebut production-ready setelah memenuhi:

- Tidak ada seed atau akun demo di production.
- Role partner dan campus membutuhkan verifikasi atau approval.
- Konfirmasi email aktif dan kebijakan password diperketat.
- Bucket portofolio tidak publik dan upload divalidasi.
- Migrasi database versi terkontrol dan environment terpisah.
- CI/CD dan smoke test alur inti berjalan.
- Observability dan backup restore teruji.
- Kebijakan privasi dan retensi data tersedia.
- Admin dapat melakukan moderasi tanpa akses SQL langsung.

---

## 8. Metrik sukses

- Waktu dari posting proyek ke lamaran pertama yang diterima.
- Rasio lamaran ke diterima ke selesai.
- Waktu penyelesaian proyek.
- Kesalahan production yang terdeteksi dan waktu pulih rata-rata.
- Kepatuhan akses: tidak ada role tanpa verifikasi yang bisa memutasi data.
- Persentase sertifikat yang berhasil diverifikasi lewat tautan atau QR.

---

## 9. Open questions untuk diputuskan bersama kampus

- Apakah partner wajib badan usaha, atau boleh perorangan dengan portofolio?
- Siapa approver campus dan bagaimana mekanisme pemberian aksesnya?
- Berapa lama data lamaran atau portofolio harus disimpan setelah proyek selesai?
- Apakah kompensasi masuk ke inside scope produk atau tetap offline?
- Apakah produk akan langsung multi-kampus atau dimulai dengan satu kampus?

---

## 10. Titik mulai yang disarankan

Urutan kerja paling berdampak:

1. Pisahkan seed demo dari production.
2. Tambahkan status verifikasi role.
3. Aktifkan konfirmasi email.
4. Pindah ke migration ter-versioning dan CI.
5. Saat fondasi stabil, mulai notifikasi dan sertifikat verifiable.

