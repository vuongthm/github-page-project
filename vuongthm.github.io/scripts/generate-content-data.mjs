import fs from "fs";
import path from "path";
import crypto from "crypto";
import { parse as parseYaml } from "yaml";
import { createVault } from "../lib/crypto.mjs";

/** Project root = this repo. `content/` and `public/` live directly under it. */
const projectRootDir = path.resolve(import.meta.dirname, "..");

/* ------------------------------------------------------------------ *
 * Build cache
 * ------------------------------------------------------------------ */

/**
 * Skips regeneration when nothing that affects the output has changed.
 *
 * Why this matters: the output embeds AES-GCM ciphertexts, and both the salt
 * and the IV are random, so *writing the file always produces a different
 * file*. Turbopack treats a changed module as a cache miss, which invalidated
 * the development filesystem cache on every `pnpm dev` and forced a full
 * recompile of the whole route tree.
 *
 * Comparing a fingerprint of the inputs and leaving the existing output in
 * place keeps the generated module byte-identical between runs, so the dev
 * server only recompiles when the content actually changed.
 *
 * Pass `--force` to regenerate unconditionally.
 */
const FORCE = process.argv.includes("--force");
const CACHE_DIR = path.join(projectRootDir, ".cache");
const FINGERPRINT_FILE = path.join(CACHE_DIR, "content-fingerprint.json");
const OUTPUT_PATH = path.join(projectRootDir, "lib/content.generated.ts");

/** Bump when the shape of the generated file changes, to force a rebuild. */
const OUTPUT_FORMAT_VERSION = 2;

function listFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function computeFingerprint() {
  const hash = crypto.createHash("sha256");
  hash.update(`format:${OUTPUT_FORMAT_VERSION}`);

  // 1. Every content file: relative path plus contents.
  for (const file of listFiles(path.join(projectRootDir, "content")).sort()) {
    hash.update(`content:${path.relative(projectRootDir, file)}`);
    hash.update(fs.readFileSync(file));
  }

  // 2. The password map — it decides what gets encrypted.
  const passwordsPath = path.join(projectRootDir, "passwords.json");
  hash.update(fs.existsSync(passwordsPath) ? fs.readFileSync(passwordsPath) : "no-passwords");

  // 3. This script itself, so editing the generator always invalidates the cache.
  hash.update(fs.readFileSync(new URL(import.meta.url)));

  // 4. Which WebP variants exist — `preferWebp()` decisions depend on them.
  for (const file of listFiles(path.join(projectRootDir, "public", "media"))
    .filter((file) => file.toLowerCase().endsWith(".webp"))
    .sort()) {
    hash.update(`webp:${path.relative(projectRootDir, file)}`);
  }

  return hash.digest("hex");
}

function readStoredFingerprint() {
  try {
    return JSON.parse(fs.readFileSync(FINGERPRINT_FILE, "utf-8")).fingerprint ?? null;
  } catch {
    return null;
  }
}

function storeFingerprint(fingerprint) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(
    FINGERPRINT_FILE,
    `${JSON.stringify({ fingerprint, generatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

/* ------------------------------------------------------------------ *
 * Frontmatter
 * ------------------------------------------------------------------ */

/**
 * Parses the YAML frontmatter block of a markdown file.
 *
 * This used to be a hand-written line splitter that broke on any value
 * containing a colon, a multi-line string or a nested list. `yaml` handles the
 * full spec; we only normalise dates back to plain `YYYY-MM-DD` strings so the
 * generated TypeScript keeps the `date: string` shape the UI expects.
 */
function parseFrontmatter(fileContent) {
  const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---/;
  const match = fileContent.match(frontmatterRegex);
  if (!match) return { data: {}, body: fileContent };

  const body = fileContent.replace(frontmatterRegex, "").trim();

  let parsed;
  try {
    parsed = parseYaml(match[1]) ?? {};
  } catch (error) {
    console.warn(`[Frontmatter] Invalid YAML, frontmatter ignored: ${error.message}`);
    return { data: {}, body };
  }

  const data = {};
  for (const [key, value] of Object.entries(parsed)) {
    data[key] = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  }

  return { data, body };
}

/* ------------------------------------------------------------------ *
 * Vaults (content encryption)
 * ------------------------------------------------------------------ */

/**
 * One vault per password, reused for the whole build.
 *
 * All payloads produced from the same password share a salt, so the client can
 * decrypt an entire page (every album, every chapter field) with a single key
 * derivation instead of one PBKDF2 run per field.
 */
const vaultCache = new Map();

async function vaultFor(password) {
  const key = String(password).trim();
  if (!vaultCache.has(key)) {
    vaultCache.set(key, await createVault(key));
  }
  return vaultCache.get(key);
}

/** Encrypts one field with the vault belonging to `password`. */
async function encryptField(password, value) {
  if (!password) return value;
  const vault = await vaultFor(password);
  return vault.encrypt(String(value));
}

/* ------------------------------------------------------------------ *
 * Images
 * ------------------------------------------------------------------ */

/**
 * Points a reference at the WebP variant when one exists.
 *
 * `scripts/optimize-images.mjs` runs before this script, so the variant is on
 * disk by now. When the optimisation step was skipped (no `sharp` installed)
 * the original path is returned unchanged and nothing breaks.
 */
function preferWebp(src) {
  if (typeof src !== "string" || !/\.(png|jpe?g)$/i.test(src)) return src;

  const absolute = path.join(projectRootDir, "public", src.replace(/^\/+/, ""));
  const webp = absolute.replace(/\.(png|jpe?g)$/i, ".webp");
  if (!fs.existsSync(webp)) return src;

  return src.replace(/\.(png|jpe?g)$/i, ".webp");
}

/** Rewrites markdown image syntax so in-article images use WebP too. */
function preferWebpInMarkdown(markdown) {
  if (typeof markdown !== "string") return markdown;
  return markdown.replace(
    /(!\[[^\]]*\]\()([^)\s]+)(\))/g,
    (_match, open, url, close) => `${open}${preferWebp(url)}${close}`,
  );
}

async function generateData() {
  const contentDir = path.join(projectRootDir, "content");

  const fingerprint = computeFingerprint();

  // Cache hit: leave the existing module untouched so the bundler's cache stays
  // valid. Writing an identical-but-re-encrypted file would defeat the purpose.
  if (!FORCE && fs.existsSync(OUTPUT_PATH) && readStoredFingerprint() === fingerprint) {
    console.log("[Generate] Inputs unchanged — reusing lib/content.generated.ts (cache hit).");
    return;
  }

  const allSeries = [];
  const allChapters = [];
  const allNotes = [];
  const allAlbums = [];

  let passwordMap = {};
  const passwordMapPath = path.join(projectRootDir, "passwords.json");
  if (fs.existsSync(passwordMapPath)) {
    try {
      passwordMap = JSON.parse(fs.readFileSync(passwordMapPath, "utf-8"));
      console.log("[Encrypt] Successfully loaded passwords.json");
    } catch (err) {
      console.error("[Encrypt] Error parsing passwords.json:", err);
    }
  }

  // Pre-detect locked status of all series by checking their localized series.md files
  const lockedSeriesMap = {};
  const storiesDir = path.join(contentDir, "stories");
  if (fs.existsSync(storiesDir)) {
    const seriesFolders = fs.readdirSync(storiesDir);
    for (const seriesSlug of seriesFolders) {
      const seriesPath = path.join(storiesDir, seriesSlug);
      if (!fs.statSync(seriesPath).isDirectory()) continue;
      
      // Check both locale subfolders for series.md
      for (const lang of ["en", "vi"]) {
        const configPath = path.join(seriesPath, lang, "series.md");
        if (fs.existsSync(configPath)) {
          const { data } = parseFrontmatter(fs.readFileSync(configPath, "utf-8"));
          if (data.locked === "true" || data.locked === true) {
            lockedSeriesMap[seriesSlug] = true;
            break; // Stop checking other locales if locked is detected
          }
        }
      }
    }
  }

  if (fs.existsSync(contentDir)) {
    // 1. Scan Stories Content
    if (fs.existsSync(storiesDir)) {
      const seriesFolders = fs.readdirSync(storiesDir);
      for (const seriesSlug of seriesFolders) {
        const seriesPath = path.join(storiesDir, seriesSlug);
        if (!fs.statSync(seriesPath).isDirectory()) continue;

        const isSeriesLocked = !!lockedSeriesMap[seriesSlug];
        const seriesPassword = passwordMap[seriesSlug];

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(seriesPath, lang);
          if (fs.existsSync(langPath)) {
            const seriesMdFile = path.join(langPath, "series.md");
            if (fs.existsSync(seriesMdFile)) {
              const { data } = parseFrontmatter(fs.readFileSync(seriesMdFile, "utf-8"));
              
              // Keep series description as unencrypted plaintext to prevent home page SeriesCard from showing ciphertext
              const seriesDesc = data.description || "";

              allSeries.push({
                slug: seriesSlug,
                title: data.title || seriesSlug,
                description: seriesDesc,
                coverImage: preferWebp(data.coverImage || ""),
                chapterCount: 0,
                status: data.status || "ongoing",
                tags: data.tags || [],
                startDate: data.date || "",
                isLocked: isSeriesLocked,
                lang: lang
              });
            }

            const files = fs.readdirSync(langPath).filter(f => f.endsWith(".md") && f !== "series.md");
            for (const file of files) {
              const filePath = path.join(langPath, file);
              const rawContent = fs.readFileSync(filePath, "utf-8");
              const { data, body } = parseFrontmatter(rawContent);

              let chapterContent = body;
              let chapterTitle = data.title || file;
              let chapterPreview = data.preview || "";
              let isChapterLocked = isSeriesLocked || data.locked === "true" || data.locked === true;

              // Chapters in a locked series inherit the series password, otherwise use individual password
              const lookupKey = isSeriesLocked ? seriesSlug : file.replace(".md", "");
              const securePassword = passwordMap[lookupKey];

              if (isChapterLocked && securePassword) {
                chapterContent = await encryptField(securePassword, preferWebpInMarkdown(body));
                chapterTitle = await encryptField(securePassword, chapterTitle);
                chapterPreview = await encryptField(securePassword, chapterPreview);
              } else {
                // Unlocked chapters still benefit from WebP image references.
                chapterContent = preferWebpInMarkdown(chapterContent);
              }

              allChapters.push({
                slug: file.replace(".md", ""),
                seriesSlug: seriesSlug,
                part: parseInt(data.part) || 1,
                title: chapterTitle,
                preview: chapterPreview,
                date: data.date || "",
                content: chapterContent,
                isLocked: isChapterLocked,
                lang: lang
              });
            }
          }
        }
      }
    }

    allSeries.forEach(s => {
      s.chapterCount = allChapters.filter(c => c.seriesSlug === s.slug && c.lang === s.lang).length;
    });

    // 2. Scan Notes Content
    const notesDir = path.join(contentDir, "notes");
    if (fs.existsSync(notesDir)) {
      const noteFolders = fs.readdirSync(notesDir);
      for (const category of noteFolders) {
        const catPath = path.join(notesDir, category);
        if (!fs.statSync(catPath).isDirectory()) continue;

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(catPath, lang);
          if (fs.existsSync(langPath)) {
            const files = fs.readdirSync(langPath).filter(f => f.endsWith(".md"));
            for (const file of files) {
              const filePath = path.join(langPath, file);
              const rawContent = fs.readFileSync(filePath, "utf-8");
              const { data, body } = parseFrontmatter(rawContent);

              const words = body.trim().split(/\s+/).filter(Boolean).length;
              const readingTime = Math.max(1, Math.round(words / 200));

              let noteContent = preferWebpInMarkdown(body);
              let isLocked = false;
              if (data.locked === "true" || data.locked === true) {
                isLocked = true;
                const noteSlug = file.replace(".md", "");
                const securePassword = passwordMap[noteSlug];

                if (securePassword) {
                  noteContent = await encryptField(securePassword, noteContent);
                } else {
                  console.warn(`[Encrypt] Password not found for note: ${noteSlug}`);
                }
              }

              allNotes.push({
                slug: file.replace(".md", ""),
                title: data.title || file,
                description: data.description || "",
                tags: data.tags || [],
                date: data.date || "",
                readingTime: readingTime,
                content: noteContent,
                weight: parseInt(data.weight) || 999,
                isLocked: isLocked,
                lang: lang
              });
            }
          }
        }
      }
    }

    // 3. Scan dynamic Decoupled Albums (Support Page-Level Lock)
    const albumsDir = path.join(contentDir, "albums");
    if (fs.existsSync(albumsDir)) {
      const albumFolders = fs.readdirSync(albumsDir);
      for (const albumSlug of albumFolders) {
        const albumPath = path.join(albumsDir, albumSlug);
        if (!fs.statSync(albumPath).isDirectory()) continue;

        const albumPagePassword = passwordMap["my-album"];
        const isAlbumLocked = !!albumPagePassword;

        for (const lang of ["en", "vi"]) {
          const langPath = path.join(albumPath, lang);
          if (fs.existsSync(langPath)) {
            const albumMdFile = path.join(langPath, "album.md");
            if (fs.existsSync(albumMdFile)) {
              const { data, body } = parseFrontmatter(fs.readFileSync(albumMdFile, "utf-8"));
              
              const mediaItems = [];
              const mediaPublicDir = path.join(projectRootDir, `public/media/albums/${albumSlug}`);
              const metaJsonPath = path.join(mediaPublicDir, "metadata.json");
              
              let fileMetadata = {};
              if (fs.existsSync(metaJsonPath)) {
                const rawMetadata = fs.readFileSync(metaJsonPath, "utf-8").trim();
                if (rawMetadata) {
                  try {
                    fileMetadata = JSON.parse(rawMetadata);
                  } catch (e) {
                    // An empty or malformed metadata.json is not fatal: media
                    // still renders using the filename as the title.
                    console.warn(`[Album] Ignoring invalid metadata.json for ${albumSlug}: ${e.message}`);
                  }
                }
              }

              let firstImageFile = "";
              if (fs.existsSync(mediaPublicDir)) {
                const allMediaFiles = fs.readdirSync(mediaPublicDir).filter(f => {
                  const ext = path.extname(f).toLowerCase();
                  return [".png", ".jpg", ".jpeg", ".webp", ".mp4", ".webm"].includes(ext);
                });

                // `optimize-images.mjs` writes `photo.png` and `photo.webp` side by
                // side. Without this filter every optimised photo would be listed
                // twice in the album.
                const mediaFiles = allMediaFiles.filter((name) => {
                  if (!/\.(png|jpe?g)$/i.test(name)) return true;
                  const webpSibling = name.replace(/\.(png|jpe?g)$/i, ".webp");
                  return !allMediaFiles.includes(webpSibling);
                });

                const imageFile = mediaFiles.find(f => {
                  const ext = path.extname(f).toLowerCase();
                  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
                });
                if (imageFile) {
                  firstImageFile = preferWebp(`/media/albums/${albumSlug}/${imageFile}`);
                }

                for (const filename of mediaFiles) {
                  const ext = path.extname(filename).toLowerCase();
                  const isVideo = [".mp4", ".webm"].includes(ext);

                  // metadata.json is authored against the original filenames, so
                  // fall back to the pre-optimisation name when looking entries up.
                  const customMeta =
                    fileMetadata[filename] ||
                    fileMetadata[filename.replace(/\.webp$/i, ".png")] ||
                    {};
                  const itemTitle = (customMeta.title && customMeta.title[lang]) || filename;
                  const itemDate = customMeta.date || data.date || "2024-01-01";
                  const itemNote = (customMeta.note && customMeta.note[lang]) || "";

                  mediaItems.push({
                    filename: filename,
                    src: preferWebp(`/media/albums/${albumSlug}/${filename}`),
                    type: isVideo ? "video" : "image",
                    title: itemTitle,
                    date: itemDate,
                    note: itemNote
                  });
                }
              }

              let albumDescription = data.description || "";
              let albumContent = preferWebpInMarkdown(body);
              let serializedMedia = JSON.stringify(mediaItems);

              // Encrypt album metadata, narratives and the media list at build
              // time with AES-256-GCM. The client derives the key once and
              // decrypts all three fields in a single pass.
              if (isAlbumLocked && albumPagePassword) {
                albumDescription = await encryptField(albumPagePassword, albumDescription);
                albumContent = await encryptField(albumPagePassword, albumContent);
                serializedMedia = await encryptField(albumPagePassword, serializedMedia);
              }

              allAlbums.push({
                slug: albumSlug,
                title: data.title || albumSlug,
                description: albumDescription,
                coverImage: preferWebp(data.coverImage || firstImageFile || `/media/albums/${albumSlug}/photo-1.png`),
                date: data.date || "2024-01-01",
                lang: lang,
                content: albumContent,
                media: isAlbumLocked ? serializedMedia : mediaItems,
                isLocked: isAlbumLocked,
                lang: lang
              });
            }
          }
        }
      }
    }
  }

  const outputCode = `// Generated automatically. Do not edit.
export type Lang = "en" | "vi";

export interface Series {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  chapterCount: number;
  status: "ongoing" | "completed";
  tags: string[];
  startDate: string;
  isLocked?: boolean; // Added optional isLocked parameter
  lang: Lang;
}

export interface Chapter {
  slug: string;
  seriesSlug: string;
  part: number;
  title: string;
  preview: string;
  date: string;
  content: string;
  isLocked?: boolean;
  lang: Lang;
}

export interface Note {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  readingTime: number;
  content: string;
  weight?: number; // Added optional weight parameter
  isLocked?: boolean;
  lang: Lang;
}

export interface AlbumMediaItem {
  filename: string;
  src: string;
  type: "image" | "video";
  title: string;
  date: string;
  note: string;
}

export interface Album {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  lang: Lang;
  content: string;
  media: AlbumMediaItem[] | string;
  isLocked?: boolean;
}

export interface TagInfo {
  tag: string;
  count: number;
}

export const allSeries: Series[] = ${JSON.stringify(allSeries, null, 2)};
export const allChapters: Chapter[] = ${JSON.stringify(allChapters, null, 2)};
export const allNotes: Note[] = ${JSON.stringify(allNotes, null, 2)};
export const allAlbums: Album[] = ${JSON.stringify(allAlbums, null, 2)};

function groupBySlug<T extends { slug: string; lang: Lang }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const bucket = grouped.get(item.slug) ?? []
    bucket.push(item)
    grouped.set(item.slug, bucket)
  }
  return grouped
}

function selectByLang<T extends { slug: string; lang: Lang }>(items: T[], lang: Lang): T[] {
  return Array.from(groupBySlug(items).values()).map((bucket) => bucket.find((item) => item.lang === lang) ?? bucket[0])
}

function selectOne<T extends { slug: string; lang: Lang }>(items: T[], slug: string, lang: Lang): T | undefined {
  const matches = items.filter((item) => item.slug === slug)
  return matches.find((item) => item.lang === lang) ?? matches[0]
}

export function getSeriesBySlug(slug: string, lang: Lang = "en"): Series | undefined {
  return selectOne(allSeries, slug, lang)
}

export function getVisibleSeries(lang: Lang = "en"): Series[] {
  return selectByLang(allSeries, lang).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
}

export function getChaptersBySeriesSlug(seriesSlug: string, lang: Lang = "en"): Chapter[] {
  const exact = allChapters.filter((chapter) => chapter.seriesSlug === seriesSlug && chapter.lang === lang)
  const chosen = exact.length > 0 ? exact : allChapters.filter((chapter) => chapter.seriesSlug === seriesSlug)
  return [...chosen].sort((a, b) => a.part - b.part)
}

export function getChapter(seriesSlug: string, chapterSlug: string, lang: Lang = "en"): Chapter | undefined {
  return getChaptersBySeriesSlug(seriesSlug, lang).find((chapter) => chapter.slug === chapterSlug)
}

export function getNoteBySlug(slug: string, lang: Lang = "en"): Note | undefined {
  return selectOne(allNotes, slug, lang)
}

// Double sort algorithm: Prioritize custom weight ASC, then sort secondarily by date DESC
export function getVisibleNotes(lang: Lang = "en"): Note[] {
  return selectByLang(allNotes, lang).sort((a, b) => {
    const wA = a.weight ?? 999;
    const wB = b.weight ?? 999;
    if (wA !== wB) return wA - wB;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getRelatedNotes(note: Note, limit = 3): Note[] {
  return getVisibleNotes(note.lang)
    .filter((item) => item.slug !== note.slug && item.tags.some((tag) => note.tags.includes(tag)))
    .slice(0, limit)
}

export function getVisibleAlbums(lang: Lang = "en"): Album[] {
  return selectByLang(allAlbums, lang).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAlbumBySlug(slug: string, lang: Lang = "en"): Album | undefined {
  return selectOne(allAlbums, slug, lang)
}

export function getAllTags(lang: Lang = "en"): TagInfo[] {
  const counts: Record<string, number> = {}
  for (const series of getVisibleSeries(lang)) {
    for (const tag of series.tags) counts[tag] = (counts[tag] ?? 0) + 1
  }
  for (const note of getVisibleNotes(lang)) {
    for (const tag of note.tags) counts[tag] = (counts[tag] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

// Enhanced double-type tag sorting: Keep learning roadmap sequence intact
export function getPostsByTag(tag: string, lang: Lang = "en"): Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> {
  const posts: Array<{ type: "story"; item: Series } | { type: "note"; item: Note }> = []
  for (const series of getVisibleSeries(lang)) {
    if (series.tags.includes(tag)) posts.push({ type: "story", item: series })
  }
  for (const note of getVisibleNotes(lang)) {
    if (note.tags.includes(tag)) posts.push({ type: "note", item: note })
  }
  return posts.sort((a, b) => {
    if (a.type === "note" && b.type === "note") {
      const wA = (a.item as Note).weight ?? 999;
      const wB = (b.item as Note).weight ?? 999;
      if (wA !== wB) return wA - wB;
    }
    const dateA = a.type === "story" ? a.item.startDate : a.item.date;
    const dateB = b.type === "story" ? b.item.startDate : b.item.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
}

export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function formatDate(dateStr: string, lang: Lang = "en"): string {
  const date = new Date(dateStr)
  if (lang === "vi") {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}
`;

  fs.mkdirSync(path.join(projectRootDir, "lib"), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, outputCode);
  storeFingerprint(fingerprint);
  console.log("[Generate] lib/content.generated.ts compiled successfully.");
}

await generateData();