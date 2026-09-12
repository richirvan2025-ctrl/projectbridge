"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODI_OPTIONS } from "@/app/(auth)/prodi-options";
import { slugify } from "@/lib/slug";

type ProjectActionResult = { error: string } | undefined;

type SupabaseServerClient = ReturnType<typeof createClient>;

/**
 * Cari slug yang belum terpakai untuk judul proyek: "judul-proyek", lalu
 * "judul-proyek-2", "judul-proyek-3", dst. Unique index projects_slug_unique
 * tetap benteng terakhir bila dua mitra menyimpan pada saat yang sama.
 */
async function reserveSlug(
  supabase: SupabaseServerClient,
  title: string
): Promise<string> {
  const base = slugify(title);
  // slugify() hanya menghasilkan a-z, 0-9, dan "-", jadi aman dipakai sebagai
  // pola LIKE tanpa karakter wildcard.
  const { data } = await supabase
    .from("projects")
    .select("slug")
    .ilike("slug", `${base}%`);

  const taken = new Set(
    (data ?? [])
      .map((row) => row.slug)
      .filter((s): s is string => typeof s === "string")
  );

  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Path publik proyek — slug bila ada, uuid bila baris belum di-backfill.
 * Dipakai untuk revalidatePath agar cache halaman yang benar ikut dibuang.
 */
async function publicProjectPath(
  supabase: SupabaseServerClient,
  projectId: string
): Promise<string> {
  const { data } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", projectId)
    .maybeSingle();

  return `/projects/${data?.slug ?? projectId}`;
}

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

  // Slug URL dari judul; diberi akhiran -2, -3, ... bila sudah terpakai.
  const slug = await reserveSlug(supabase, title);

  const { error } = await supabase.from("projects").insert({
    partner_id: user.id,
    title,
    slug,
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
    .select("id, slug, status")
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

  const publicPath = `/projects/${project.slug ?? projectId}`;
  revalidatePath(publicPath);
  revalidatePath("/projects");
  redirect(`${publicPath}?applied=1`);
}

/**
 * Milestone 5 — Mitra diterima/tolak lamaran di proyeknya.
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
  revalidatePath(await publicProjectPath(supabase, application.project_id));
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
  revalidatePath(await publicProjectPath(supabase, projectId));
  redirect(`/dashboard/projects/${projectId}?updated=1`);
}

/**
 * Milestone 6 — Rating dua arah setelah proyek ditandai selesai.
 * Mitra menilai mahasiswa yang lamarannya diterima; mahasiswa yang diterima
 * menilai mitra. RLS "ratings_insert_own" tetap benteng terakhir
 * (from_user_id = auth.uid()).
 */
export async function submitRatingAction(
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
  const toUserId = String(formData.get("to_user_id") ?? "").trim();
  const stars = Number(formData.get("stars"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!projectId || !toUserId) {
    return { error: "Data rating tidak valid." };
  }
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: "Pilih rating 1–5 bintang." };
  }
  if (comment.length > 300) {
    return { error: "Komentar maksimal 300 karakter." };
  }

  // Proyek harus sudah selesai
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, status, partner_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return { error: "Proyek tidak ditemukan." };
  }
  if (project.status !== "completed") {
    return {
      error: "Rating hanya bisa dikirim setelah proyek ditandai selesai.",
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student" && profile?.role !== "partner") {
    return { error: "Peran tidak valid." };
  }

  if (profile.role === "partner") {
    // Mitra: hanya pemilik proyek, menilai pelamar dengan status diterima
    if (project.partner_id !== user.id) {
      return { error: "Hanya pemilik proyek yang bisa menilai." };
    }
    if (toUserId === user.id) {
      return { error: "Tidak bisa menilai diri sendiri." };
    }
    const { data: acceptedApp } = await supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("student_id", toUserId)
      .eq("status", "accepted")
      .maybeSingle();
    if (!acceptedApp) {
      return {
        error: "Mahasiswa ini tidak punya lamaran diterima di proyek ini.",
      };
    }
  } else {
    // Mahasiswa: hanya pelamar diterima, dan menilai mitra pemilik proyek
    if (toUserId !== project.partner_id) {
      return { error: "Rating hanya untuk mitra pemilik proyek ini." };
    }
    const { data: myApp } = await supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("student_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    if (!myApp) {
      return { error: "Hanya pelamar yang diterima bisa menilai mitra." };
    }
  }

  // Cegah rating ganda (juga dijaga unique index di database)
  const { data: existingRating } = await supabase
    .from("ratings")
    .select("id")
    .eq("project_id", projectId)
    .eq("from_user_id", user.id)
    .maybeSingle();

  if (existingRating) {
    return { error: "Anda sudah memberi rating untuk proyek ini." };
  }

  const { error } = await supabase.from("ratings").insert({
    project_id: projectId,
    from_user_id: user.id,
    to_user_id: toUserId,
    stars,
    comment: comment || null,
  });

  if (error) {
    return { error: error.message };
  }

  const publicPath = `/projects/${project.slug ?? projectId}`;
  revalidatePath(publicPath);
  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(
    profile.role === "partner"
      ? `/dashboard/projects/${projectId}?rated=1`
      : `${publicPath}?rated=1`
  );
}