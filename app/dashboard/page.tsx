import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  IconCheckCircle,
  IconClock,
  IconMegaphone,
  IconSparkles,
  IconStorefront,
  IconUsers,
} from "@/components/icons";

export const metadata = { title: "Dashboard Mitra — ProjectBridge" };

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  open: { label: "Terbuka", className: "bg-emerald-100 text-emerald-700" },
  in_progress: { label: "Berjalan", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Selesai", className: "bg-slate-200 text-slate-600" },
};

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { created?: string };
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
    .select("role, name, business_name")
    .eq("id", user.id)
    .single();

  // Safety: kalau role bukan partner, arahkan ke dashboard yang sesuai
  if (profile?.role !== "partner") {
    redirect("/student");
  }

  const { data: projectsData } = await supabase
    .from("projects")
    .select(
      "id, title, prodi_target, compensation, deadline, sks_eligible, status, created_at"
    )
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  const projects = projectsData ?? [];
  const countOpen = projects.filter((p) => p.status === "open").length;
  const countInProgress = projects.filter((p) => p.status === "in_progress").length;
  const countCompleted = projects.filter((p) => p.status === "completed").length;

  // Jumlah pelamar per proyek (satu query saja)
  const projectIds = projects.map((p) => p.id);
  let applicationCounts: Record<string, number> = {};
  if (projectIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("project_id")
      .in("project_id", projectIds);
    (apps ?? []).forEach((a) => {
      applicationCounts[a.project_id] =
        (applicationCounts[a.project_id] ?? 0) + 1;
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-8 text-white shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30">
            <IconStorefront className="h-3.5 w-3.5" />
            Dashboard Mitra
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            Halo, {profile?.name ?? "Mitra"}
          </h1>
          <p className="mt-2 text-white/90">
            {profile?.business_name
              ? `Usaha: ${profile.business_name}`
              : "Kelola proyek dan pelamar Anda di sini."}
          </p>
        </div>
      </header>

      {searchParams?.created === "1" && (
        <div
          role="status"
          className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          <IconSparkles className="h-4 w-4 shrink-0" />
          Proyek berhasil dipublikasikan
        </div>
      )}

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Proyek terbuka</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <IconMegaphone className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {countOpen}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Berjalan</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <IconClock className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {countInProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Selesai</p>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <IconCheckCircle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
            {countCompleted}
          </p>
        </div>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Proyek Anda{" "}
          <span className="tabular-nums text-slate-400">
            ({projects.length})
          </span>
        </h2>
        <Link
          href="/dashboard/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:scale-[0.98]"
        >
          + Posting Proyek
        </Link>
      </section>

      {projects.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {projects.map((p) => {
            const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.open;
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-700"
                  >
                    {p.title}
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Prodi: <strong>{p.prodi_target}</strong>
                  {p.compensation && <> · Kompensasi: {p.compensation}</>}
                  {p.deadline && (
                    <>
                      {" · "}Deadline: {formatDeadline(p.deadline)}
                    </>
                  )}
                  {p.sks_eligible && (
                    <>
                      {" · "}
                      <span className="font-semibold text-indigo-600">
                        Bisa SKS
                      </span>
                    </>
                  )}
                </p>
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  <IconUsers className="h-4 w-4" />
                  <span className="tabular-nums">
                    {applicationCounts[p.id] ?? 0}
                  </span>{" "}
                  pelamar — tinjau lamaran →
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Belum ada proyek</p>
          <p className="mt-1 text-sm text-slate-500">
            Posting proyek pertama Anda agar tampil di listing mahasiswa.
          </p>
        </section>
      )}
    </main>
  );
}
