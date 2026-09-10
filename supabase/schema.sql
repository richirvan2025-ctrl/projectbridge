-- ProjectBridge — skema database MVP (Milestone 6)
-- Jalankan di Supabase Dashboard > SQL Editor (tempel seluruh file, lalu Run).
-- Sesuai PRD §7: users, projects, applications, ratings.

-- 1) Tabel users (profil, terhubung ke auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'partner')),
  name text not null,
  email text not null,
  prodi text,
  business_name text,
  created_at timestamptz not null default now()
);

-- 2) Tabel projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null,
  prodi_target text not null,
  compensation text,
  deadline date,
  sks_eligible boolean not null default false,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed')),
  created_at timestamptz not null default now()
);

-- 3) Tabel applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  motivation_text text not null,
  portfolio_urls text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (project_id, student_id)
);

-- 4) Tabel ratings (dua arah setelah proyek selesai)
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- 5) Row Level Security — aktifkan
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.ratings enable row level security;


-- =============================================================================
-- MILESTONE 2: Trigger handle_new_user() + RLS policies
-- Idempoten: aman dijalankan berulang.
-- =============================================================================

-- 6) Trigger function: otomatis insert ke public.users ketika baris baru
--    di auth.users dibuat. Data profil diambil dari raw_user_meta_data
--    yang dikirim via supabase.auth.signUp({ options: { data: ... } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role, name, email, prodi, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'prodi',
    new.raw_user_meta_data->>'business_name'
  );
  return new;
end;
$$;

-- 7) Pasang trigger (drop dulu kalau ada, biar idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8) Helper function: kembalikan role user yang sedang login
--    Memudahkan penulisan RLS policy.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;


-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- users ----------------------------------------------------------------------
-- Lihat profil sendiri (untuk edit profil / halaman profil sendiri)
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Lihat profil user lain (untuk menampilkan nama mitra/mahasiswa di listing)
drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
  on public.users for select
  using (auth.role() = 'authenticated');

-- Insert oleh trigger saja — tidak ada policy insert => client tidak bisa
-- bypass. (security definer di handle_new_user() berjalan dengan hak owner.)

-- Update profil sendiri
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- projects -------------------------------------------------------------------
-- Semua authenticated boleh baca listing proyek
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
  on public.projects for select
  using (auth.role() = 'authenticated');

-- Mitra boleh insert proyek sendiri
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert
  with check (
    auth.uid() = partner_id
    and public.current_user_role() = 'partner'
  );

-- Mitra boleh update proyek sendiri
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = partner_id)
  with check (auth.uid() = partner_id);

-- Mitra boleh delete proyek sendiri
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = partner_id);


-- applications ----------------------------------------------------------------
-- Pelamar (mahasiswa) lihat application sendiri; mitra lihat pelamar di proyeknya
drop policy if exists "applications_select_own_or_partner" on public.applications;
create policy "applications_select_own_or_partner"
  on public.applications for select
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.partner_id = auth.uid()
    )
  );

-- Hanya mahasiswa yang boleh lamar, dan hanya untuk dirinya sendiri
drop policy if exists "applications_insert_student" on public.applications;
create policy "applications_insert_student"
  on public.applications for insert
  with check (
    student_id = auth.uid()
    and public.current_user_role() = 'student'
  );

-- Mitra pemilik proyek boleh update status (diterima/tolak)
drop policy if exists "applications_update_partner" on public.applications;
create policy "applications_update_partner"
  on public.applications for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.partner_id = auth.uid()
    )
  );

-- Mitra boleh delete pelamar di proyeknya (mis. menarik kembali undangan)
drop policy if exists "applications_delete_partner" on public.applications;
create policy "applications_delete_partner"
  on public.applications for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.partner_id = auth.uid()
    )
  );


-- ratings ---------------------------------------------------------------------
-- Semua authenticated boleh baca rating
drop policy if exists "ratings_select_authenticated" on public.ratings;
create policy "ratings_select_authenticated"
  on public.ratings for select
  using (auth.role() = 'authenticated');

-- User hanya bisa memberi rating atas namanya sendiri
drop policy if exists "ratings_insert_own" on public.ratings;
create policy "ratings_insert_own"
  on public.ratings for insert
  with check (from_user_id = auth.uid());


-- =============================================================================
-- MILESTONE 4: Storage bucket "portfolios" + policies
-- Jalankan berulang: aman (idempotent).
-- Bucket publik agar mahasiswa bisa lacens URL portofolio langsung dari browser.
-- =============================================================================

-- 9) Bucket storage untuk file portofolio lamaran
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

-- Upload: cualquier authenticated user boleh upload ke bucket portfolios
drop policy if exists "portfolio_files_insert" on storage.objects;
create policy "portfolio_files_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolios');

-- Select: siapa saja authenticated boleh baca metadata daftar file
drop policy if exists "portfolio_files_select" on storage.objects;
create policy "portfolio_files_select"
  on storage.objects for select
  using (bucket_id = 'portfolios');


-- =============================================================================
-- MILESTONE 6: Rating dua arah + sertifikat
-- Jalankan berulang: aman (idempotent).
-- =============================================================================

-- 10) Satu pengguna hanya boleh memberi satu rating per proyek.
--     Rating dua arah tetap bisa: mitra→mahasiswa dan mahasiswa→mitra
--     adalah dua baris berbeda (from_user_id berbeda).
create unique index if not exists "ratings_project_from_unique"
  on public.ratings (project_id, from_user_id);
