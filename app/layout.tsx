import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectBridge — Marketplace Proyek Kampus IDB Bali",
  description:
    "Mempertemukan mahasiswa IDB Bali dengan UMKM dan studio kreatif lokal untuk proyek riil yang fleksibel dan bisa dikonversi SKS.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
