/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — the whole site is prerendered at build time so it can be
  // served from GitHub Pages with no runtime Node server.
  output: "export",
  trailingSlash: true,

  // Static export cannot run the image optimiser, so `scripts/optimize-images.mjs`
  // generates WebP variants at build time instead (see package.json scripts).
  images: {
    unoptimized: true,
  },

  // React Strict Mode double-invokes render and effects in development. Next
  // leaves it OFF when this option is unset (`null` → `__NEXT_STRICT_MODE=false`),
  // and on a 1 GHz laptop CPU the doubled work is very noticeable. Keep the
  // framework default; set this to `true` deliberately when you want the extra
  // dev-time warnings.
  reactStrictMode: false,

  experimental: {
    // Number of build workers. Next defaults to `cpuCount - 1`, which is 7 on an
    // 8-thread machine — enough parallel PostCSS/Tailwind work to saturate the
    // CPU and swap the laptop. Two keeps local builds responsive.
    cpus: 2,
  },

  // Without this, Next walks up the directory tree, finds the stale
  // `pnpm-lock.yaml` one level above this repo, and reports the wrong
  // workspace root. Pinning it keeps the build reproducible and silences
  // the "inferred your workspace root" warning.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
