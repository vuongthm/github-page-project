import fs from "node:fs"
import path from "node:path"

/**
 * Build-time image optimizer.
 *
 * Why this is necessary: the site is a static export, so `next/image` cannot
 * optimise anything at runtime (`images.unoptimized` is forced to true). The
 * repository was publishing 48 MB of bitmaps — a 5.2 MB avatar rendered in a
 * 48 px box, and an 8.8 MB story cover image.
 *
 * This script produces WebP variants next to the originals, and
 * `scripts/generate-content-data.mjs` then rewrites content references to
 * point at them.
 *
 * Design rules:
 *   - Non-destructive: originals are never deleted, so a missing `sharp`
 *     install can never break the site.
 *   - Idempotent: a variant is skipped when it already exists and is newer
 *     than its source, which keeps repeat builds fast.
 *   - Optional: if `sharp` is unavailable the script warns and exits 0.
 */

const projectRoot = path.resolve(import.meta.dirname, "..")
const PUBLIC_DIR = path.join(projectRoot, "public")

/** Only files above this size are worth converting. */
const MIN_SOURCE_BYTES = 80 * 1024

/** Already compressed, vector, or not a bitmap. */
const SKIP_EXTENSIONS = new Set([
  ".svg",
  ".ico",
  ".webp",
  ".avif",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
])

/**
 * Per-path output rules. First match wins.
 * Tune the image pipeline here rather than in components — components only
 * ever reference a filename.
 */
const OUTPUT_RULES = [
  { test: /avatar\.png$/i, width: 320, quality: 86 },
  { test: /\/about\//i, width: 1200, quality: 80 },
  { test: /\/hometown\//i, width: 1800, quality: 80 },
  { test: /\/covers\//i, width: 1200, quality: 80 },
  { test: /\/media\/stories\//i, width: 1600, quality: 80 },
  { test: /\/media\/notes\//i, width: 1400, quality: 78 },
  { test: /\/media\/albums\//i, width: 1920, quality: 80 },
]

const FALLBACK_RULE = { width: 1600, quality: 80 }

function ruleFor(filePath) {
  return OUTPUT_RULES.find((rule) => rule.test.test(filePath)) ?? FALLBACK_RULE
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

async function loadSharp() {
  try {
    const mod = await import("sharp")
    return mod.default ?? mod
  } catch {
    return null
  }
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`
}

async function convert(sharp, file) {
  const stats = fs.statSync(file)
  if (stats.size < MIN_SOURCE_BYTES) return null

  const target = file.replace(/\.(png|jpe?g)$/i, ".webp")
  if (target === file) return null

  // Re-build only when the source changed; otherwise reuse the existing variant.
  if (fs.existsSync(target) && fs.statSync(target).mtimeMs >= stats.mtimeMs) {
    return { skipped: true }
  }

  const { width, quality } = ruleFor(file)

  try {
    await sharp(file)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(target)
  } catch (error) {
    console.warn(`[Images] Failed on ${path.relative(projectRoot, file)}: ${error.message}`)
    return null
  }

  const outputSize = fs.statSync(target).size
  console.log(
    `[Images] ${path.relative(projectRoot, file)}  ${formatKb(stats.size)} → ${formatKb(outputSize)}`,
  )

  return { before: stats.size, after: outputSize }
}

/**
 * Reports bitmaps large enough that shipping them untouched is likely a
 * mistake. Purely informational — nothing is deleted automatically.
 */
function reportHeavyRemainder(files) {
  const heavy = files.filter((file) => fs.statSync(file).size > 400 * 1024)
  if (heavy.length === 0) return

  const total = heavy.reduce((sum, file) => sum + fs.statSync(file).size, 0)
  console.log(
    `\n[Images] ${heavy.length} bitmap(s) over 400 KB are still published (${formatKb(total)}).`,
  )
  console.log(
    "[Images] References should point at the generated .webp files to avoid shipping these.",
  )
}

async function main() {
  const sharp = await loadSharp()

  if (!sharp) {
    console.warn(
      "[Images] `sharp` is not installed — skipping optimisation.\n" +
        "         Run `pnpm add -D sharp` to enable WebP generation.",
    )
    return
  }

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log("[Images] No public/ directory yet, nothing to do.")
    return
  }

  const files = walk(PUBLIC_DIR).filter(
    (file) => !SKIP_EXTENSIONS.has(path.extname(file).toLowerCase()),
  )

  let converted = 0
  let skipped = 0
  let before = 0
  let after = 0

  for (const file of files) {
    const result = await convert(sharp, file)
    if (!result) continue
    if (result.skipped) {
      skipped++
      continue
    }
    converted++
    before += result.before
    after += result.after
  }

  if (converted > 0) {
    const saved = before - after
    const ratio = before > 0 ? ((saved / before) * 100).toFixed(0) : "0"
    console.log(
      `\n[Images] ${converted} file(s) converted: ${formatKb(before)} → ${formatKb(after)} ` +
        `(−${formatKb(saved)}, −${ratio}%)`,
    )
  } else {
    console.log(`[Images] Up to date (${skipped} file(s) already optimised).`)
  }

  reportHeavyRemainder(files)
}

await main()

