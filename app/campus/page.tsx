import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";
import { PrintButton } from "./print-button";

export const metadata = { title: "Dashboard Kampus — ProjectBridge" };

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  prodi_target: string;
  sks_eligible: boolean;
  created_at: string;
  partner_id: string;
};

type ApplicationRow = {
  id: string;
  status: string;
  student_id: string;
  project_id: string;
  created_at: string;
};

type UserRow = {
  id: string;
  role: string;
  name: string;
  email: string;
  prodi: string | null;
  business_name: string | null;
  created_at: string;
};

type RatingRow = {
  id: string;
  stars: number;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  open: { label: "Terbuka", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "Berjalan", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", className: "bg-slate-200 text-slate-600" },
};

const APP_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Masuk", className: "bg-sky-100 text-sky-700" },
  accepted: { label: "Diterima", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
};

function formatDate(iso: string) {
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

export default async function CampusPage({
  searchParams,
}: {
  searchParams?: { prodi?: string; status?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  // Safety: hanya role campus yang boleh buka monitoring kampus
  if (profile?.role !== "campus") {
    redirect(profile?.role === "partner" ? "/dashboard" : "/student");
  }

  const [
    { data: usersData },
    { data: projectsData },
    { data: appsData },
    { data: ratingsData },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, name, email, prodi, business_name, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select(
        "id, title, status, prodi_target, sks_eligible, created_at, partner_id"
      )
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("id, status, student_id, project_id, created_at"),
    supabase.from("ratings").select("id, stars"),
  ]);

  const users: UserRow[] = (usersData ?? []) as unknown as UserRow[];
  const projects: ProjectRow[] = (projectsData ?? []) as unknown as ProjectRow[];
  const applications: ApplicationRow[] =
    (appsData ?? []) as unknown as ApplicationRow[];
  const ratings: RatingRow[] = (ratingsData ?? []) as unknown as RatingRow[];

  const students = users.filter((u) => u.role === "student");
  const partners = users.filter((u) => u.role === "partner");
  const studentsAktif = new Set(applications.map((a) => a.student_id)).size;

  const countOpen = projects.filter((p) => p.status === "open").length;
  const countInProgress = projects.filter(
    (p) => p.status === "in_progress"
  ).length;
  const countCompleted = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const mitraAktif = new Set(projects.map((p) => p.partner_id)).size;

  const countPending = applications.filter((a) => a.status === "pending").length;
  const countAccepted = applications.filter((a) => a.status === "accepted").length;
  const countRejected = applications.filter((a) => a.status === "rejected").length;

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
      : 0;
  const sksEligible = projects.filter((p) => p.sks_eligible).length;

  const prodiFilter =
    typeof searchParams?.prodi === "string" ? searchParams.prodi.trim() : "";
  const statusFilter =
    typeof searchParams?.status === "string" ? searchParams.status.trim() : "";

  // Laporan 1: mahasiswa terdaftar per prodi (sesuai permintaan kampus)
  const studentIdsWithApplication = new Set(
    applications.map((a) => a.student_id)
  );

  const prodiRows = PRODI_OPTIONS.map((prodi) => {
    const mhs = students.filter((s) => (s.prodi ?? "").trim() === prodi);
    const mhsIds = new Set(mhs.map((s) => s.id));
    const proj = projects.filter((p) => p.prodi_target === prodi);
    const lamar = applications.filter(
      (a) => proj.some((p) => p.id === a.project_id) || mhsIds.has(a.student_id)
    );
    return {
      prodi,
      mahasiswa: mhs.length,
      mahasiswaAktif: mhs.filter((s) => studentIdsWithApplication.has(s.id))
        .length,
      proyek: proj.length,
      lamaran: lamar.length,
    };
  });

  // Laporan 2: mitra + kontribusinya
  const partnerRows = partners.map((m) => {
    const own = projects.filter((p) => p.partner_id === m.id);
    const ownIds = new Set(own.map((p) => p.id));
    const pelamar = applications.filter((a) => ownIds.has(a.project_id));
    return {
      id: m.id,
      businessName: m.business_name ?? m.name,
      email: m.email,
      proyek: own.length,
      proyekSelesai: own.filter((p) => p.status === "completed").length,
      pelamar: pelamar.length,
      diterima: pelamar.filter((a) => a.status === "accepted").length,
    };
  });

  const shownProjects = projects.filter((p) => {
    if (prodiFilter && p.prodi_target !== prodiFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const hasFilter = Boolean(prodiFilter) || Boolean(statusFilter);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30">
            🏫 Dashboard Kampus
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Halo, {profile?.name ?? "Admin Kampus"}
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            Monitoring &amp; pelaporan (read-only): mahasiswa terdaftar per
            prodi, proyek yang ditawarkan mitra, status proyek, lamaran, serta
            rating dua arah.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrintButton />
            <span className="text-xs text-white/70">
              Data diperbarui langsung dari aktivitas mahasiswa, mitra, dan
              proyek.
            </span>
          </div>
        </div>
      </header>

      {/* Ringkasan angka utama */}
      <section className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Mahasiswa terdaftar
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-base">
              🎓
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {students.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {studentsAktif} di antaranya pernah melamar
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Proyek ditawarkan
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-base">
              📋
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {projects.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {countOpen} terbuka · {countInProgress} berjalan · {countCompleted}{" "}
            selesai
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Mitra</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-base">
              🏪
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {partners.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {mitraAktif} mitra sudah memposting proyek
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Rata-rata rating
            </p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-base">
              ⭐
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {ratings.length > 0 ? avgRating.toFixed(1) : "—"}
            <span className="text-lg text-amber-400"> ★</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {ratings.length} rating · {sksEligible} proyek bisa dikonversi SKS
          </p>
        </div>
      </section>
      {/* Laporan 1 — mahasiswa terdaftar per prodi */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Mahasiswa terdaftar per prodi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Rekapitulasi jumlah mahasiswa, proyek yang relevan, dan lamaran pada
          tiap program studi.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Prodi</th>
                <th className="py-2.5 pr-4 text-right font-semibold">Mahasiswa</th>
                <th className="py-2.5 pr-4 text-right font-semibold">Proyek</th>
                <th className="py-2.5 text-right font-semibold">Lamaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prodiRows.map((row) => (
                <tr
                  key={row.prodi}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {row.prodi}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                    {row.mahasiswa}
                    <span className="ml-2 text-xs text-slate-400">
                      ({row.mahasiswaAktif} aktif)
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                    {row.proyek}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-700">
                    {row.lamaran}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold text-slate-900">
                <td className="py-2.5 pr-4">Total</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {students.length}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {projects.length}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {applications.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Laporan 2 — mitra */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Mitra &amp; kontribusi proyek
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Daftar mitra UMKM/studio beserta jumlah proyek dan pelamar yang mereka
          terima.
        </p>
        {partnerRows.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-4 font-semibold">Mitra</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Proyek</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Selesai</th>
                  <th className="py-2.5 pr-4 text-right font-semibold">Pelamar</th>
                  <th className="py-2.5 text-right font-semibold">Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerRows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-slate-900">
                        {row.businessName}
                      </p>
                      <p className="text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                      {row.proyek}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                      {row.proyekSelesai}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                      {row.pelamar}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-700">
                      {row.diterima}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Belum ada mitra terdaftar.
          </p>
        )}
      </section>



      {/* Laporan 3 — daftar proyek + filter */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Daftar proyek</h2>
        <p className="mt-1 text-sm text-slate-500">
          Seluruh proyek lintas mitra, dapat disaring per prodi dan status.
        </p>

        <form
          method="GET"
          action="/campus"
          className="mt-5 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
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
              defaultValue={prodiFilter}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <label
              htmlFor="status"
              className="block text-sm font-medium text-slate-700"
            >
              Filter status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua status</option>
              <option value="open">Terbuka</option>
              <option value="in_progress">Berjalan</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:scale-[0.98]"
          >
            Terapkan
          </button>

          {hasFilter && (
            <Link
              href="/campus"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Hapus filter
            </Link>
          )}
        </form>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
          Menampilkan <span className="tabular-nums">{shownProjects.length}</span>{" "}
          dari <span className="tabular-nums">{projects.length}</span> proyek
        </p>

        {shownProjects.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {shownProjects.map((p) => {
              const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.open;
              const pelamar = applications.filter(
                (a) => a.project_id === p.id
              ).length;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-700"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.prodi_target} · dibuat {formatDate(p.created_at)} ·{" "}
                      <span className="tabular-nums">{pelamar}</span> pelamar
                      {p.sks_eligible && (
                        <span className="ml-1 font-semibold text-indigo-600">
                          · Bisa SKS
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Tidak ada proyek yang cocok dengan filter ini.
          </p>
        )}
      </section>


      {/* Laporan 4 — ringkasan lamaran */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Ringkasan lamaran
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Total <span className="tabular-nums">{applications.length}</span>{" "}
          lamaran masuk dari mahasiswa ke proyek mitra.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-medium text-sky-700">Menunggu tinjauan</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-sky-800">
              {countPending}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Diterima</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-800">
              {countAccepted}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">Ditolak</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-rose-800">
              {countRejected}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 text-right font-semibold">Jumlah</th>
                <th className="py-2.5 font-semibold">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { key: "pending", count: countPending },
                { key: "accepted", count: countAccepted },
                { key: "rejected", count: countRejected },
              ].map((row) => {
                const meta = APP_STATUS_LABEL[row.key];
                const pct =
                  applications.length > 0
                    ? Math.round((row.count / applications.length) * 100)
                    : 0;
                return (
                  <tr
                    key={row.key}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-slate-700">
                      {row.count}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-slate-600">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
        ProjectBridge · Dashboard monitoring kampus (read-only) — data
        diperbarui langsung dari aktivitas mahasiswa, mitra, dan proyek.
      </footer>
    </main>
  );
}

