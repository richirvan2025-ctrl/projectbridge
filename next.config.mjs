/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Lamaran proyek upload maks 3 file portofolio (5 MB/file) => 15 MB
      // total via Server Action.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
