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
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-10 text-white shadow-xl">
        <p className="text-sm font-medium text-white/80">Dashboard Kampus</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
          Halo, {profile?.name ?? "Admin Kampus"} 🏫
        </h1>
        <p className="mt-2 max-w-2xl text-white/90">
          Monitoring dan pelaporan (read-only): mahasiswa terdaftar per prodi,
          proyek yang ditawarkan mitra, status proyek, lamaran, serta rating dua
          arah.
        </p>
        <div className="mt-6">
          <PrintButton />
        </div>
      </header>

      {/* Ringkasan angka utama */}
      <section className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Mahasiswa terdaftar
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {students.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {studentsAktif} di antaranya pernah melamar
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Proyek ditawarkan</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {projects.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {countOpen} terbuka · {countInProgress} berjalan · {countCompleted}{" "}
            selesai
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Mitra</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {partners.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {mitraAktif} mitra sudah memposting proyek
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Rata-rata rating</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {ratings.length > 0 ? avgRating.toFixed(1) : "—"}
            <span className="text-lg text-amber-400"> ★</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
      {/* Laporan 1 — mahasiswa terdaftar per prodi */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Mahasiswa terdaftar per prodi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Rekapitulasi jumlah mahasiswa, proyek yang relevan, dan lamaran pada
          tiap program studi.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-semibold">Prodi</th>
                <th className="py-2 pr-4 font-semibold">Mahasiswa</th>
                <th className="py-2 pr-4 font-semibold">Proyek ditawarkan</th>
                <th className="py-2 font-semibold">Lamaran terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prodiRows.map((row) => (
                <tr key={row.prodi}>
                  <td className="py-2 pr-4 font-medium text-slate-900">
                    {row.prodi}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.mahasiswa}
                    <span className="ml-2 text-xs text-slate-400">
                      ({row.mahasiswaAktif} aktif melamar)
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{row.proyek}</td>
                  <td className="py-2 text-slate-700">{row.lamaran}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold text-slate-900">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{students.length}</td>
                <td className="py-2 pr-4">{projects.length}</td>
                <td className="py-2">{applications.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

            {ratings.length} rating · {sksEligible} proyek bisa dikonversi SKS
          </p>
        </div>
      </section>

      {/* Laporan 2 — mitra */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Mitra & kontribusi proyek
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Daftar mitra UMKM/studio beserta jumlah proyek dan pelamar yang mereka
          terima.
        </p>
        {partnerRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Mitra</th>
                  <th className="py-2 pr-4 font-semibold">Proyek</th>
                  <th className="py-2 pr-4 font-semibold">Selesai</th>
                  <th className="py-2 pr-4 font-semibold">Pelamar</th>
                  <th className="py-2 font-semibold">Diterima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partnerRows.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-slate-900">
                        {row.businessName}
                      </p>
                      <p className="text-xs text-slate-400">{row.email}</p>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{row.proyek}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {row.proyekSelesai}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{row.pelamar}</td>
                    <td className="py-2 text-slate-700">{row.diterima}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
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
          className="mt-4 flex flex-wrap items-end gap-4"
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
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua status</option>
              <option value="open">Terbuka</option>
              <option value="in_progress">Berjalan</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Terapkan
          </button>

          {hasFilter && (
            <Link
              href="/campus"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hapus filter
            </Link>
          )}
        </form>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
          Menampilkan {shownProjects.length} dari {projects.length} proyek
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
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-700"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {p.prodi_target} · dibuat {formatDate(p.created_at)} ·{" "}
                      {pelamar} pelamar
                      {p.sks_eligible && (
                        <span className="ml-1 font-semibold text-indigo-600">
                          · Bisa SKS
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Tidak ada proyek yang cocok dengan filter ini.
          </p>
        )}
      </section>


      {/* Laporan 4 — ringkasan lamaran */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Ringkasan lamaran</h2>
        <p className="mt-1 text-sm text-slate-500">
          Total {applications.length} lamaran masuk dari mahasiswa ke proyek
          mitra.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <p className="text-sm font-medium text-sky-700">Menunggu tinjauan</p>
            <p className="mt-1 text-2xl font-extrabold text-sky-800">
              {countPending}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Diterima</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-800">
              {countAccepted}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">Ditolak</p>
            <p className="mt-1 text-2xl font-extrabold text-rose-800">
              {countRejected}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 pr-4 font-semibold">Jumlah</th>
                <th className="py-2 font-semibold">Persentase</th>
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
                  <tr key={row.key}>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{row.count}</td>
                    <td className="py-2 text-slate-700">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 text-center text-sm text-slate-400">
        ProjectBridge · Dashboard monitoring kampus (read-only) — data
        diperbarui langsung dari aktivitas mahasiswa, mitra, dan proyek.
      </footer>
    </main>
  );
}

