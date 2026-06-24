import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Required so the control, staging, and production D1 bindings resolve in dev.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
