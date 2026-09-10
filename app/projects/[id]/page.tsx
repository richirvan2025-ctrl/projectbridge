import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./apply-form";

export const metadata = { title: "Detail Proyek — ProjectBridge" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  open: { label: "Terbuka", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "Berjalan", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", className: "bg-slate-200 text-slate-600" },
};

function formatDeadline(iso: string) {
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

function getPartnerBusinessName(partner: unknown): string | null {
  if (!partner || typeof partner !== "object") return null;
  const p = Array.isArray(partner) ? partner[0] : partner;
  if (!p || typeof p !== "object") return null;
  const business = (p as { business_name?: unknown }).business_name;
  return typeof business === "string" ? business : null;
}

export default async function ProjectDetailPage({
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
    .select(
      `id, partner_id, title, description, prodi_target, compensation,
       deadline, sks_eligible, status, created_at,
       partner:users(name, business_name)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isStudent = profile?.role === "student";
  const isOpen = project.status === "open";
  const isOwner = project.partner_id === user.id;
  const partnerName = getPartnerBusinessName(project.partner);

  // Kalau student: cek apakah sudah melamar proyek ini
  let hasApplied = false;
  if (isStudent) {
    const { data: application } = await supabase
      .from("applications")
      .select("id, status")
      .eq("project_id", params.id)
      .eq("student_id", user.id)
      .maybeSingle();
    hasApplied = !!application;
  }

  const justApplied = searchParams.get("applied") === "1";
  const badge = STATUS_LABEL[project.status] ?? STATUS_LABEL.open;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/projects"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        ← Kembali ke daftar proyek
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
          {partnerName ?? "Mitra ProjectBridge"} ·{" "}
          {new Date(project.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>
{/* Sisi action sesuai role + state proyek */}
      {isOwner ? (
        <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
          <p className="font-semibold text-indigo-800">
            Ini proyek yang Anda post, {partnerName ?? "Mitra"} 🙌
          </p>
          <div className="mt-3">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Kelola pelamar →
            </Link>
          </div>
        </section>
      ) : !isOpen ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="font-semibold text-slate-700">
            Proyek ini sudah{" "}
            {project.status === "completed" ? "selesai" : "berjalan"}.
          </p>
          <p className="mt-1 text-sm text-slate-500">Lamaran tidak terbuka lagi.</p>
        </section>
      ) : !isStudent ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="font-semibold text-slate-700">Lamaran hanya bagi mahasiswa.</p>
          <p className="mt-1 text-sm text-slate-500">
            Login dengan akun mahasiswa untuk mengajukan diri.
          </p>
        </section>
      ) : hasApplied ? (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-semibold text-emerald-800">
            🎉 Anda sudah melamar proyek ini.
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Status lamaran Anda bisa dilihat di Milestone 5 ketika mitra tinjau
            pelamar.
          </p>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Lamaran Anda</h2>
          <p className="mt-1 text-sm text-slate-500">
            Isi alasan singkat kenapa Anda cocok, dan upload portofolio (maks 3
            file) agar mitra bisa tinjau.
          </p>
          {justApplied && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
            >
              Lamaran berhasil disend 🎉
            </p>
          )}
          <div className="mt-4">
            <ApplyForm projectId={project.id} />
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Prodi yang dicari</p>
          <p className="mt-1 font-semibold text-slate-900">
            {project.prodi_target}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Kompensasi</p>
          <p className="mt-1 font-semibold text-slate-900">
            {project.compensation || "Belum spesifikasi"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Deadline</p>
          <p className="mt-1 font-semibold text-slate-900">
            {project.deadline ? formatDeadline(project.deadline) : "Fleksibel"}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Deskripsi</h2>
        <p className="mt-3 whitespace-pre-line text-slate-700">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.sks_eligible && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              ✅ Bisa dikonversi SKS
            </span>
          )}
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {project.prodi_target}
          </span>
        </div>
      </section>
    </main>
  );
}