# ProjectBridge (MVP)

Marketplace internal kampus IDB Bali — mempertemukan mahasiswa dengan UMKM/studio
kreatif lokal untuk proyek riil yang fleksibel dan bisa dikonversi SKS.
Lihat `ProjectBridge_PRD.md` untuk PRD lengkap.

## Status: Milestone 1 — Setup + deploy kosong

- [x] Scaffold Next.js 14 (App Router, TypeScript, Tailwind)
- [x] Client Supabase (browser, server, middleware refresh sesi)
- [x] Landing page + `GET /api/health`
- [x] Skema SQL awal di `supabase/schema.sql` (dipakai di Milestone 2)
- [ ] `npm install && npm run dev` di laptop (sandbox AI memblokir npm registry)
- [ ] Isi `.env.local` dengan kredensial Supabase asli
- [ ] Deploy kosong ke Vercel

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

## Deploy kosong ke Vercel (menutup Milestone 1)

1. Push folder ini ke GitHub (repo baru, mis. `projectbridge`).
2. Di https://vercel.com/new — **Add New Project > Import** repo tersebut
   (Framework Preset otomatis terdeteksi Next.js).
3. Tambahkan Environment Variables:
   `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy** — pastikan URL produksi membuka landing page tanpa error.
   Pipeline sudah jalan: setiap push ke `main` auto-deploy.

## Struktur

```
app/                  # App Router: layout, landing page, /api/health
lib/supabase/         # client.ts (browser), server.ts, middleware.ts
middleware.ts         # refresh sesi Supabase tiap request
supabase/schema.sql   # skema users/projects/applications/ratings (Milestone 2)
```

## Milestone berikutnya (Milestone 2)

Autentikasi + skema database: halaman login mahasiswa/mitra, jalankan
`supabase/schema.sql` di SQL Editor, lalu kebijakan RLS per peran.
