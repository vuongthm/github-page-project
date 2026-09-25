import { spawnSync } from "node:child_process"
import path from "node:path"

/**
 * Build pipeline orchestrator.
 *
 * Order matters and is the reason this file exists instead of a `&&` chain in
 * package.json:
 *
 *   1. sync-dev          — pulls content + media from the sibling repos
 *   2. optimize-images   — generates WebP variants next to every bitmap
 *   3. generate-content  — writes lib/content.generated.ts, rewriting image
 *                          references to the WebP files created in step 2
 *
 * Adding a future step (OG image generation, search index, …) means adding one
 * line to `steps`, not editing three npm scripts.
 *
 * Run with `--mode=dev` to skip work that only matters for production. That
 * mode is what `pnpm dev` uses: regenerating 20 WebP files costs several seconds
 * of pegged CPU on a low-power laptop, and dev serves the original bitmaps
 * anyway because `images.unoptimized` is on.
 */

const projectRoot = path.resolve(import.meta.dirname, "..")

const modeArg = process.argv.find((arg) => arg.startsWith("--mode="))
const MODE = modeArg ? modeArg.split("=")[1] : "build"
const isDev = MODE === "dev"

const FORCE = process.argv.includes("--force")

const steps = [
  {
    name: "Sync content",
    script: "sync-dev.mjs",
  },
  {
    name: "Optimize images",
    script: "optimize-images.mjs",
    // Opt-in, deliberately.
    //
    // Producing WebP variants is the single heaviest step of the pipeline: a
    // 32 MB batch pegs every core for ~20 seconds. Local builds should stay
    // light, so this runs only when asked:
    //   - `pnpm images`                      (one-off, explicit)
    //   - `pnpm build:optimized`             (full local build with images)
    //   - the CI workflow sets OPTIMIZE_IMAGES=1, where the runner has spare
    //     capacity and the optimised output is what actually gets published.
    enabled: process.env.OPTIMIZE_IMAGES === "1",
    skipMessage:
      "Skipped (set OPTIMIZE_IMAGES=1 to generate WebP variants; images stay PNG).",
  },
  {
    name: "Generate content data",
    script: "generate-content-data.mjs",
    // `--force` bypasses the generator's input fingerprint cache.
    args: FORCE ? ["--force"] : [],
  },
].filter((step) => step.hidden !== true)

if (isDev) {
  console.log(`\u25b6 Pipeline (dev mode)`)
}

let failed = false

for (const step of steps) {
  console.log(`\n\u25b6 ${step.name}`)

  if (step.enabled === false) {
    console.log(`  ${step.skipMessage ?? "Skipped."}`)
    continue
  }

  const result = spawnSync(
    process.execPath,
    [path.join(projectRoot, "scripts", step.script), ...(step.args ?? [])],
    { cwd: projectRoot, stdio: "inherit", env: process.env },
  )

  // A failing optional step must not break the build: content generation is the
  // only hard requirement.
  if (result.status !== 0 && step.script !== "optimize-images.mjs") {
    console.error(`\n\u2717 ${step.name} failed with exit code ${result.status}`)
    failed = true
    break
  }
}

if (failed) process.exit(1)
console.log("\n\u2713 Pipeline complete")

