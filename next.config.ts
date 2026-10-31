import type { NextConfig } from "next";
const basePath = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? "";
if (
  basePath &&
  (!/^\/(?:[A-Za-z0-9._~-]+\/)*[A-Za-z0-9._~-]+$/.test(basePath) ||
    basePath === "/")
) {
  throw new Error(
    "NEXT_PUBLIC_APP_BASE_PATH must be a path prefix such as /school/learn, without a trailing slash.",
  );
}
const nextConfig: NextConfig = {
  poweredByHeader: false,
  basePath,
  async headers() {
    return [
      {
        source: "/cpp/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'none'",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};
export default nextConfig;
