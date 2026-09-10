"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitRatingAction } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
    >
      {pending ? "Menyimpan…" : "Kirim Rating"}
    </button>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function RatingForm({
  projectId,
  toUserId,
  targetLabel,
}: {
  projectId: string;
  toUserId: string;
  targetLabel: string;
}) {
  const [stars, setStars] = useState(0);
  const [state, formAction] = useFormState<
    { error?: string } | undefined,
    FormData
  >(async (_prev, formData) => {
    return await submitRatingAction(formData);
  }, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="to_user_id" value={toUserId} />
      <input type="hidden" name="stars" value={stars} />

      {state?.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      <p className="text-sm font-medium text-slate-700">
        Beri rating untuk <strong>{targetLabel}</strong>
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            aria-label={`Beri ${n} bintang`}
            className={`text-2xl leading-none transition ${
              n <= stars ? "text-amber-400" : "text-slate-300"
            } hover:text-amber-400`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={2}
        maxLength={300}
        placeholder="Komentar singkat (opsional)…"
        className={inputClass}
      />

      <SubmitButton disabled={stars === 0} />
    </form>
  );
}