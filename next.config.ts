import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  env: { NEXT_PUBLIC_SITE_MODE: process.env.SITE_MODE || "preview" },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  images: { unoptimized: true },
  transpilePackages: ["@hacktoolkit/nextjs-htk"],
};
export default config;
