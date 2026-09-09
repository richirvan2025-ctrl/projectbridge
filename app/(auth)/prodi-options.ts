// Daftar prodi yang tersedia (sesuai PRD: DKV, Bisnis Digital, dll).
// Disimpan di sini, BUKAN di file dengan "use server", karena directive
// itu hanya membolehkan export async function. Konstanta dipakai oleh
// form signup (Client Component) dan tidak boleh bercampur dengan
// Server Action.

export const PRODI_OPTIONS = [
  "DKV (Desain Komunikasi Visual)",
  "Bisnis Digital",
  "Desain Interior",
  "Desain Mode",
  "Arsitektur",
] as const;
