import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";

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
      `id, title, description, prodi_target, compensation, deadline,
       sks_eligible, status, created_at, partner:users(name, business_name)`
    )
    .eq("status", "open");

  if (prodi) query = query.eq("prodi_target", prodi);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: projects } = await query.order("created_at", {
    ascending: false,
  });

  const hasFilter = Boolean(prodi) || Boolean(q);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl">
        <h1 className="text-3xl font-extrabold">Daftar Proyek Terbuka</h1>
        <p className="mt-2 text-white/90">
          Proyek riil dari UMKM &amp; studio lokal IDB Bali — cari yang cocok
          untuk prodi Anda.
        </p>
      </header>

      <form
        method="GET"
        action="/projects"
        className="mt-8 flex flex-wrap items-end gap-4"
      >
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
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

        <div>
          <label htmlFor="q" className="block text-sm font-medium text-slate-700">
            Cari judul
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="cth: katalog, logo, web…"
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Filter
        </button>

        {hasFilter && (
          <Link
            href="/projects"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sesip filter
          </Link>
        )}
      </form>

      {projects && projects.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {projects.map((p) => {
            const partnerName = getPartnerBusinessName(p.partner);
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="text-lg font-bold text-slate-900 hover:text-indigo-700"
                >
                  {p.title}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.description}
                </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-medium text-indigo-700">
                  {p.prodi_target}
                </span>
                {p.sks_eligible && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-700">
                    Bisa SKS
                  </span>
                )}
                {p.compensation && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                    💰 {p.compensation}
                  </span>
                )}
                {p.deadline && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                    🗓️ Deadline: {formatDeadline(p.deadline)}
                  </span>
                )}
                {p.partner && partnerName && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                    🏪 {partnerName}
                  </span>
                )}
              </div>
            </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">Belum ada proyek cocok</p>
          <p className="mt-1 text-sm">
            {hasFilter
              ? "Coba ganti filter atau kata kunci pencarian untuk melihat proyek lain."
              : "Belum ada proyek terbuka — datang kembali nanti."}
          </p>
        </section>
      )}
    </main>
  );
}