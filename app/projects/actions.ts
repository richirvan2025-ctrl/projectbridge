"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";

type ProjectActionResult = { error: string } | undefined;

/**
 * Milestone 3 — Mitra post proyek baru.
 * RLS "projects_insert_own" tetap benteng terakhir: hanya partner yang bisa
 * insert baris dengan partner_id = auth.uid().
 */
export async function createProjectAction(
  formData: FormData
): Promise<ProjectActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const prodiTarget = String(formData.get("prodi_target") ?? "").trim();
  const compensation = String(formData.get("compensation") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "").trim();
  const sksEligible = formData.get("sks_eligible") === "on";

  // Validasi dasar (defense in depth — client juga validasi)
  if (!title || !description || !prodiTarget) {
    return { error: "Judul, deskripsi, dan prodi tujuan wajib diisi." };
  }
  if (title.length > 120) {
    return { error: "Judul maksimal 120 karakter." };
  }
  if (description.length < 20) {
    return {
      error:
        "Deskripsi minimal 20 karakter agar mahasiswa paham kebutuhannya.",
    };
  }
  if (!(PRODI_OPTIONS as readonly string[]).includes(prodiTarget)) {
    return { error: "Prodi tujuan tidak valid." };
  }
  if (deadline && Number.isNaN(Date.parse(deadline))) {
    return { error: "Format deadline tidak valid." };
  }

  // Pastikan yang insert memang role partner
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "partner") {
    return { error: "Hanya mitra yang dapat membuat proyek." };
  }

  const { error } = await supabase.from("projects").insert({
    partner_id: user.id,
    title,
    description,
    prodi_target: prodiTarget,
    compensation: compensation || null,
    deadline: deadline || null,
    sks_eligible: sksEligible,
    status: "open",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect("/dashboard?created=1");
}