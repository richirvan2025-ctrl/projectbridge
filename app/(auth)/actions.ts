"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | undefined;

/**
 * Sign in dengan email + password.
 * Setelah berhasil: redirect ke dashboard sesuai role.
 */
export async function signInAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Ambil role untuk tentukan tujuan redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "partner") {
      redirect("/dashboard");
    } else if (profile?.role === "campus") {
      redirect("/campus");
    } else {
      redirect("/student");
    }
  }

  redirect("/");
}

/**
 * Sign up sebagai student atau partner.
 * Data profil dikirim via options.data agar trigger handle_new_user()
 * di database bisa memasukkannya ke tabel public.users.
 */
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const role = String(formData.get("role") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const prodi = String(formData.get("prodi") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();

  // Validasi dasar di server (defense in depth — client juga validasi)
  if (role !== "student" && role !== "partner") {
    return { error: "Peran tidak valid." };
  }
  if (!name || !email || !password) {
    return { error: "Nama, email, dan password wajib diisi." };
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }
  if (role === "student" && !prodi) {
    return { error: "Prodi wajib dipilih." };
  }
  if (role === "partner" && !businessName) {
    return { error: "Nama usaha wajib diisi." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
        ...(role === "student" ? { prodi } : { business_name: businessName }),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Konfirmasi email nonaktif (sesuai setup Milestone 2), jadi user
  // langsung signed in. Redirect ke dashboard sesuai role.
  redirect(role === "partner" ? "/dashboard" : "/student");
}

/**
 * Sign out. Dipanggil dari SiteHeader via form biasa.
 */
export async function signOutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
