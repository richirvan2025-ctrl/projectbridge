import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Proyek aktif</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
          <p className="mt-1 text-xs text-slate-400">Akan tersedia di Milestone 5</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pelamar masuk</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
          <p className="mt-1 text-xs text-slate-400">Akan tersedia di Milestone 5</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Proyek selesai</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">0</p>
          <p className="mt-1 text-xs text-slate-400">Akan tersedia di Milestone 5</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        <p className="font-semibold text-slate-700">Belum ada proyek diposting</p>
        <p className="mt-1 text-sm">
          Fitur posting proyek akan tersedia di Milestone 3.
        </p>
      </section>
    </main>
  );
}
