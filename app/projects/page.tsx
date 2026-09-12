import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";
import {
  IconAcademicCap,
  IconArrowRight,
  IconBanknotes,
  IconCalendar,
  IconCheckCircle,
  IconFunnel,
  IconInbox,
  IconSearch,
  IconStorefront,
} from "@/components/icons";

export const metadata = { title: "Daftar Proyek — ProjectBridge" };

function formatDeadline(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// PostgREST mengembalikan relasi to-many sebagai array; normalisasi di sini
// agar aman walau tipe hasil query menganggapnya array.
function getPartnerBusinessName(partner: unknown): string | null {
  if (!partner || typeof partner !== "object") return null;
  const p = Array.isArray(partner) ? partner[0] : partner;
  if (!p || typeof p !== "object") return null;
  const business = (p as { business_name?: unknown }).business_name;
  return typeof business === "string" ? business : null;
}

// Chip info memakai ikon SVG (bukan emoji) — panduan ui-ux-pro-max.
function MetaChip({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
      {icon}
      {children}
    </span>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?: { prodi?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const prodi =
    typeof searchParams?.prodi === "string" ? searchParams.prodi.trim() : "";
  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";

  let query = supabase
    .from("projects")
    .select(
      `id, title, slug, description, prodi_target, compensation, deadline,
       sks_eligible, status, created_at, partner:users(name, business_name)`
    )
    .eq("status", "open");

  if (prodi) query = query.eq("prodi_target", prodi);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: projects } = await query.order("created_at", {
    ascending: false,
  });

  const hasFilter = Boolean(prodi) || Boolean(q);
  const total = projects?.length ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30">
            <IconFunnel className="h-3.5 w-3.5" />
            Marketplace Proyek
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Daftar Proyek Terbuka
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Proyek riil dari UMKM &amp; studio lokal IDB Bali — cari yang cocok
            untuk prodi Anda.
          </p>
          <p className="mt-4 text-sm text-white/80">
            <span className="font-semibold tabular-nums text-white">
              {total}
            </span>{" "}
            proyek terbuka{hasFilter ? " sesuai filter" : " saat ini"}
          </p>
        </div>
      </header>

      <form
        method="GET"
        action="/projects"
        className="mt-8 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
      >
        <div>
          <label
            htmlFor="q"
            className="block text-sm font-medium text-slate-700"
          >
            Cari judul
          </label>
          <div className="relative mt-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="cth: katalog, logo, web…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-slate-900 shadow-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="prodi"
            className="block text-sm font-medium text-slate-700"
          >
            Filter prodi
          </label>
          <select
            id="prodi"
            name="prodi"
            className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            defaultValue={prodi}
          >
            <option value="">Semua prodi</option>
            {PRODI_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <IconFunnel className="h-4 w-4" />
          Filter
        </button>

        {hasFilter && (
          <Link
            href="/projects"
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Hapus filter
          </Link>
        )}
      </form>

      {projects && projects.length > 0 ? (
        <ul className="mt-8 grid gap-5 md:grid-cols-2">
          {projects.map((p) => {
            const partnerName = getPartnerBusinessName(p.partner);
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="group flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-indigo-700">
                      {p.title}
                    </h2>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      <IconAcademicCap className="h-3.5 w-3.5" />
                      {p.prodi_target}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {p.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {p.sks_eligible && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">
                        <IconCheckCircle className="h-3.5 w-3.5" />
                        Bisa SKS
                      </span>
                    )}
                    {p.compensation && (
                      <MetaChip icon={<IconBanknotes className="h-3.5 w-3.5" />}>
                        {p.compensation}
                      </MetaChip>
                    )}
                    {p.deadline && (
                      <MetaChip icon={<IconCalendar className="h-3.5 w-3.5" />}>
                        Deadline {formatDeadline(p.deadline)}
                      </MetaChip>
                    )}
                    {p.partner && partnerName && (
                      <MetaChip icon={<IconStorefront className="h-3.5 w-3.5" />}>
                        {partnerName}
                      </MetaChip>
                    )}
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                    Lihat detail
                    <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <IconInbox className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold text-slate-700">
            Belum ada proyek cocok
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {hasFilter
              ? "Coba ganti filter atau kata kunci pencarian untuk melihat proyek lain."
              : "Belum ada proyek terbuka — datang kembali nanti."}
          </p>
          {hasFilter && (
            <Link
              href="/projects"
              className="mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Hapus filter
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
