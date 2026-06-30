/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NEXT_PUBLIC_RAWG_BASE_URL는 공개 URL이므로 기본값을 빌드에 내장한다.
  // Vercel/로컬에서 별도 등록 없이도 동작하며, 프록시 교체 시만 env 오버라이드하면 된다.
  env: {
    NEXT_PUBLIC_RAWG_BASE_URL: "https://api.rawg.io/api",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "api.rawg.io" },
    ],
  },
};

export default nextConfig;
