import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  IconAcademicCap,
  IconBanknotes,
  IconCalendar,
  IconCheckCircle,
  IconInfo,
  IconTrophy,
} from "@/components/icons";

export const metadata = { title: "Dashboard Mahasiswa — ProjectBridge" };

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

export default async function StudentPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, prodi")
    .eq("id", user.id)
    .single();

  // Safety: kalau role bukan student, arahkan ke dashboard yang sesuai
  if (profile?.role !== "student") {
    redirect("/dashboard");
  }

  const prodi = profile?.prodi?.trim();
  let query = supabase
    .from("projects")
    .select(
      "id, title, description, prodi_target, compensation, deadline, sks_eligible"
    )
    .eq("status", "open");

  // Prioritaskan proyek yang cocok dengan prodi student
  if (prodi) {
    query = query.eq("prodi_target", prodi);
  }

  const { data: projects } = await query
    .order("created_at", { ascending: false })
    .limit(5);

  // Milestone 6: proyek selesai yang lamarannya diterima → sertifikat siap
  const { data: acceptedApps } = await supabase
    .from("applications")
    .select("id, project:projects(id, title, status, prodi_target)")
    .eq("student_id", user.id)
    .eq("status", "accepted");

  const doneProjects = (acceptedApps ?? [])
    .map((a) => {
      const p = Array.isArray(a.project) ? a.project[0] : a.project;
      return p as
        | { id: string; title: string; status: string; prodi_target: string }
        | null;
    })
    .filter(
      (
        p
      ): p is { id: string; title: string; status: string; prodi_target: string } =>
        p !== null && p.status === "completed"
    );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30">
            <IconAcademicCap className="h-3.5 w-3.5" />
            Dashboard Mahasiswa
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Halo, {profile?.name ?? "Mahasiswa"}
          </h1>
          <p className="mt-2 max-w-2xl text-white/90">
            {prodi
              ? `Proyek terbuka untuk ${prodi}:`
              : "Cari proyek riil yang sesuai dengan prodi Anda."}
          </p>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Proyek cocok untuk Anda
          </h2>
          <Link
            href={
              prodi ? `/projects?prodi=${encodeURIComponent(prodi)}` : "/projects"
            }
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Lihat semua proyek →
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/projects/${p.id}`}
                  className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-700"
                >
                  {p.title}
                </Link>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 font-semibold text-indigo-700">
                    <IconAcademicCap className="h-3.5 w-3.5" />
                    {p.prodi_target}
                  </span>
                  {p.sks_eligible && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">
                      <IconCheckCircle className="h-3.5 w-3.5" />
                      Bisa SKS
                    </span>
                  )}
                  {p.compensation && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                      <IconBanknotes className="h-3.5 w-3.5" />
                      {p.compensation}
                    </span>
                  )}
                  {p.deadline && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                      <IconCalendar className="h-3.5 w-3.5" />
                      Deadline: {formatDeadline(p.deadline)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Belum ada proyek terbuka untuk prodi Anda
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Cek daftar lengkap semua proyek — mitra posting baru tiap minggu.
            </p>
          </section>
        )}
      </section>

      {doneProjects.length > 0 && (
        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-900">
            <IconTrophy className="h-5 w-5 text-emerald-600" />
            Proyek selesai — sertifikat siap
          </h2>
          <p className="mt-1 text-sm text-emerald-700">
            Beri rating ke mitra dan ambil sertifikat digital Anda.
          </p>
          <ul className="mt-4 space-y-3">
            {doneProjects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.prodi_target}</p>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
                >
                  Lihat sertifikat &amp; rating →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 flex items-start gap-2 text-sm text-slate-500">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Buka detail proyek untuk melihat deskripsi lengkap dan mengirim
          lamaran dengan portofolio (maks 3 file).
        </span>
      </p>
    </main>
  );
}
