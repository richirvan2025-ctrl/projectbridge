import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  IconAcademicCap,
  IconArrowRight,
  IconClipboard,
  IconCheckCircle,
  IconLibrary,
  IconMegaphone,
  IconSparkles,
  IconStar,
  IconStorefront,
  IconTrophy,
} from "@/components/icons";

const roles = [
  {
    icon: IconAcademicCap,
    kicker: "Untuk mahasiswa",
    title: "Kerjakan proyek nyata",
    desc: "Dari katalog UMKM sampai visualisasi booth, cari pekerjaan kecil yang sesuai prodi dan jadikan portofoliomu.",
    href: "/signup",
    cta: "Daftar sebagai mahasiswa",
  },
  {
    icon: IconStorefront,
    kicker: "Untuk mitra",
    title: "Rekrut talenta kampus",
    desc: "Posting kebutuhan bisnismu, tinjau lamaran, dan selesaikan pekerjaan dengan mahasiswa yang siap.",
    href: "/signup",
    cta: "Daftar sebagai mitra",
  },
  {
    icon: IconLibrary,
    kicker: "Untuk kampus",
    title: "Pantau tanpa kehilangan konteks",
    desc: "Lihat mahasiswa per prodi, kontribusi mitra, dan status proyek dari satu dashboard yang terukur.",
    href: "/login",
    cta: "Masuk sebagai kampus",
  },
];

const steps = [
  {
    n: "01",
    icon: IconClipboard,
    title: "Mitra memposting kebutuhan",
    desc: "Judul, deskripsi, prodi, kompensasi, deadline, dan opsi konversi SKS.",
  },
  {
    n: "02",
    icon: IconMegaphone,
    title: "Mahasiswa melamar",
    desc: "Alasan singkat plus portofolio, maksimal tiga file, langsung dari detail proyek.",
  },
  {
    n: "03",
    icon: IconCheckCircle,
    title: "Mitra meninjau dan menandai selesai",
    desc: "Terima atau tolak pelamar, lalu tutup proyek setelah pekerjaan kelar.",
  },
  {
    n: "04",
    icon: IconTrophy,
    title: "Rating dua arah dan sertifikat",
    desc: "Kedua pihak saling menilai, lalu sertifikat digital siap diverifikasi.",
  },
];

const proof = [
  { stat: "5", label: "program studi yang sudah tersambung" },
  { stat: "2 arah", label: "penilaian antara mahasiswa dan mitra" },
  { stat: "3 file", label: "portofolio yang dilampirkan tiap lamaran" },
  { stat: "1", label: "alur utuh dari posting sampai sertifikat" },
];

const demoAccounts = [
  { role: "Mitra", email: "mitra@warungwayan.id", note: "Warung Kopi Wayan — proyek selesai dengan rating dan sertifikat." },
  { role: "Mitra", email: "mitra@studiobatik.id", note: "Studio Batik Sanur — proyek berjalan dan terbuka." },
  { role: "Mahasiswa", email: "dewa@student.id", note: "DKV — lamaran diterima, proyek selesai dan sudah saling dinilai." },
  { role: "Mahasiswa", email: "ayu@student.id", note: "Bisnis Digital — punya lamaran masuk dan pernah ditolak." },
  { role: "Mahasiswa", email: "gita@student.id", note: "Desain Interior — lamaran diterima di proyek berjalan." },
  { role: "Kampus", email: "kampus@idb-bali.ac.id", note: "Admin kampus — monitoring per prodi, proyek, mitra, dan lamaran." },
];

export default async function Home() {
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let loggedIn: { name: string; role: "student" | "partner" | "campus" } | null =
    null;
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
        .single<{ name: string; role: "student" | "partner" | "campus" }>();
      if (profile?.name && profile?.role) {
        loggedIn = { name: profile.name, role: profile.role };
      }
    }
  } catch {
    // placeholder env => anggap belum login
  }

  const dashboardHref =
    loggedIn?.role === "partner"
      ? "/dashboard"
      : loggedIn?.role === "campus"
        ? "/campus"
        : "/student";

  const statusBadge = supabaseConfigured ? (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold bg-[#15655F]/10 text-[#15655F]">
      <span className="inline-block h-2 w-2 rounded-full bg-[#15655F]" />
      Supabase terhubung
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold bg-amber-100 text-amber-800">
      <span className="inline-block h-2 w-2 rounded-full bg-amber-600" />
      Supabase: isi .env.local dulu
    </span>
  );

  return (
    <main className="bg-[#F7F3EC] text-[#1B2430]">
      <section className="relative overflow-hidden border-b border-[#1B2430]/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(219,88,61,0.16),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(21,101,97,0.14),transparent_38%)]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pb-24 md:pt-24">
          <div className="pb-rise">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#1B2430]/15 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wide text-[#15655F]">
              <IconSparkles className="h-4 w-4" />
              Marketplace proyek kampus · IDB Bali
            </p>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.98] tracking-tight text-[#1B2430] md:text-7xl">
              Pekerjaan nyata,{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">melewati jembatan</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 z-0 h-4 -rotate-1 rounded-sm bg-[#DB583D]/80 md:h-5"
                />
              </span>{" "}
              kampus.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#1B2430]/70">
              ProjectBridge mempertemukan mahasiswa dengan UMKM dan studio
              kreatif untuk proyek riil yang fleksibel, bisa dikonversi SKS, dan
              berakhir dengan rating yang bisa dipercaya.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {loggedIn ? (
                <Link
                  href={dashboardHref}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#DB583D] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#C44B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB583D] focus-visible:ring-offset-2"
                >
                  Buka dashboard
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#DB583D] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#C44B33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DB583D] focus-visible:ring-offset-2"
                >
                  Mulai sekarang
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                href="/projects"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#1B2430]/20 bg-white/60 px-6 py-3 font-semibold text-[#1B2430] transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2430]/30"
              >
                Lihat proyek
              </Link>
            </div>
            <div className="mt-6">{statusBadge}</div>
          </div>

          <div className="pb-rise relative" style={{ animationDelay: "120ms" }}>
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-[#1B2430]/10 bg-white/70 p-5 shadow-xl shadow-[#1B2430]/10 backdrop-blur">
              <div
                aria-hidden="true"
                className="mb-5 flex items-end justify-between"
              >
                <div className="h-28 w-24 rounded-2xl border border-[#1B2430]/10 bg-[#DB583D]/15" />
                <div className="h-24 w-28 rounded-2xl border border-[#1B2430]/10 bg-[#15655F]/15" />
                <div className="h-20 w-20 rounded-full border border-[#1B2430]/10 bg-[#F2C14E]/40" />
              </div>
              <div className="grid gap-3">
                {[
                  ["Brief masuk", "UMKM menjelaskan kebutuhan proyeknya."],
                  ["Talent terhubung", "Mahasiswa sesuai prodi melamar."],
                  ["Hasil tervalidasi", "Rating dua arah dan sertifikat digital."],
                ].map(([title, desc], i) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-[#1B2430]/10 bg-[#F7F3EC] p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1B2430] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#1B2430]">{title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-[#1B2430]/60">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1B2430]/10 bg-[#1B2430] text-white">
        <div className="mx-auto grid max-w-6xl gap-px sm:grid-cols-2 lg:grid-cols-4">
          {proof.map((item) => (
            <div key={item.label} className="px-6 py-8">
              <p className="text-4xl font-black tracking-tight">{item.stat}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#DB583D]">
            Satu pasar, tiga peran
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1B2430] md:text-5xl">
            Sisi kampus yang paling penting adalah hasil nyata.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <article
                key={role.kicker}
                className="group flex cursor-pointer flex-col rounded-3xl border border-[#1B2430]/10 bg-white p-6 transition-colors duration-200 hover:border-[#DB583D]/60"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1B2430] text-white transition-colors duration-200 group-hover:bg-[#DB583D]">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#DB583D]">
                  {role.kicker}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[#1B2430]">
                  {role.title}
                </h3>
                <p className="mt-3 flex-1 leading-relaxed text-[#1B2430]/65">
                  {role.desc}
                </p>
                <Link
                  href={role.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B2430] transition-colors duration-200 hover:text-[#DB583D]"
                >
                  {role.cta}
                  <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#1B2430]/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#15655F]">
                Alur yang bisa selesai
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1B2430] md:text-5xl">
                Dari brief sampai sertifikat.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-[#1B2430]/65">
                Tidak ada koordinasi yang hilang di grup chat. Setiap langkah
                tercatat dan mengarah ke hasil yang bisa dibuktikan.
              </p>
            </div>

            <ol className="grid gap-4">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.n}
                    className="grid grid-cols-[3rem_1fr] gap-4 rounded-3xl border border-[#1B2430]/10 p-5 transition-colors duration-200 hover:border-[#15655F]/50 md:grid-cols-[4rem_1fr] md:p-6"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F7F3EC] text-[#15655F] md:h-16 md:w-16">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <span className="text-xs font-bold tracking-[0.16em] text-[#DB583D]">
                          {step.n}
                        </span>
                        <h3 className="text-lg font-bold text-[#1B2430]">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-2 leading-relaxed text-[#1B2430]/65">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="grid overflow-hidden rounded-3xl border border-[#1B2430]/10 bg-[#15655F] text-white lg:grid-cols-[1fr_0.9fr]">
          <div className="p-8 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F2C14E]">
              Nilai lebih untuk mahasiswa
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Pengalaman kerja yang juga bisa dihitung sebagai SKS.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-white/75">
              Proyek yang memenuhi syarat ditandai bisa dikonversi SKS, lalu
              ditutup dengan rating dua arah dan sertifikat digital sebagai
              bukti kontribusimu.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#F2C14E] px-6 py-3 font-semibold text-[#1B2430] transition-colors duration-200 hover:bg-[#E4B236] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15655F]"
              >
                Daftar sebagai mahasiswa
              </Link>
            </div>
          </div>
          <div className="relative min-h-[280px] bg-[radial-gradient(circle_at_80%_20%,rgba(242,193,78,0.28),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(219,88,61,0.24),transparent_42%)] p-8 md:p-12">
            <div className="grid h-full gap-3">
              {([
                ["Portofolio nyata", IconClipboard],
                ["Rating dua arah", IconStar],
                ["Sertifikat digital", IconTrophy],
              ] as const).map(([label, Icon]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#1B2430]/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#DB583D]">
              Uji coba cepat
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#1B2430] md:text-5xl">
              Akun demo untuk melihat alurnya.
            </h2>
            <p className="mt-4 leading-relaxed text-[#1B2430]/65">
              Jalankan seed demo di Supabase, lalu masuk dengan salah satu akun
              berikut. Semua akun memakai sandi{" "}
              <code className="rounded bg-[#F7F3EC] px-1.5 py-0.5 font-mono text-sm text-[#1B2430]">
                demo1234
              </code>
              .
            </p>
          </div>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1B2430]/15 text-xs uppercase tracking-wide text-[#1B2430]/45">
                  <th className="py-3 pr-4 font-semibold">Peran</th>
                  <th className="py-3 pr-4 font-semibold">Email</th>
                  <th className="py-3 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2430]/10">
                {demoAccounts.map((a) => (
                  <tr key={a.email}>
                    <td className="py-3 pr-4 font-semibold text-[#1B2430]">
                      {a.role}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-[#1B2430]/70">
                      {a.email}
                    </td>
                    <td className="py-3 text-[#1B2430]/65">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="rounded-3xl bg-[#DB583D] p-8 text-white md:p-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
                Hubungkan pekerjaan nyata dengan bakat kampus.
              </h2>
              <p className="mt-4 max-w-xl text-white/80">
                Mulai dari satu proyek kecil. ProjectBridge mencatat jalannya,
                menutupnya dengan rating, dan meninggalkan bukti yang bisa
                dipakai ke depan.
              </p>
            </div>
            {loggedIn ? (
              <Link
                href={dashboardHref}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1B2430] px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Buka dashboard
                <IconArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1B2430] px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Daftar sekarang
                <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
