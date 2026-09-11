"use client";

/**
 * Tombol cetak laporan untuk dashboard kampus.
 * Memakai window.print() bawaan browser sehingga laporan bisa disimpan
 * sebagai PDF tanpa dependensi tambahan.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 hover:bg-white/30"
    >
      Cetak laporan
    </button>
  );
}
