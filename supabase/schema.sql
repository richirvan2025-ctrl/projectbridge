-- ProjectBridge — skema database MVP (Milestone 2)
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

-- 5) Row Level Security (MVP: aktifkan; kebijakan detail menyusul di Milestone 2)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.applications enable row level security;
alter table public.ratings enable row level security;
