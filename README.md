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

### Milestone 3 — Posting + listing proyek 🚧

- [x] Server Action `createProjectAction` + form posting proyek (sisi mitra)
- [x] Halaman `/dashboard/new` (mitra saja) + tombol "+ Posting Proyek"
- [x] Dashboard mitra menampilkan daftar proyek milik mitra (badge status)
- [x] Listing `/projects` dengan filter prodi + pencarian judul (GET form)
- [x] Dashboard mahasiswa menampilkan 5 proyek cocok (prodi) + link ke listing
- [ ] Uji alur posting di localhost (isi proyek dummy lalu cek `/projects`)

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

## Setup database (Milestone 2)

1. Buka **SQL Editor** di Supabase Dashboard.
2. Tempel seluruh isi `supabase/schema.sql` (sekarang sudah berisi trigger +
   RLS policies).
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
  projects/                   # listing + form posting proyek (Milestone 3)
    actions.ts                # createProjectAction (server action)
    new-project-form.tsx      # form posting proyek (client)
    page.tsx                  # /projects — listing + filter
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

## Milestone berikutnya (Milestone 4)

Detail proyek + form lamaran (upload portofolio maks 3 file + kolom alasan).
