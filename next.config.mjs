/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Photos uploaded to Supabase Storage are served from the Supabase domain.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
