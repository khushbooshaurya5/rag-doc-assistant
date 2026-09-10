/** @type {import('next').NextConfig} */
const nextConfig = {
  // unpdf ships as ESM; keep it external so it isn't mis-bundled in server routes.
  experimental: { serverComponentsExternalPackages: ["unpdf"] },
};
export default nextConfig;
