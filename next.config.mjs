/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required: Next.js 14 cannot process the ESM packages in the Three.js
  // ecosystem without explicit transpilation.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
