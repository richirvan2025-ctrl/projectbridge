import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ProjectBridge — Marketplace Proyek Kampus IDB Bali",
  description:
    "Mempertemukan mahasiswa IDB Bali dengan UMKM dan studio kreatif lokal untuk proyek riil yang fleksibel dan bisa dikonversi SKS.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Baca user untuk SiteHeader. Kalau gagal, diamkan saja (header tetap
  // dirender dengan status "belum masuk") supaya error Supabase tidak
  // membuat seluruh layout crash.
  let headerUser: { name: string; role: "student" | "partner" | "campus" } | null =
    null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("name, role")
        .eq("id", user.id)
        .single<{ name: string; role: "student" | "partner" | "campus" }>();
      if (profile?.name && profile?.role) {
        headerUser = { name: profile.name, role: profile.role };
      }
    }
  } catch {
    // Supabase belum dikonfigurasi / error jaringan => header logged-out
  }

  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SiteHeader user={headerUser} />
        {children}
      </body>
    </html>
  );
}
