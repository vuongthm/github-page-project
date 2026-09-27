import fs from "node:fs"
import path from "node:path"

/**
 * Renders the brand mark in `public/icon.svg` to the raster icons the layout
 * references.
 *
 * Only run this when the mark itself changes: `pnpm icons`. The generated PNGs
 * are committed, so a normal build never depends on `sharp` being installed.
 *
 *   icon-light-32x32.png  favicon on light browser chrome (transparent bg, dark-blue mark)
 *   icon-dark-32x32.png   favicon on dark browser chrome (transparent bg, lighter-blue mark)
 *   apple-icon.png        180×180 home-screen icon (opaque, iOS ignores alpha)
 */

const projectRoot = path.resolve(import.meta.dirname, "..")
const PUBLIC_DIR = path.join(projectRoot, "public")
const SOURCE = path.join(PUBLIC_DIR, "icon.svg")

/** The dark-stroke variant: a lighter blue stroke so it remains legible on dark browser chrome. */
const DARK_STROKE_SVG = fs
  .readFileSync(SOURCE, "utf-8")
  .replace('stroke="#1d4ed8"', 'stroke="#60a5fa"')

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`[Icons] Missing ${path.relative(projectRoot, SOURCE)}`)
    process.exit(1)
  }

  let sharp
  try {
    const mod = await import("sharp")
    sharp = mod.default ?? mod
  } catch {
    console.error("[Icons] `sharp` is required: pnpm add -D sharp")
    process.exit(1)
  }

  const lightSvg = fs.readFileSync(SOURCE)
  const darkSvg = Buffer.from(DARK_STROKE_SVG)

  const jobs = [
    // Favicon: transparent background, waveform mark centred.
    { file: "icon-light-32x32.png", input: lightSvg, size: 32 },
    { file: "icon-dark-32x32.png", input: darkSvg, size: 32 },
    // iOS renders the home-screen icon on an opaque background, so the tile is
    // baked in rather than left transparent.
    { file: "apple-icon.png", input: lightSvg, size: 180, flatten: true },
  ]

  for (const job of jobs) {
    const target = path.join(PUBLIC_DIR, job.file)
    let pipeline = sharp(job.input).resize(job.size, job.size)

    if (job.flatten) {
      pipeline = pipeline.flatten({ background: "#1d4ed8" })
    }

    await pipeline.png({ compressionLevel: 9 }).toFile(target)

    const { size } = fs.statSync(target)
    console.log(`[Icons] ${job.file}  ${job.size}×${job.size}  ${(size / 1024).toFixed(1)} KB`)
  }

  console.log("\n[Icons] Done.")
}

await main()
