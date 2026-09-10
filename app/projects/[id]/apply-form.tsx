"use client";

import { useFormState, useFormStatus } from "react-dom";
import { applyProjectAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
    >
      {pending ? "Sedang send…" : "Send Lamaran"}
    </button>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const labelClass = "block text-sm font-medium text-slate-700";

export function ApplyForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useFormState<
    { error?: string } | undefined,
    FormData
  >(async (_prev, formData) => {
    return await applyProjectAction(formData);
  }, undefined);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-4"
    >
      <input type="hidden" name="project_id" value={projectId} />

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="motivation_text" className={labelClass}>
          Alasan lamaran
        </label>
        <textarea
          id="motivation_text"
          name="motivation_text"
          required
          rows={4}
          minLength={20}
          placeholder="Kenapa Anda cocok untuk proyek ini? (minimal 20 karakter)"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="portfolio" className={labelClass}>
          Portofolio (maks 3 file)
        </label>
        <input
          id="portfolio"
          name="portfolio"
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">
          Format: PDF, PNG, JPG, WEBP, GIF — maks 5 MB per file.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}