import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Required so D1, KV, and R2 bindings resolve in `next dev` (via Miniflare). The
// storefront reads bindings in development, so unlike a binding-free app this is
// always initialized.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Catalog media is served from R2 via Cloudflare image resizing; the custom
  // loader is wired in the catalog milestone. Do not use Next's default
  // sharp-based optimizer (it does not run on Workers).
};

export default nextConfig;
