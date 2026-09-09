"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signUpAction, PRODI_OPTIONS } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
    >
      {pending ? "Membuat akun…" : "Daftar"}
    </button>
  );
}

type Role = "student" | "partner";

export function SignupForm() {
  const [role, setRole] = useState<Role | null>(null);

  const [state, formAction] = useFormState<
    { error?: string } | undefined,
    FormData
  >(async (_prev, formData) => {
    return await signUpAction(formData);
  }, undefined);

  // Langkah 1: pilih peran
  if (!role) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Pilih peran Anda di ProjectBridge:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("student")}
            className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
          >
            <div className="text-3xl">🎓</div>
            <p className="mt-2 font-bold text-slate-900">Mahasiswa</p>
            <p className="mt-1 text-xs text-slate-500">
              Cari dan apply proyek riil sesuai prodi.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRole("partner")}
            className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
          >
            <div className="text-3xl">🏪</div>
            <p className="mt-2 font-bold text-slate-900">Mitra UMKM/Studio</p>
            <p className="mt-1 text-xs text-slate-500">
              Posting proyek dan kelola pelamar.
            </p>
          </button>
        </div>
      </div>
    );
  }

  // Langkah 2: form sesuai peran
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-600">
          Daftar sebagai{" "}
          <strong className="text-slate-900">
            {role === "student" ? "Mahasiswa" : "Mitra UMKM/Studio"}
          </strong>
        </span>
        <button
          type="button"
          onClick={() => setRole(null)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Ganti
        </button>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Nama {role === "student" ? "lengkap" : "penanggung jawab"}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {role === "student" ? (
        <div>
          <label
            htmlFor="prodi"
            className="block text-sm font-medium text-slate-700"
          >
            Program Studi
          </label>
          <select
            id="prodi"
            name="prodi"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="" disabled>
              Pilih prodi…
            </option>
            {PRODI_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label
            htmlFor="business_name"
            className="block text-sm font-medium text-slate-700"
          >
            Nama Usaha
          </label>
          <input
            id="business_name"
            name="business_name"
            type="text"
            required
            placeholder="cth: Warung Wayan, Studio Tiga"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Password <span className="text-slate-400">(min. 6 karakter)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
