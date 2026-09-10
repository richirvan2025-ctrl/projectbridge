import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/app/projects/new-project-form";

export const metadata = { title: "Posting Proyek — ProjectBridge" };

export default async function NewProjectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "partner") {
    redirect("/student");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        ← Kembali ke dashboard
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Posting Proyek Baru</h1>
        <p className="mt-1 text-sm text-slate-500">
          Isi detail proyek. Setelah dipublikasikan, proyek langsung tampil di
          listing mahasiswa.
        </p>

        <div className="mt-6">
          <NewProjectForm />
        </div>
      </div>
    </main>
  );
}