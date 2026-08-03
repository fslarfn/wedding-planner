import type { NextConfig } from "next";

// Foto galeri di-upload apa adanya dari kamera/HP (ada yang 4000x6000, 24MB) padahal
// hanya ditampilkan beberapa ratus piksel. Izinkan host Supabase Storage lewat
// next/image supaya Vercel yang me-resize dan mengubahnya ke AVIF/WebP.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
