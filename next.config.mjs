/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Lamaran proyek upload maks 3 file portofolio (5 MB/file) via Server Action
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
