# PRD — ProjectBridge (MVP)

## 1. Ringkasan

ProjectBridge adalah marketplace internal kampus IDB Bali yang mempertemukan mahasiswa (DKV, Bisnis Digital, Desain Interior, Desain Mode, Arsitektur) dengan UMKM dan studio kreatif lokal untuk mengerjakan proyek riil berskala kecil-menengah, sebagai alternatif magang formal yang lebih fleksibel dan bisa dikonversi SKS.

Dokumen ini mendefinisikan scope MVP untuk didemokan di kompetisi inovasi kampus internal IDB Bali.

## 2. Tujuan

- Menunjukkan alur end-to-end: mitra posting proyek → mahasiswa apply → proyek berjalan → rating & sertifikat.
- Bisa didemokan dengan 2–3 studi kasus nyata dari UMKM binaan inkubator bisnis kampus.
- Dibangun cukup cepat untuk timeline kompetisi (target: fungsional dalam hitungan hari, bukan minggu).

## 3. Target pengguna

| Peran | Deskripsi |
|---|---|
| Mahasiswa | Mencari dan mengajukan diri ke proyek riil sesuai prodi |
| Mitra (UMKM/studio) | Memposting kebutuhan proyek dan meninjau pelamar |
| Admin (opsional, bisa manual di MVP) | Memverifikasi proyek yang bisa dikonversi SKS |

## 4. Scope MVP (in scope)

1. **Autentikasi sederhana** — login sebagai mahasiswa atau mitra (email/password atau magic link).
2. **Posting proyek** (sisi mitra) — form: judul, deskripsi, prodi yang dicari, kompensasi, deadline, opsi "bisa dikonversi SKS".
3. **Listing proyek** (sisi mahasiswa) — daftar proyek dengan filter prodi dan pencarian judul.
4. **Detail proyek + form apply** — deskripsi lengkap, upload portofolio singkat (maks 3 file), kolom alasan singkat.
5. **Dashboard mitra** — melihat daftar pelamar per proyek, menandai proyek sebagai selesai.
6. **Rating dua arah** — setelah proyek ditandai selesai, mitra dan mahasiswa saling memberi rating bintang + komentar singkat.
7. **Sertifikat digital sederhana** — tampilan kartu (bukan PDF generator otomatis) berisi nama proyek, jam kerja (input manual), dan nama mahasiswa, yang bisa di-screenshot.

## 5. Di luar scope MVP (out of scope)

- Payment gateway (kompensasi diatur manual/offline antar mitra-mahasiswa)
- Sistem verifikasi dosen otomatis (cukup checkbox "diajukan untuk SKS", proses verifikasi tetap manual/offline dulu)
- Notifikasi otomatis via WhatsApp/email (bisa menyusul di tahap berikutnya)
- Generate PDF sertifikat otomatis
- Multi-bahasa

## 6. Alur pengguna utama (user flow)

```
Mitra login → Posting proyek baru → Proyek tampil di listing
Mahasiswa login → Cari/filter proyek → Buka detail → Apply dengan portofolio
Mitra → Lihat daftar pelamar → (koordinasi di luar sistem) → Tandai proyek selesai
Mitra & Mahasiswa → Saling beri rating → Sertifikat digital muncul di profil mahasiswa
```

## 7. Data model (garis besar)

**users**
- id, role (`student` | `partner`), name, email, prodi (untuk student), business_name (untuk partner)

**projects**
- id, partner_id, title, description, prodi_target, compensation, deadline, sks_eligible (boolean), status (`open` | `in_progress` | `completed`)

**applications**
- id, project_id, student_id, motivation_text, portfolio_urls (array), status (`pending` | `accepted` | `rejected`)

**ratings**
- id, project_id, from_user_id, to_user_id, stars (1–5), comment

## 8. Tech stack yang direkomendasikan

- **Frontend + backend**: Next.js (App Router), di-deploy ke **Vercel**
- **Database + auth + storage**: Supabase (Postgres, auth bawaan, storage untuk file portofolio)
- **Styling**: Tailwind CSS
- **Deployment**: push ke GitHub → auto-deploy via Vercel

## 9. Non-functional requirements

- Harus bisa diakses dari HP (mahasiswa kemungkinan besar apply lewat HP)
- Loading listing proyek < 2 detik untuk data dummy/kecil
- Tidak perlu skala besar — cukup untuk demo dan pilot 1 kelas

## 10. Kriteria sukses untuk demo kompetisi

- Bisa menjalankan 1 skenario penuh secara live: posting → apply → selesai → rating → sertifikat muncul, memakai 1 studi kasus UMKM nyata.
- Tidak ada error saat alur dijalankan di depan juri.
- Tampilan cukup rapi untuk dilihat di layar presentasi (desktop) maupun didemokan di HP.

## 11. Milestone pengerjaan (saran)

1. Setup project Next.js + Supabase + deploy kosong ke Vercel (pastikan pipeline jalan dari awal)
2. Autentikasi + skema database
3. Posting proyek + listing proyek
4. Detail proyek + form apply + upload file
5. Dashboard mitra + tandai selesai
6. Rating dua arah + tampilan sertifikat
7. Isi data dengan studi kasus nyata + uji coba alur penuh
8. Polish tampilan untuk demo
