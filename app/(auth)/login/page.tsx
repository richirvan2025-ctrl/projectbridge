import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Masuk ke ProjectBridge</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gunakan akun yang sudah terdaftar di Prodi atau Mitra UMKM.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link
          href="/signup"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}
