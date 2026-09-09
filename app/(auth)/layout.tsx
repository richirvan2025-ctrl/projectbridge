// Layout untuk halaman autentikasi (/login, /signup).
// Hanya menyediakan shell kartu sederhana.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk / Daftar — ProjectBridge",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
