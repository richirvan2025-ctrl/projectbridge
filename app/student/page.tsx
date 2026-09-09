import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-10 text-white shadow-xl">
        <p className="text-sm font-medium text-white/80">Dashboard Mahasiswa</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
          Halo, {profile?.name ?? "Mahasiswa"} 🎓
        </h1>
        <p className="mt-2 text-white/90">
          {profile?.prodi
            ? `Prodi: ${profile.prodi}`
            : "Cari proyek riil yang sesuai dengan prodi Anda."}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        <p className="font-semibold text-slate-700">
          Proyek yang cocok untukmu akan tampil di sini
        </p>
        <p className="mt-1 text-sm">
          Listing + filter proyek akan tersedia di Milestone 3.
        </p>
      </section>
    </main>
  );
}
