# ProjectBridge (MVP)

Marketplace internal kampus IDB Bali — mempertemukan mahasiswa dengan UMKM/studio
kreatif lokal untuk proyek riil yang fleksibel dan bisa dikonversi SKS.
Lihat `ProjectBridge_PRD.md` untuk PRD lengkap.

## Status

### Milestone 1 — Setup + deploy kosong ✅

- [x] Scaffold Next.js 14 (App Router, TypeScript, Tailwind)
- [x] Client Supabase (browser, server, middleware refresh sesi)
- [x] Landing page + `GET /api/health`
- [x] Skema SQL awal di `supabase/schema.sql` (extended di Milestone 2)
- [x] Deploy kosong ke Vercel

### Milestone 2 — Autentikasi + database ✅

- [x] Halaman `/login` dan `/signup` (multi-step: pilih peran → form kondisional)
- [x] Server Actions `signIn`, `signUp`, `signOut`
- [x] Trigger `handle_new_user()` — profil di `public.users` dibuat otomatis dari `raw_user_meta_data`
- [x] RLS policies per peran (mahasiswa/mitra) di 4 tabel
- [x] Middleware proteksi `/dashboard` (wajib partner) dan `/student` (wajib student)
- [x] `SiteHeader` global dengan tombol Masuk/Daftar + sapaan + sign-out
- [ ] Uji alur signup/login di localhost (lihat langkah di bawah)

### Milestone 3 — Posting + listing proyek ✅

- [x] Server Action `createProjectAction` + form posting proyek (sisi mitra)
- [x] Halaman `/dashboard/new` (mitra saja) + tombol "+ Posting Proyek"
- [x] Dashboard mitra menampilkan daftar proyek milik mitra (badge status)
- [x] Listing `/projects` dengan filter prodi + pencarian judul (GET form)
- [x] Dashboard mahasiswa menampilkan 5 proyek cocok (prodi) + link ke listing
- [ ] Uji alur posting di localhost (isi proyek dummy lalu cek `/projects`)

### Milestone 4 — Detail proyek + lamaran ✅

- [x] Halaman `/projects/[id]` — deskripsi lengkap, kompensasi, deadline, prodi, partner
- [x] Server Action `applyProjectAction` — upload portofolio maks 3 file ke Storage +
  simpan URL di `applications.portfolio_urls`
- [x] Form lamaran: kolom alasan (min. 20 karakter) + file input (PDF/JPG/PNG/WEBP/GIF, 5 MB each)
- [x] Proteksi anti-duplikat (1 student = 1 lamaran/proyek) + anti-lamaran proyek tidak terbuka
- [x] Storage bucket `portfolios` (publik) + RLS policies di `supabase/schema.sql`
- [ ] Uji alur lamaran di localhost (upload portofolio dummy → cek storage + `applications`)

### Milestone 5 — Dashboard mitra ✅

- [x] Halaman `/dashboard/projects/[id]` — daftar pelamar per proyek (nama, prodi,
  email, alasan, portofolio, status, tanggal)
- [x] Server Action `updateApplicationStatusAction` — mitra diterima/tolak lamaran
- [x] Server Action `updateProjectStatusAction` — tandai proyek berjalan/selesai/buka kembali
- [x] Dashboard mitra menampilkan jumlah pelamar per proyek + link "tinjau lamaran"
- [x] Detail proyek (publik) menampilkan tombol "Kelola pelamar" bagi pemilik proyek
- [ ] Uji alur lamaran tetap (lamar → mitra diterima/tolak → tandai selesai)

### Milestone 6 — Rating dua arah + sertifikat digital 🚧

- [x] Server Action `submitRatingAction` — bintang 1–5 + komentar, hanya setelah
  proyek ditandai selesai
- [x] Dua arah: mitra menilai setiap pelamar berstatus diterima; mahasiswa yang
  diterima menilai mitra
- [x] Anti rating ganda — pengecekan kode + unique index
  `ratings_project_from_unique` di `supabase/schema.sql`
- [x] Form rating bintang interaktif (`rating-form.tsx`) di dashboard mitra &
  detail proyek
- [x] Kartu sertifikat digital (`certificate-card.tsx`) — nama mahasiswa, judul
  proyek, mitra, jam kerja input manual, rating mitra — siap screenshot
- [x] Dashboard mahasiswa: section "Proyek selesai" dengan link sertifikat
- [ ] Uji alur rating + sertifikat di localhost

## Cara menjalankan (di laptop Anda)

```bash
cd C:\PROJECTS\projectbridge   # sesuaikan path folder ini
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
npm run dev                    # buka http://localhost:3000
```

Cek kesehatan: buka `http://localhost:3000/api/health` — harus mengembalikan
`{"ok": true, ...}`.

## Sambungkan Supabase

1. Buat project gratis di https://supabase.com/dashboard (region Singapore
   paling dekat ke Bali).
2. Buka **Project Settings > API**, salin **Project URL** dan **anon public key**.
3. Tempel ke `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL=...` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`.
4. Restart `npm run dev` — badge di landing page berubah jadi
   "Supabase terhubung".

## Setup database (Milestone 2 + 4)

1. Buka **SQL Editor** di Supabase Dashboard.
2. Tempel seluruh isi `supabase/schema.sql` (berisi trigger, RLS policies,
   dan storage bucket `portfolios`).
3. Klik **Run**. Tidak ada output error → schema siap.
4. **Authentication > Providers > Email**: matikan toggle **Confirm email**
   (agar signup langsung aktif untuk demo lokal tanpa SMTP).

## Uji alur Milestone 2

1. Buka `http://localhost:3000` — badge harus "Supabase terhubung", tombol
   Masuk/Daftar muncul di header.
2. **Signup mahasiswa**: klik Daftar → pilih "Mahasiswa" → isi nama, email
   baru, password, prodi → submit. Otomatis masuk ke `/student`.
3. **Cek di Dashboard Supabase > Table Editor > `users`**: baris baru
   muncul dengan `role='student'`, `prodi` benar.
4. **Sign out** (tombol "Keluar" di header), lalu ulangi signup sebagai
   Mitra. Otomatis masuk ke `/dashboard`.
5. **Tes proteksi**: sign out → akses `/dashboard` → harus redirect ke
   `/login`. Login sebagai mahasiswa → akses `/dashboard` → harus redirect
   ke `/student`.

## Uji alur Milestone 3

1. Login sebagai **Mitra** → dashboard mitra menampilkan tombol
   **"+ Posting Proyek"** → buka `/dashboard/new`.
2. Isi form (judul, deskripsi ≥ 20 karakter, prodi tujuan, kompensasi,
   deadline, opsi SKS) → submit → redirect ke `/dashboard?created=1` dan
   proyek muncul di daftar "Proyek Anda".
3. Pindah akun sebagai **Mahasiswa** → `/student` menampilkan 5 proyek yang
   cocok dengan prodi Anda → klik **"Lihat semua proyek"** → `/projects`
   dengan filter prodi + pencarian judul.
4. Cek di Table Editor Supabase: baris baru di tabel `projects` dengan
   `partner_id` = id mitra.
5. Tes filter `/projects` (get): pilih prodi lain / ketik kata kunci judul →
   URL berubah (`?prodi=...&q=...`) dan daftar menyesuaikan.

## Uji alur Milestone 4

1. Login sebagai **Mahasiswa** → buka `/projects` → klik judul proyek → detail
   tampil (deskripsi, kompensasi, deadline, prodi, mitra).
2. Di detail, isi form **Lamaran Anda**: alasan ≥ 20 karakter + upload 1–3
   file (PDF/PNG/JPG max 5 MB) → submit.
3. Redirect ke `/projects/[id]?applied=1` dengan badge "Lamaran berhasil disend".
4. Cek Supabase: tabel `applications` berisi baris baru (`status='pending'`,
   `portfolio_urls` array URL `/storage/v1/object/public/portfolios/...`).
5. Cek **Storage > Buckets > portfolios** — file taha.
6. **Tes anti-duplikat**: buka detail kembali → tombol lamaran sudah ganti
   dengan "🎉 Anda sudah melamar proyek ini."
7. **Tes proteksi role**: login sebagai Mitra → buka detail proyek sendiri →
   informasi "Ini proyek yang Anda post" (lamaran bukan bagi mitra).

## Uji alur Milestone 5

1. Login sebagai **Mitra** → dashboard menampilkan jumlah pelamar per proyek →
   klik tombol "👥 N pelamar — tinjau lamaran" (o buka
   `/dashboard/projects/[id]`).
2. Pelamar dengan status **Masuk** berisi 2 tombol: **✓ Diterima** dan
   **✕ Tolak**. Klik satu → banner "Perubahan berhasil disimpan" dan badge
   status ganti.
3. Section **Status proyek**: klik **▶ Tandai Berjalan** → badge proyek ganti;
   klik **✅ Tandai Selesai** → proyek tidak terbuka untuk lamaran.
4. Cek sisi mahasiswa: detail proyek yang sudah selesai → "Lamaran tidak terbuka
   lagi". Proyek yang selesai tidak tampil lagi di listing `/projects` (filter
   open).
5. **Tes proteksi**: login sebagai mahasiswa → buka `/dashboard/projects/[id]` →
   redirect ke `/dashboard`→`/student` (middleware role).

## Uji alur Milestone 6

1. Jalankan ulang `supabase/schema.sql` di SQL Editor (membuat unique index
   `ratings_project_from_unique`).
2. Selesaikan alur M5: lamaran mahasiswa di-**Diterima** mitra, lalu proyek
   di-**Tandai Selesai**.
3. **Rating oleh mitra**: buka `/dashboard/projects/[id]` → kartu pelamar
   diterima kini menampilkan form rating (klik bintang ★ 1–5 + komentar) →
   klik **Kirim Rating** → tampil "Anda menilai: ★★★★☆".
4. **Rating oleh mahasiswa**: buka detail proyek sebagai mahasiswa → section
   "Rating dua arah" → beri rating ke mitra → banner "Rating berhasil
   terkirim".
5. **Sertifikat**: di detail proyek mahasiswa (lamaran diterima + proyek
   selesai), kartu sertifikat tampil — isi **jam kerja** manual lalu
   screenshot kartunya.
6. Cek tabel `ratings`: dua baris (mitra→mahasiswa dan mahasiswa→mitra) dengan
   `stars` 1–5 dan `comment`.
7. **Tes anti-duplikat**: coba kirim rating kedua → form sudah diganti tampilan
   "Anda menilai: ★..." (dan dibenturkan unique index di database).

## Struktur

```
app/                          # App Router
  (auth)/                     # route group untuk halaman auth (tidak ada di URL)
    actions.ts                # Server Actions signIn/signUp/signOut
    login/                    # /login
    signup/                   # /signup
  api/health/                 # GET /api/health
  dashboard/page.tsx          # /dashboard (mitra, role-protected)
  dashboard/new/page.tsx      # /dashboard/new — form posting proyek (mitra)
  dashboard/projects/[id]/page.tsx  # /dashboard/projects/[id] — kelola pelamar (M5)
  projects/                   # listing + form posting proyek (Milestone 3)
    actions.ts                # createProjectAction + applyProjectAction (server action)
    new-project-form.tsx      # form posting proyek (client)
    page.tsx                  # /projects — listing + filter
    [id]/page.tsx             # /projects/[id] — detail + lamaran (Milestone 4)
    [id]/apply-form.tsx       # form lamaran (client: alasan + upload portofolio)
    rating-form.tsx           # form rating bintang 1–5 + komentar (Milestone 6)
    certificate-card.tsx      # kartu sertifikat digital (jam kerja manual)
  student/page.tsx            # /student (mahasiswa, role-protected)
  layout.tsx                  # root layout + SiteHeader
  page.tsx                    # landing page
components/
  site-header.tsx             # header global (logo, login/dashboard/sign-out)
lib/supabase/
  client.ts                   # browser client
  server.ts                   # server client (cookies)
  middleware.ts               # session refresh + route protection
middleware.ts                 # jalankan updateSession di setiap request
supabase/schema.sql           # 4 tabel + trigger + RLS policies
```

## Milestone berikutnya (Milestone 7–8)

Isi data dengan studi kasus UMKM nyata, uji alur penuh end-to-end, dan
rapikan tampilan untuk demo kompetisi.
