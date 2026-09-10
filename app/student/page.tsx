import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-10 text-white shadow-xl">
        <p className="text-sm font-medium text-white/80">Dashboard Mahasiswa</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
          Halo, {profile?.name ?? "Mahasiswa"} 🎓
        </h1>
        <p className="mt-2 text-white/90">
          {prodi
            ? `Proyek terbuka untuk ${prodi}:`
            : "Cari proyek riil yang sesuai dengan prodi Anda."}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            Proyek cocok untuk Anda
          </h2>
          <Link
            href={
              prodi ? `/projects?prodi=${encodeURIComponent(prodi)}` : "/projects"
            }
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Lihat semua proyek →
          </Link>
        </div>

        {projects && projects.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
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
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <section className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            <p className="font-semibold text-slate-700">
              Belum ada proyek terbuka untuk prodi Anda
            </p>
            <p className="mt-1 text-sm">
              Cek daftar lengkap semua proyek — mitra posting baru tiap minggu.
            </p>
          </section>
        )}
      </section>

      <p className="mt-6 text-sm text-slate-500">
        🤝 Detail proyek + form lamaran (upload portofolio) akan tersedia di
        Milestone 4.
      </p>
    </main>
  );
}
