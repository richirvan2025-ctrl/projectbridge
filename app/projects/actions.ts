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
/**
 * Milestone 4 — Mahasiswa melamar proyek dengan alasan + portofolio (maks 3).
 * File di-upload ke Supabase Storage (bucket "portfolios"), URL publik
 * disimpan di applications.portfolio_urls. RLS tetap benteng terakhir.
 */
const PORTFOLIO_BUCKET = "portfolios";
const MAX_PORTFOLIO_FILE_BYTES = 5 * 1024 * 1024;

function fileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 && parts[parts.length - 1]
    ? parts[parts.length - 1].toLowerCase()
    : "file";
}

export async function applyProjectAction(
  formData: FormData
): Promise<ProjectActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const projectId = String(formData.get("project_id") ?? "").trim();
  const motivation = String(formData.get("motivation_text") ?? "").trim();
  const files = formData
    .getAll("portfolio")
    .filter((f): f is File => typeof f === "object" && f.size > 0);

  if (!projectId) {
    return { error: "Proyek tidak valid." };
  }
  if (motivation.length < 20) {
    return { error: "Kolom alasan minimal 20 karakter." };
  }
  if (files.length > 3) {
    return { error: "Maksimal 3 file portofolio." };
  }
  for (const file of files) {
    if (file.size > MAX_PORTFOLIO_FILE_BYTES) {
      return { error: "Tiap file portofolio maksimal 5 MB." };
    }
  }

  // Proyek harus masih terbuka
  const { data: project } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .single();

  if (!project || project.status !== "open") {
    return { error: "Proyek tidak ditemukan atau sudah tidak terbuka." };
  }

  // Role harus student
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    return { error: "Hanya mahasiswa yang bisa melamar proyek." };
  }

  // Tidak boleh lamar dua kali ke proyek yang sama
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (existingApplication) {
    return { error: "Anda sudah melamar proyek ini." };
  }

  // Upload file portofolio → URL publik storage
  const portfolioUrls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = fileExtension(file.name);
    const path = `${user.id}/${projectId}/${Date.now()}-${i}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return {
        error: `Upload portofolio gagal (file ${i + 1}): ${uploadError.message}. Pastikan bucket "portfolios" sudah dibuat via supabase/schema.sql.`,
      };
    }

    const { data: publicData } = supabase.storage
      .from(PORTFOLIO_BUCKET)
      .getPublicUrl(path);
    portfolioUrls.push(publicData.publicUrl);
  }

  const { error } = await supabase.from("applications").insert({
    project_id: projectId,
    student_id: user.id,
    motivation_text: motivation,
    portfolio_urls: portfolioUrls,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  redirect(`/projects/${projectId}?applied=1`);
}

/**
 * Milestone 5 — Mitra accept/reject lamaran di proyeknya.
 * RLS "applications_update_partner" garantezia: hanya partner pemilik proyek
 * yang bisa update status application.
 */
export async function updateApplicationStatusAction(
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const applicationId = String(formData.get("application_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!applicationId || (status !== "accepted" && status !== "rejected")) {
    redirect("/dashboard?error=Lamaran atau status tidak valid.");
  }

  const { data: application } = await supabase
    .from("applications")
    .select("id, project_id")
    .eq("id", applicationId)
    .single();

  if (!application) {
    redirect("/dashboard?error=Lamaran tidak ditemukan.");
  }

  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    redirect(`/dashboard/projects/${application.project_id}?error=1`);
  }

  revalidatePath(`/dashboard/projects/${application.project_id}`);
  revalidatePath(`/projects/${application.project_id}`);
  redirect(`/dashboard/projects/${application.project_id}?updated=1`);
}

/**
 * Milestone 5 — Mitra tandai status proyek (selesai / berjalan / terbuka).
 * RLS "projects_update_own" garantezia: hanya partner pemilik.
 */
export async function updateProjectStatusAction(
  formData: FormData
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Silakan masuk terlebih dahulu.");
  }

  const projectId = String(formData.get("project_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (
    !projectId ||
    (status !== "open" &&
      status !== "in_progress" &&
      status !== "completed")
  ) {
    redirect("/dashboard?error=Proyek atau status tidak valid.");
  }

  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) {
    redirect(`/dashboard/projects/${projectId}?error=1`);
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/projects`);
  redirect(`/dashboard/projects/${projectId}?updated=1`);
}