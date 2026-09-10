"use client";

import { useState } from "react";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`Rating ${value} dari 5`}>
      {"★".repeat(Math.max(0, Math.min(5, value)))}
      {"☆".repeat(5 - Math.max(0, Math.min(5, value)))}
    </span>
  );
}

export function CertificateCard({
  studentName,
  projectTitle,
  partnerName,
  ratingStars,
  ratingComment,
  issuedAt,
}: {
  studentName: string;
  projectTitle: string;
  partnerName: string;
  ratingStars: number | null;
  ratingComment: string | null;
  issuedAt: string;
}) {
  const [hours, setHours] = useState("");

  return (
    <div className="rounded-2xl border-4 border-indigo-200 bg-white p-8 text-center shadow-lg">
      <div className="mx-auto inline-block rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-6 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
        ProjectBridge · IDB Bali
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Sertifikat Penyelesaian Proyek
      </p>

      <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
        {studentName}
      </h3>
      <p className="mt-2 text-sm text-slate-600">telah menyelesaikan proyek</p>
      <p className="mt-1 text-lg font-bold text-indigo-700">“{projectTitle}”</p>
      <p className="mt-1 text-sm text-slate-600">
        bersama mitra <strong>{partnerName}</strong>
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-center gap-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Jam kerja (isi manual)
          </p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <input
              value={hours}
              onChange={(e) =>
                setHours(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
              }
              inputMode="numeric"
              placeholder="mis. 120"
              aria-label="Jam kerja"
              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-center text-xl font-extrabold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-slate-500">jam</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Rating dari mitra
          </p>
          <p className="mt-1 text-xl">
            {ratingStars ? (
              <Stars value={ratingStars} />
            ) : (
              <span className="text-slate-300">— belum ada —</span>
            )}
          </p>
          {ratingComment && (
            <p className="mt-1 max-w-xs text-xs italic text-slate-500">
              “{ratingComment}”
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500">Diterbitkan {issuedAt}</p>

      <p className="mt-4 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-400">
        Sertifikat digital — ambil tangkapan layar kartu ini untuk portofolio
        Anda.
      </p>
    </div>
  );
}