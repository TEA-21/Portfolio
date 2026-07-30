/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required: Next.js 14 cannot process the ESM packages in the Three.js
  // ecosystem without explicit transpilation.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
