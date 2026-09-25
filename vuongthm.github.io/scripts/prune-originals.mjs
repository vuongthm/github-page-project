import fs from "node:fs"
import path from "node:path"

/**
 * Trims the exported `out/` directory before it is uploaded to GitHub Pages.
 *
 * `scripts/optimize-images.mjs` deliberately keeps the original bitmaps in
 * `public/` so a missing `sharp` install can never break the site. The cost is
 * that the static export contains both `cover.png` (8.8 MB) and `cover.webp`
 * (342 KB), and GitHub Pages serves whichever the HTML asks for — but both still
 * count against the published artefact and the repo's storage.
 *
 * This script deletes an original only when the built output never mentions it.
 * The check reads every text artefact (HTML, JS, CSS, JSON, XML) once and tests
 * it as a single string, so the decision is based on the real compiled output
 * rather than on assumptions about which references were rewritten.
 *
 * Safe by construction: if anything still points at `foo.png`, `foo.png` stays.
 * Run it with `--dry-run` to see what it would remove.
 */

const projectRoot = path.resolve(import.meta.dirname, "..")
const OUT_DIR = path.join(projectRoot, "out")
const DRY_RUN = process.argv.includes("--dry-run")

/** Text artefacts that can reference an image. */
const TEXT_EXTENSIONS = new Set([".html", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".webmanifest"])

/** Image formats that have a WebP sibling generated for them. */
const ORIGINAL_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"])

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

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`
}

function main() {
  if (!fs.existsSync(OUT_DIR)) {
    console.log("[Prune] No out/ directory — run `pnpm build` first.")
    return
  }

  const files = walk(OUT_DIR)

  // One pass over every text artefact, concatenated into a single haystack.
  let haystack = ""
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) continue
    haystack += fs.readFileSync(file, "utf-8")
  }

  /**
   * Matches the filename as a whole token.
   *
   * A plain `includes()` is not good enough: `1.png` is a substring of
   * `photo-1.png`, so a referenced photo would keep an unreferenced `1.png`
   * alive forever. The boundary class also rules out `-` and `_`, which are the
   * characters that make `album-1.png` look like a match for `1.png`.
   */
  const isReferenced = (name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`(^|[^\\w-])${escaped}([^\\w-]|$)`).test(haystack)
  }

  let removed = 0
  let kept = 0
  let saved = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!ORIGINAL_EXTENSIONS.has(ext)) continue

    const webpSibling = file.replace(/\.(png|jpe?g)$/i, ".webp")
    if (!fs.existsSync(webpSibling)) continue

    const name = path.basename(file)
    const relative = path.relative(OUT_DIR, file)

    if (isReferenced(name)) {
      kept++
      console.log(`[Prune] Kept    ${relative} (still referenced, no .webp equivalent in use)`)
      continue
    }

    const size = fs.statSync(file).size
    if (!DRY_RUN) fs.unlinkSync(file)
    removed++
    saved += size
    console.log(`[Prune] Removed ${relative}  ${formatKb(size)}`)
  }

  const prefix = DRY_RUN ? "[Prune] (dry run) " : "[Prune] "
  console.log(
    `\n${prefix}${removed} original(s) removed (${formatKb(saved)}), ${kept} kept because they are still referenced.`,
  )
}

main()
