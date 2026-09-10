import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  searchParams: URLSearchParams;
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-10 text-white shadow-xl">
        <p className="text-sm font-medium text-white/80">Dashboard Mitra</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
          Halo, {profile?.name ?? "Mitra"} 👋
        </h1>
        <p className="mt-2 text-white/90">
          {profile?.business_name
            ? `Usaha: ${profile.business_name}`
            : "Kelola proyek dan pelamar Anda di sini."}
        </p>
      </header>

      {searchParams.get("created") === "1" && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
        >
          Proyek berhasil dipublikasikan 🎉
        </div>
      )}

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Proyek terbuka</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {countOpen}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Berjalan</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {countInProgress}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Selesai</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {countCompleted}
          </p>
        </div>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">
          Proyek Anda ({projects.length})
        </h2>
        <Link
          href="/dashboard/new"
          className="rounded-full bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700"
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
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.className}`}
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
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">Belum ada proyek</p>
          <p className="mt-1 text-sm">
            Posting proyek pertama Anda agar tampil di listing mahasiswa.
          </p>
        </section>
      )}
    </main>
  );
}
