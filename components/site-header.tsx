import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";

type Props = {
  user: { name: string; role: "student" | "partner" | "campus" } | null;
};

export function SiteHeader({ user }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-slate-900"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500" />
          ProjectBridge
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-slate-500 sm:inline">
                Halo, <strong className="text-slate-900">{user.name}</strong>{" "}
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {user.role === "partner"
                    ? "Mitra"
                    : user.role === "campus"
                      ? "Kampus"
                      : "Mahasiswa"}
                </span>
              </span>
              <Link
                href="/projects"
                className="hidden rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 sm:inline"
              >
                Daftar Proyek
              </Link>
              <Link
                href={
                  user.role === "partner"
                    ? "/dashboard"
                    : user.role === "campus"
                      ? "/campus"
                      : "/student"
                }
                className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Masuk
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
