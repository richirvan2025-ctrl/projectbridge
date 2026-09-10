import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateApplicationStatusAction,
  updateProjectStatusAction,
} from "@/app/projects/actions";

export const metadata = { title: "Kelola Proyek — ProjectBridge" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  open: { label: "Terbuka", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "Berjalan", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", className: "bg-slate-200 text-slate-600" },
};

const APP_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Masuk", className: "bg-amber-100 text-amber-700" },
  accepted: { label: "Diterima", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Tolak", className: "bg-red-100 text-red-700" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// PostgREST mengembalikan relasi to-many sebagai array; normalisasi di sini.
function getStudent(student: unknown): {
  name?: string;
  email?: string;
  prodi?: string;
} | null {
  if (!student || typeof student !== "object") return null;
  const s = Array.isArray(student) ? student[0] : student;
  if (!s || typeof s !== "object") return null;
  return {
    name: (s as { name?: unknown }).name as string | undefined,
    email: (s as { email?: unknown }).email as string | undefined,
    prodi: (s as { prodi?: unknown }).prodi as string | undefined,
  };
}

export default async function DashboardProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: URLSearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, partner_id, title, description, prodi_target, status")
    .eq("id", params.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  // Safety: hanya partner pemilik yang bisa lihat pelamar
  if (project.partner_id !== user.id) {
    redirect("/dashboard");
  }

  const { data: applicationsData } = await supabase
    .from("applications")
    .select(
      "id, motivation_text, portfolio_urls, status, created_at, student:users(id, name, email, prodi)"
    )
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  const applications = applicationsData ?? [];
  const countTotal = applications.length;
  const countPending = applications.filter((a) => a.status === "pending").length;
  const countAccepted = applications.filter((a) => a.status === "accepted").length;
  const countRejected = applications.filter((a) => a.status === "rejected").length;
  const justUpdated = searchParams.get("updated") === "1";
  const hasError = searchParams.get("error") === "1";
  const badge = STATUS_LABEL[project.status] ?? STATUS_LABEL.open;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        ← Kembali ke dashboard mitra
      </Link>

      <header className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold">{project.title}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-2 text-white/90">
          Prodi target: <strong>{project.prodi_target}</strong>
        </p>
      </header>

      {justUpdated && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          Perubahan berhasil disimpan ✅
        </p>
      )}

      {hasError && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          Operasi gagal — cek akses atau status proyek.
        </p>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Jumlah pelamar</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {countTotal}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Masuk</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">
            {countPending}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Diterima</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">
            {countAccepted}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tolak</p>
          <p className="mt-1 text-2xl font-extrabold text-red-600">
            {countRejected}
          </p>
        </div>
      </section>

      {/* Status proyek */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Status proyek</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sesuai progress proyek. Lamaran hanya terbuka ketika proyek{" "}
          <strong>terbuka</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {project.status !== "in_progress" && (
            <form action={updateProjectStatusAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="status" value="in_progress" />
              <button
                type="submit"
                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                ▶ Tandai Berjalan
              </button>
            </form>
          )}
          {project.status !== "completed" && (
            <form action={updateProjectStatusAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="status" value="completed" />
              <button
                type="submit"
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                ✅ Tandai Selesai
              </button>
            </form>
          )}
          {project.status !== "open" && (
            <form action={updateProjectStatusAction}>
              <input type="hidden" name="project_id" value={project.id} />
              <input type="hidden" name="status" value="open" />
              <button
                type="submit"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ↪ Buka Lamaran (buka kembali)
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Daftar pelamar */}
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">
          Pelamar ({countTotal})
        </h2>
      </section>

      {applications.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {applications.map((a) => {
            const student = getStudent(a.student);
            const appBadge = APP_STATUS_LABEL[a.status] ?? APP_STATUS_LABEL.pending;
            const portfolio = Array.isArray(a.portfolio_urls)
              ? a.portfolio_urls
              : [];
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {student?.name ?? "Mahasiswa tidak dikenal"} 🎓
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${appBadge.className}`}
                  >
                    {appBadge.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {student?.prodi ?? "Prodi tidak diketahui"}
                  {student?.email ? <> · {student.email}</> : null}
                  {" "}· Lamar pada {formatDate(a.created_at)}
                </p>

                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Alasan lamaran
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {a.motivation_text}
                  </p>
                </div>

                {portfolio.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Portofolio
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {portfolio.map((url, i) => (
                        <li key={url}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                          >
                            📎 File {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
{a.status === "pending" && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={updateApplicationStatusAction}>
                      <input
                        type="hidden"
                        name="application_id"
                        value={a.id}
                      />
                      <input type="hidden" name="status" value="accepted" />
                      <button
                        type="submit"
                        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        ✓ Diterima
                      </button>
                    </form>
                    <form action={updateApplicationStatusAction}>
                      <input
                        type="hidden"
                        name="application_id"
                        value={a.id}
                      />
                      <input type="hidden" name="status" value="rejected" />
                      <button
                        type="submit"
                        className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        ✕ Tolak
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">Belum ada pelamar</p>
          <p className="mt-1 text-sm">
            Mampahkan proyek ini ke mahasiswa — lamaran masuk akan tampil di sini.
          </p>
        </section>
      )}
    </main>
  );
}