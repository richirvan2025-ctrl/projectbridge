// Helper slug URL (Milestone 10).
// Modul biasa (bukan "use server") supaya bisa diimpor Server Action maupun
// Server Component — pola yang sama dengan app/(auth)/prodi-options.ts.

const MAX_SLUG_LENGTH = 60;

/**
 * Ubah judul proyek menjadi slug URL: huruf kecil, ASCII, dipisah tanda hubung.
 * Judul yang seluruhnya non-alfanumerik menghasilkan "proyek" sebagai cadangan.
 */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    // buang tanda diakritik (é -> e, ñ -> n) agar slug tetap ASCII
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // semua yang bukan huruf/angka jadi satu pemisah
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Potong di batas kata, lalu rapikan tanda hubung yang tertinggal di ujung.
  const trimmed = base.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
  return trimmed || "proyek";
}

/** Benar bila string berbentuk UUID (untuk fallback URL lama). */
export function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}
