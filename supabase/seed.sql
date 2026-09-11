-- =============================================================================
-- ProjectBridge — DATA DEMO (Milestone 7)
-- Isi studi kasus UMKM untuk demo kompetisi.
-- JALANKAN SETELAH supabase/schema.sql di SQL Editor Supabase.
-- Idempoten: aman dijalankan berulang (tidak membuat data ganda).
--
-- Akun demo (sandi semua akun: demo1234):
--   Mitra     : mitra@warungwayan.id  (Warung Kopi Wayan)
--   Mitra     : mitra@studiobatik.id  (Studio Batik Sanur)
--   Mahasiswa : dewa@student.id       (DKV)
--   Mahasiswa : ayu@student.id        (Bisnis Digital)
--   Mahasiswa : gita@student.id       (Desain Interior)
--   Kampus    : kampus@idb-bali.ac.id (Admin Kampus IDB Bali)
-- =============================================================================

-- 1) Akun mitra (insert ke auth.users; trigger handle_new_user() otomatis
--    membuat profil di public.users). Sandi di-hash bcrypt.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, crypt('demo1234', gen_salt('bf')), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, u.meta, now(), now()
from (values
  (
    '11111111-1111-1111-1111-111111111101'::uuid,
    'mitra@warungwayan.id',
    '{"role":"partner","name":"Wayan Santoso","business_name":"Warung Kopi Wayan"}'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111102'::uuid,
    'mitra@studiobatik.id',
    '{"role":"partner","name":"Ni Luh Ayu Pratiwi","business_name":"Studio Batik Sanur"}'::jsonb
  )
) as u(id, email, meta)
where not exists (
  select 1 from auth.users a
  where a.id = u.id or a.email = u.email
);

-- 2) Akun mahasiswa
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, crypt('demo1234', gen_salt('bf')), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, u.meta, now(), now()
from (values
  (
    '22222222-2222-2222-2222-222222222201'::uuid,
    'dewa@student.id',
    '{"role":"student","name":"Dewa Putu Ananda","prodi":"DKV (Desain Komunikasi Visual)"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222202'::uuid,
    'ayu@student.id',
    '{"role":"student","name":"Kadek Ayu Lestari","prodi":"Bisnis Digital"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222203'::uuid,
    'gita@student.id',
    '{"role":"student","name":"Komang Gita Pratiwi","prodi":"Desain Interior"}'::jsonb
  )
) as u(id, email, meta)
where not exists (
  select 1 from auth.users a
  where a.id = u.id or a.email = u.email
);

-- 2b) Akun kampus (role otomatis 'campus' via trigger karena domain email;
--      JANGAN daftar lewat form signup publik — langsung tunjuk URL /login)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'authenticated', 'authenticated',
  'kampus@idb-bali.ac.id', crypt('demo1234', gen_salt('bf')), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"campus","name":"Admin Kampus IDB Bali"}'::jsonb,
  now(), now()
where not exists (
  select 1 from auth.users a
  where a.id = '00000000-0000-0000-0000-000000000001'::uuid
     or a.email = 'kampus@idb-bali.ac.id'
);

-- 3) Identitas email (diperlukan login email+password pada versi Supabase baru)
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), a.id, a.id::text, 'email',
  jsonb_build_object('sub', a.id::text, 'email', a.email),
  now(), now(), now()
from auth.users a
where a.email in (
  'mitra@warungwayan.id', 'mitra@studiobatik.id',
  'dewa@student.id', 'ayu@student.id', 'gita@student.id',
  'kampus@idb-bali.ac.id'
)
  and not exists (
    select 1 from auth.identities i
    where i.user_id = a.id and i.provider = 'email'
  )
on conflict (provider_id, provider) do nothing;

-- 3b) Lengkapi profil public.users yang hilang (kasus: akun demo sudah ada di
--     auth.users tapi dibuat sebelum trigger handle_new_user() dipasang,
--     sehingga profilnya tidak terbentuk). ID diambil dari baris auth yang ada.
insert into public.users (id, role, name, email, prodi, business_name)
select
  a.id,
  coalesce(a.raw_user_meta_data->>'role', 'student'),
  coalesce(a.raw_user_meta_data->>'name', split_part(a.email, '@', 1)),
  a.email,
  a.raw_user_meta_data->>'prodi',
  a.raw_user_meta_data->>'business_name'
from auth.users a
where a.email in (
  'mitra@warungwayan.id', 'mitra@studiobatik.id',
  'dewa@student.id', 'ayu@student.id', 'gita@student.id',
  'kampus@idb-bali.ac.id'
)
  and not exists (
    select 1 from public.users u where u.id = a.id or u.email = a.email
  );

-- 4) Proyek (4 status berbeda untuk demo penuh)
--    UUID mitra tetap (1111...) dipetakan ke ID yang ADA di database via email,
--    karena akun demo bisa punya UUID berbeda-beda.
with seed_partner_map (fixed_id, real_id) as (
  values
    ('11111111-1111-1111-1111-111111111101'::uuid, (select id from public.users where email = 'mitra@warungwayan.id')),
    ('11111111-1111-1111-1111-111111111102'::uuid, (select id from public.users where email = 'mitra@studiobatik.id'))
)
insert into public.projects (
  id, partner_id, title, description, prodi_target,
  compensation, deadline, sks_eligible, status, created_at
)
select
  p.id, pm.real_id, p.title, p.description, p.prodi_target,
  p.compensation, p.deadline::date, p.sks, p.status,
  now() - (p.days || ' days')::interval
from (values
  (
    '33333333-3333-3333-3333-333333333301'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    'Redesign Katalog Produk Warung Kopi Wayan',
    'Katalog produk kami (kopi bubuk, cold brew, pastry) masih berupa daftar
teks sederhana. Butuh redesign agar layak dibawa ke ritel dan pameran UMKM
Bali: 8–10 halaman, foto produk kami disediakan, gaya hangat dan lokal.',
    'DKV (Desain Komunikasi Visual)',
    'Rp 1.500.000 + konsumsi', '2026-10-30', true, 'open', 3
  ),
  (
    '33333333-3333-3333-3333-333333333302'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    'Konten Media Sosial 30 Hari untuk Studio Batik Sanur',
    'Butuh paket konten 30 hari (caption + desain carousel + reels sederhana)
untuk Instagram dan TikTok studio batik. Brief brand kami lengkap; moodboard
bisa didiskusikan tiap pekan.',
    'Bisnis Digital',
    'Rp 2.000.000', '2026-11-15', false, 'open', 5
  ),
  (
    '33333333-3333-3333-3333-333333333303'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    'Visualisasi 3D Booth Pameran Batik',
    'Booth 3x3 meter untuk pameran UMKM di Denpasar. Butuh visualisasi 3D
(dari 2 sudut) + denah sederhana agar tim bisa menyiapkan material booth
sebelum pameran bulan depan.',
    'Desain Interior',
    'Rp 2.500.000', '2026-11-01', true, 'in_progress', 10
  ),
  (
    '33333333-3333-3333-3333-333333333304'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    'Logo & Kemasan Kopi Bubuk “Subak”',
    'Produk baru kami: kopi bubuk “Subak”. Butuh logo + desain kemasan
(stand-up pouch 200g) siap cetak, termasuk varian warna untuk 3 tingkat
roasting. Proyek ini sudah selesai dikerjakan.',
    'DKV (Desain Komunikasi Visual)',
    'Rp 1.200.000', '2026-08-15', true, 'completed', 40
  )
) as p(id, partner_id, title, description, prodi_target, compensation, deadline, sks, status, days)
join seed_partner_map pm on pm.fixed_id = p.partner_id
where not exists (
  select 1 from public.projects x where x.id = p.id
);

-- 5) Lamaran (contoh semua status: masuk, diterima, ditolak)
--    UUID mahasiswa tetap (2222...) dipetakan ke ID yang ADA via email.
with seed_student_map (fixed_id, real_id) as (
  values
    ('22222222-2222-2222-2222-222222222201'::uuid, (select id from public.users where email = 'dewa@student.id')),
    ('22222222-2222-2222-2222-222222222202'::uuid, (select id from public.users where email = 'ayu@student.id')),
    ('22222222-2222-2222-2222-222222222203'::uuid, (select id from public.users where email = 'gita@student.id'))
)
insert into public.applications (
  project_id, student_id, motivation_text, portfolio_urls, status, created_at
)
select v.project_id, sm.real_id, v.motivation_text, v.portfolio_urls, v.status, v.created_at
from (
  values
  (
    '33333333-3333-3333-3333-333333333304'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    'Saya lulusan DKV yang fokus di identitas visual F&B. Portofolio saya
berisi redesign kemasan untuk 3 UMKM lokal, dan saya terbiasa menyerahkan
file siap cetak (AI + PDF) lengkap dengan guideline warna.',
    array[
      'https://placehold.co/800x600/png?text=Portofolio+Logo+Subak',
      'https://placehold.co/800x600/png?text=Kemasan+Kopi+200g'
    ],
    'accepted', now() - interval '35 days'
  ),
  (
    '33333333-3333-3333-3333-333333333304'::uuid,
    '22222222-2222-2222-2222-222222222202'::uuid,
    'Saya tertarik dengan proyek kemasan ini karena pernah mengerjakan
ilustrasi packaging minuman untuk event kampus. Siap revisi 2x.',
    array['https://placehold.co/800x600/png?text=Ilustrasi+Packaging'],
    'rejected', now() - interval '36 days'
  ),
  (
    '33333333-3333-3333-3333-333333333301'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    'Saya sudah pernah mengerjakan katalog UMKM (8 halaman) dan familiar
dengan alur cetak di percetakan Denpasar. Bisa mulai minggu ini.',
    array['https://placehold.co/800x600/png?text=Katalog+UMKM'],
    'pending', now() - interval '2 days'
  ),
  (
    '33333333-3333-3333-3333-333333333302'::uuid,
    '22222222-2222-2222-2222-222222222202'::uuid,
    'Saya mengelola akun Instagram UMKM dengan total 20 ribu pengikut, fokus
di konten carousel edukatif. Contoh konten saya ada di portofolio.',
    array['https://placehold.co/800x600/png?text=Konten+IG'],
    'pending', now() - interval '4 days'
  ),
  (
    '33333333-3333-3333-3333-333333333303'::uuid,
    '22222222-2222-2222-2222-222222222203'::uuid,
    'Spesialis saya visualisasi 3D interior/booth menggunakan SketchUp +
V-Ray. Portofolio booth pameran saya sudah 5 buah, termasuk pameran kriya
Bali 2025.',
    array[
      'https://placehold.co/800x600/png?text=Booth+Pameran+1',
      'https://placehold.co/800x600/png?text=Booth+Pameran+2'
    ],
    'accepted', now() - interval '9 days'
  )
) as v(project_id, student_id, motivation_text, portfolio_urls, status, created_at)
join seed_student_map sm on sm.fixed_id = v.student_id
on conflict (project_id, student_id) do nothing;

-- 6) Rating dua arah untuk proyek yang selesai (P4 — Kopi Subak)
--    Kedua sisi dipetakan ke ID yang ADA via email.
with seed_idmap (fixed_id, real_id) as (
  values
    ('11111111-1111-1111-1111-111111111101'::uuid, (select id from public.users where email = 'mitra@warungwayan.id')),
    ('22222222-2222-2222-2222-222222222201'::uuid, (select id from public.users where email = 'dewa@student.id'))
)
insert into public.ratings (
  project_id, from_user_id, to_user_id, stars, comment, created_at
)
select v.project_id, sp.real_id, ss.real_id, v.stars, v.comment, v.created_at
from (
  values
  (
    '33333333-3333-3333-3333-333333333304'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    5,
    'Desain rapi, komunikasi enak, tepat waktu. Kemasan Subak langsung kami
pakai untuk produksi pertama.',
    now() - interval '10 days'
  ),
  (
    '33333333-3333-3333-3333-333333333304'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid,
    '11111111-1111-1111-1111-111111111101'::uuid,
    4,
    'Mitra komunikatif dan brief jelas. Revisi sedikit lambat karena toko
sedang ramai, tapi hasilnya memuaskan.',
    now() - interval '9 days'
  )
) as v(project_id, from_user_id, to_user_id, stars, comment, created_at)
join seed_idmap sp on sp.fixed_id = v.from_user_id
join seed_idmap ss on ss.fixed_id = v.to_user_id
on conflict (project_id, from_user_id) do nothing;