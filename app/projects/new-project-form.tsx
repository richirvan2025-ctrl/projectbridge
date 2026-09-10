"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProjectAction } from "./actions";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
    >
      {pending ? "Memproses…" : "Publikasikan Proyek"}
    </button>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const labelClass = "block text-sm font-medium text-slate-700";

export function NewProjectForm() {
  const [state, formAction] = useFormState<
    { error?: string } | undefined,
    FormData
  >(async (_prev, formData) => {
    return await createProjectAction(formData);
  }, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelClass}>
          Judul proyek
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="cth: Redesign katalog produk untuk UMKM kopi"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={6}
          minLength={20}
          placeholder="Jelaskan kebutuhan, hasil yang diharapan, dan tahapan pengerjaannya…"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="prodi_target" className={labelClass}>
          Prodi yang dicari
        </label>
        <select
          id="prodi_target"
          name="prodi_target"
          required
          className={inputClass}
        >
          <option value="">Pilih prodi…</option>
          {PRODI_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="compensation" className={labelClass}>
          Kompensasi (opsional)
        </label>
        <input
          id="compensation"
          name="compensation"
          type="text"
          placeholder="cth: Rp 1.500.000 atau uang + konsumsi"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="deadline" className={labelClass}>
          Deadline (opsional)
        </label>
        <input id="deadline" name="deadline" type="date" className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          id="sks_eligible"
          name="sks_eligible"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Bisa dikonversi SKS
      </label>

      <SubmitButton />
    </form>
  );
}