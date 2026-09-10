import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const milestones = [
  { n: "1", title: "Setup & deploy kosong", desc: "Next.js + Supabase + pipeline Vercel jalan", status: "done" },
  { n: "2", title: "Autentikasi + database", desc: "Login mahasiswa/mitra + skema users, projects, applications, ratings + RLS", status: "done" },
  { n: "3", title: "Posting + listing proyek", desc: "Form mitra + daftar proyek dengan filter prodi", status: "done" },
  { n: "4", title: "Detail + lamaran + upload", desc: "Form lamaran + upload portofolio (maks 3 file)", status: "done" },
  { n: "5", title: "Dashboard mitra", desc: "Daftar pelamar + tandai proyek selesai", status: "active" },
  { n: "6", title: "Rating + sertifikat", desc: "Rating dua arah + kartu sertifikat digital" },
  { n: "7–8", title: "Data nyata + polish demo", desc: "Studi kasus UMKM + uji alur penuh + polish tampilan" },
];

const roles = [
  { emoji: "🎓", title: "Mahasiswa", desc: "Cari proyek riil sesuai prodi — DKV, Bisnis Digital, Desain Interior, Desain Mode, Arsitektur — dan ajukan portofoliomu." },
  { emoji: "🏪", title: "Mitra UMKM/Studio", desc: "Posting kebutuhan proyek kecil-menengah, tinjau pelamar, dan tandai proyek selesai." },
  { emoji: "🏅", title: "Sertifikat SKS", desc: "Proyek yang memenuhi syarat bisa diajukan untuk konversi SKS, lengkap dengan rating dua arah." },
];

export default async function Home() {
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // Personalisasi hero kalau user login. Gagal silencieux.
  let loggedIn: { name: string; role: "student" | "partner" } | null = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single<{ name: string; role: "student" | "partner" }>();
      if (profile?.name && profile?.role) {
        loggedIn = { name: profile.name, role: profile.role };
      }
    }
  } catch {
    // placeholder env => anggap belum login
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 p-10 text-white shadow-xl md:p-14">
        <p className="mb-3 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
          MVP Kompetisi Inovasi Kampus · IDB Bali
        </p>
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
          ProjectBridge
        </h1>
        {loggedIn ? (
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Halo, <strong>{loggedIn.name}</strong> — siap{" "}
            {loggedIn.role === "partner"
              ? "merekrut mahasiswa untuk proyek Anda."
              : "menemukan proyek yang cocok untuk prodi Anda."}
          </p>
        ) : (
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Marketplace internal kampus yang mempertemukan mahasiswa dengan UMKM
            dan studio kreatif lokal untuk mengerjakan proyek riil — fleksibel,
            dan bisa dikonversi SKS.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {loggedIn ? (
            <Link
              href={loggedIn.role === "partner" ? "/dashboard" : "/student"}
              className="rounded-full bg-white px-6 py-3 font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            >
              Buka Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 font-semibold text-indigo-700 shadow hover:bg-indigo-50"
            >
              Daftar Sekarang
            </Link>
          )}
          <span
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold ${
              supabaseConfigured
                ? "bg-emerald-400/90 text-emerald-950"
                : "bg-amber-300/90 text-amber-950"
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                supabaseConfigured ? "bg-emerald-800" : "bg-amber-700"
              }`}
            />
            {supabaseConfigured
              ? "Supabase terhubung"
              : "Supabase: isi .env.local dulu"}
          </span>
        </div>
      </section>

      {/* Roles */}
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        {roles.map((r) => (
          <div
            key={r.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-3xl">{r.emoji}</div>
            <h2 className="mt-3 text-lg font-bold">{r.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {r.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Roadmap */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold">Peta Milestone (sesuai PRD)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Milestone 5 aktif — dashboard mitra: daftar pelamar + tandai selesai.
        </p>
        <ol className="mt-6 space-y-4">
          {milestones.map((m) => {
            const isDone = m.status === "done";
            const isActive = m.status === "active";
            return (
              <li key={m.n} className="flex gap-4">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : m.n}
                </span>
                <div>
                  <p className="font-semibold">
                    {m.title}
                    {isActive && (
                      <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        AKTIF
                      </span>
                    )}
                    {isDone && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        SELESAI
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{m.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="mt-10 text-center text-sm text-slate-400">
        ProjectBridge · Milestone 5 — Dashboard Mitra
      </footer>
    </main>
  );
}
