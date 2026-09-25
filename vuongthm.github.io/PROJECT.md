# Project Handoff Document

> **Mục đích file này:** bản tóm tắt đầy đủ để đưa cho một AI/developer khác (hoặc
> cho chính bạn sau vài tháng). Copy **toàn bộ** file này và dán vào ngữ cảnh của AI
> đó là nó hiểu dự án. Viết bằng tiếng Anh để đúng quy ước của `CONTRIBUTING.md`.
>
> **TL;DR (tiếng Việt):** Blog cá nhân của Vương (vuongthm) — **static site đa ngôn
> ngữ** build bằng Next.js 16, nhưng nội dung **không nằm trong repo này**. Nội dung
> tách ra các **repo GitHub riêng** (truyện, ghi chú, album) và được kéo vào lúc
> build. Một số nội dung **được mã hoá bằng mật khẩu ngay ở bước build**. Deploy lên
> GitHub Pages, hoàn toàn tĩnh, không có server.

---

## 1. What this project is

A **decoupled, multi-repository static site**: this repo contains only the engine and
the UI. All prose, images and videos live in **sibling repositories** pulled in at
build time. The output is a fully static site on GitHub Pages with no runtime server.

Two features make it more than a normal static blog:

1. **Build-time encryption.** Selected content (private notes, memoirs, photo albums)
   is encrypted with AES-256-GCM during the build, using passwords that never enter
   the repository. The ciphertext ships in the bundle and is decrypted in the browser
   after the reader enters the password.
2. **The engine is content-agnostic.** Adding a story, a note, a photo album or a
   whole new content repository requires **no application code change** — only
   markdown in a content repo and one line in `sync.config.json`.

---

## 2. Architecture

```
github-page-project/              <- workspace (a folder, not a git repo)
├── vuongthm.github.io/           <- THIS repo. Engine + UI + design system.
│                                   Public. Deployed to GitHub Pages.
├── stories/                      <- content repo (private): memoir series
├── network-notes/                <- content repo (private): tech notes
└── my-album/                     <- content repo (private): photo/video galleries
                                    (more gallery repos can be added — see §7)
```

The engine reaches **one directory up** to find the sibling content repos. This is the
single most important structural fact:

```js
// scripts/sync-dev.mjs
const projectRootDir   = path.resolve(__dirname, "..")        // vuongthm.github.io/
const workspaceRootDir = path.resolve(projectRootDir, "..")   // github-page-project/
```

**Consequence:** `pnpm dev` and `pnpm build` MUST run from inside
`vuongthm.github.io/`. Run anywhere else and the content folders are not found.

**In CI the same layout is reproduced** by checking the sibling repos out side by side
(`deploy.yml` checks the engine out as `core/` and the content repos as `stories/`,
`network-notes/`, `my-album/` at the same level).

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.6** (App Router, Turbopack) | `output: "export"` — static export |
| UI | **React 19** | Many client components — see §15 |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`) | Theme lives in CSS, not a JS config |
| Base primitives | `@base-ui/react`; `shadcn` (`@import 'shadcn/tailwind.css'`) | `shadcn` is a **runtime** dep: it provides a CSS layer |
| Search | `fuse.js` (client-side) | Index built in the header, memoised per language |
| Icons | `lucide-react` | |
| Theming | `next-themes` (`attribute="class"`, `defaultTheme="system"`) | |
| Toasts | `sonner` | |
| Build tooling | `sharp`, `yaml`, `vitest`, `eslint` + `eslint-config-next` | devDependencies |
| Package manager | **pnpm 9.15.4** via `corepack` | |

Language: **TypeScript 5.7.3**, `strict: true`, path alias `@/*` → repo root.

---

## 4. Commands

```bash
pnpm dev               # pipeline (dev mode) + next dev        -> http://localhost:3000
pnpm dev:stop          # kill a stale dev server holding port 3000
pnpm dev:light         # same, pinned to 3 CPU cores (taskset)
pnpm build             # pipeline + next build + prune          -> out/
pnpm build:optimized   # same, plus WebP generation (OPTIMIZE_IMAGES=1)
pnpm build:force       # pipeline ignoring the content cache
pnpm build:light       # build pinned to 3 CPU cores
pnpm pipeline          # content sync + (skipped) images + generated data
pnpm images            # generate WebP variants only
pnpm icons             # regenerate favicons from public/icon.svg
pnpm verify            # typecheck + lint + test   (the CI quality gate)
pnpm lint | typecheck | test | test:watch
```

**Environment notes for this machine:**

- The login shell is **fish**, where `pnpm` is an alias for `corepack pnpm`. Aliases
  do not exist in non-interactive shells, so automation must call `corepack pnpm …`.
- The CPU is a low-power laptop part (i5-1035G1, 1.0 GHz base, 8 threads). Everything
  in §14 about build weight exists because of it.

---

## 5. The build pipeline

`scripts/pipeline.mjs` is the single entry point. Deliberate order:

```
1. sync-dev.mjs              sibling repos -> content/** + public/media/**
2. optimize-images.mjs       (opt-in) public/**.png -> .webp next to the original
3. generate-content-data.mjs content/** -> lib/content.generated.ts
                             (this is where encryption happens)
```

for `build` only, then:

```
4. next build                static export to out/
5. prune-originals.mjs       delete bitmaps in out/ that nothing references
```

**Why the order matters:** step 2 must produce the `.webp` files before step 3 runs,
because step 3 rewrites image references to point at them. Steps are declared as data
in `pipeline.mjs`; adding a step is one array entry, not three npm script edits.

**Two caches keep repeat runs cheap:**

- `optimize-images.mjs` skips a file whose `.webp` already exists and is newer. That
  only works because `sync-dev.mjs` **preserves `.webp` files** when cleaning media
  directories, and **only copies files whose size/mtime actually changed**.
- `generate-content-data.mjs` hashes every input (content markdown, `passwords.json`,
  its own source, the set of existing `.webp` files) and **skips writing** when the
  fingerprint matches. This matters more than it sounds: the output embeds AES-GCM
  ciphertexts with a random salt/IV, so *writing it always produces a different file* —
  which invalidates Turbopack's dev cache and forces a full recompile of every route.
  `--force` bypasses the cache.

**Image policy.** WebP generation is **opt-in** (`OPTIMIZE_IMAGES=1`) because it pegs
every core for ~20 s. Locally the site is happy to serve the original PNGs; the CI
workflow sets the flag so the published site gets the optimised files. `prune-originals.mjs`
then removes originals from `out/` — but only when the built output **never mentions the
filename**, checked with a word-boundary regex over every HTML/JS/CSS/XML artefact.
(Roughly 71 MB → 50 MB.)

---

## 6. Code layout

```
app/
├── layout.tsx                  Root layout: fonts, theme/lang/reading providers,
│                               CSP meta, JSON-LD, smooth-anchor handler
├── page.tsx                    "/" — client redirect to /{lang} from localStorage
├── sitemap.ts, robots.ts       Generated at build time (need `dynamic = "force-static"`)
└── [lang]/                     The real app. `generateStaticParams` = en | vi
    ├── layout.tsx              Rejects unknown langs; wraps children in <PageTransition>
    ├── page.tsx                Home (hero, series grid, notes, about teaser)
    ├── stories/                list → [series] → [series]/[chapter]
    ├── notes/                  list → [slug]
    ├── tags/                   index → [tag]
    ├── about/                  about → about/people
    └── my-album/               gallery (password protected)

components/
├── brand/logo.tsx              Logo mark + Wordmark + BrandLockup   (single source)
├── layout/                     header, footer, page-transition, smooth-anchors
├── content/                    note-card, series-card, prose-content (markdown renderer)
├── album/album-card.tsx        Gallery tile with photo/video counts
├── features/                   locked-screen, vault-placeholder, reading-*, search-modal,
│                               share-button, table-of-contents, back-to-top
├── motion/                     reveal, parallax
├── providers/                  theme, lang, reading
├── seo/json-ld.tsx
└── ui/                         container, section, eyebrow, chip, link, button, badge, sheet, sonner

lib/
├── site.config.ts              ★ SINGLE SOURCE OF TRUTH: name, url, nav, socials,
│                                 footer, feature flags, reading defaults
├── crypto.mjs                  ★ Vault crypto — shared by Node (build) and browser
├── use-vault.ts                ★ Client unlock hook (single derivation, TTL, backoff)
├── content.generated.ts        GENERATED — do not edit
├── data.ts                     Re-exports the generated data API
├── i18n.ts / use-i18n.ts       Dictionary lookup (server) + client hook
├── seo.ts                      Canonical/hreflang builders + JSON-LD factories
├── scroll-store.ts             One rAF-throttled scroll listener for the whole app
├── motion.ts                   Easing/duration tokens + capability helpers
├── use-reveal.ts               One shared IntersectionObserver
├── reading-prefs.ts            Font scale + focus mode (+ no-flash init script)
└── ad.config.ts                Rotating promo slides

scripts/                        dev-stop, pipeline, sync-dev, optimize-images,
                                generate-icons, generate-content-data, prune-originals
```

---

## 7. Content model

`sync.config.json` lists each content repository with a `kind`. `kind` selects the
destination — **the code never matches on repository names**, so extra repositories of
an existing kind need only a new JSON entry:

| `kind` | markdown lands in | media lands in | album/series slug comes from |
|---|---|---|---|
| `stories` | `content/stories/<series>/` | `public/media/stories/<series>/` | the folder name inside the repo |
| `notes` | `content/notes/<category>/` | `public/media/notes/<category>/` | the `.md` filename |
| `albums` | `content/albums/<category>/` | `public/media/albums/<category>/` | the folder name inside the repo |

```json
{ "name": "my-album-2", "kind": "albums", "github": "vuongthm/my-album-2" }
```

That is the whole change needed to spread galleries across repositories and stay inside
GitHub's ~1 GB per-repo budget. **One rule:** immediate subfolder names become slugs, so
they must be unique across all repositories of the same kind.

### Frontmatter

```yaml
# stories/<series>/<lang>/series.md
title: "The Unnamed Years"
description: "..."
coverImage: "/media/stories/unnamed-years/cover.png"
status: "ongoing"          # ongoing | completed
tags: ["childhood", "memory"]
date: "2024-01-10"
lang: "en"
locked: true               # optional — the whole series becomes private

# stories/<series>/<lang>/chapter-1.md
title: "..."
preview: "..."
part: 1
date: "..."

# notes/<category>/<lang>/<slug>.md
title, description, tags[], date, weight (sort order), locked, lang
```

Body is markdown rendered by `components/content/prose-content.tsx` — a small
hand-written parser (headings, lists, tables, blockquotes, images, bold/italic/code,
inline links). It renders **React nodes, never `dangerouslySetInnerHTML`**.

Dates are normalised to `YYYY-MM-DD` strings; the YAML parser returns real `Date`
objects for unquoted dates, so the generator converts them back.

---

## 8. The vault (build-time encryption)

This is the most security-sensitive part of the project. Read it before touching
anything in `lib/crypto.mjs`, `lib/use-vault.ts` or the encryption branch of
`generate-content-data.mjs`.

### Why `lib/crypto.mjs` is a plain `.mjs` file

`globalThis.crypto.subtle` exists in **both** Node (20+) and the browser, so the same
module is imported by the build script **and** by the client components. The previous
implementation used `crypto-js` in the browser and `CryptoJS.AES.encrypt` in the build
script — two code paths that must agree forever, which is how content becomes
permanently undecryptable. One shared module cannot drift.

### Cryptographic choices

| | Value | Rationale |
|---|---|---|
| Cipher | **AES-256-GCM** | Authenticated: tampered ciphertext fails instead of producing garbage |
| KDF | **PBKDF2-HMAC-SHA256, 600 000 iterations** | OWASP recommendation. The old crypto-js passphrase mode used **MD5 with a single iteration**, making offline brute force trivial |
| Salt | 16 random bytes, **one per vault** (= one password) | One salt per vault is what lets a whole page decrypt with a single key derivation |
| IV | 12 random bytes **per value** | Never reused with the same key |
| Key | `extractable: false` | A successful XSS still cannot export the key |

**Payload format:** `v2:` + base64( salt[16] || iv[12] || ciphertext || tag[16] ).
The version prefix exists so a future migration does not break old content.

### Build side

`generate-content-data.mjs` keeps **one vault per password** for the whole build
(`vaultCache`), so encrypting ten fields costs one derivation, not ten. All payloads
from the same password share the salt — that is what makes batch decryption possible.

```js
const vault = await createVault(password)     // derives once
await vault.encrypt(title)                    // reuse
await vault.encrypt(body)                     // reuse
```

### Client side

`lib/use-vault.ts` is the **single** implementation of the unlock flow (it replaced
three near-duplicates). It provides: `restoring`, `busy`, `failures`, `unlock()`,
`restore()`, `decrypt()`, `lock()`.

- Derives the key **once** per unlock and caches it in a module-level `Map` keyed by
  salt, so navigating away and back does **not** re-run 600 000 PBKDF2 iterations.
- Verifies the key against every payload **before** committing it to the cache — a
  wrong password must never leave a broken vault behind.
- Persists the session in `sessionStorage` **with a 6-hour expiry**, and migrates the
  old plaintext-string format forward.
- **Exponential backoff** on wrong passwords (300 ms → 4 s). This is the only rate
  limit available to a site with no server.
- Exposes `restoring` so consumers render `VaultPlaceholder` instead of flashing the
  padlock while the session is checked.

### Threat model — be honest about the limits

The ciphertext ships in a **public** bundle, so an attacker can brute-force it
**offline**. "Secure" therefore means: *the cost of cracking exceeds the value of the
content*. Concretely:

- choose long passwords — `passwords.json` currently contains weak values (`"123"`,
  `"123456"`) for some entries;
- if content must be genuinely private, do not publish the ciphertext at all — put the
  repo behind real authentication (e.g. Cloudflare Access) instead.

`passwords.json` is **git-ignored** and injected in CI from the `POST_PASSWORDS`
secret. Never commit it.

---

## 9. Internationalisation

Two languages: **en** and **vi**. There is no i18n library — the locale is a route
segment (`/en/…`, `/vi/…`), which is what makes the static export work.

- `app/page.tsx` redirects to `/{lang}` read from `localStorage["blog-lang"]`.
- `components/ui/link.tsx` is the **only** place a locale prefix is added. Write
  `href="/stories"` and it becomes `/en/stories` or `/vi/stories`. It deliberately
  skips `#anchors`, `/media/**` and hrefs that already carry a locale.
- Server code uses `getMessages(lang)` / `t(lang, "a.b")` from `lib/i18n.ts`.
- Client code uses `useI18n()` from `lib/use-i18n.ts` → `{ lang, t, pick, formatDate, formatNumber }`.
- `pick(values)` selects a value from an inline `{ en, vi }` object — used for copy that
  lives next to the component that renders it.

**Known inconsistency (accept it or fix it):** some pages still keep a local
`COPY`/`LABELS` object instead of `i18n/*.json`. Both patterns work; the JSON files are
the intended home for *shared* strings, inline objects are fine for page-local copy.

---

## 10. Design system

Tokens are defined **once**, at the top of `app/globals.css`. Components never hardcode
colour, size or spacing.

### Palette — "Coastal Editorial"

Warm paper, warm ink, one ochre brand accent, one deep-sea teal used sparingly. **No
pure neutral greys**: every value carries warmth, which is what makes the pages read as
paper rather than as a dashboard.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#fbf9f6` | `#0f0e0c` | page |
| `--foreground` | `#17150f` | `#f6f2ea` | text |
| `--surface-sunken` | `#f5f1ea` | `#141210` | alternating section bands |
| `--accent-brand` | `#b45309` | `#f0a04b` | links, CTAs, active states |
| `--sea` | `#1c5f6b` | `#6ec3cf` | tags and secondary accents |

**The dark palette is defined exactly once**, in `.dark`. There is deliberately **no
`@media (prefers-color-scheme: dark)` block** — it used to duplicate the whole palette
and the two copies drifted. `next-themes` applies `.dark` before first paint.

### Type scale

Fluid, but anchored to the Tailwind sizes the site used before the design pass so
nothing inflated: `--fs-display` 30→48 px, `--fs-h1` 24→32, `--fs-h2` 20→24, `--fs-h3`
17→18, `--fs-lead` 16→18, body 16, small 14, caption 12, eyebrow 11 px.

`h1, h2, h3` are serif (Fraunces) globally in `@layer base` — components only choose a
size. `--space-section` (32→56 px) is the single value for vertical page rhythm.

### Primitives (`components/ui/`)

`Container` (page gutters/width), `Section` + `SectionHeading` + `SectionRule` (section
rhythm and heading layout), `Eyebrow` (uppercase mono label), `Chip` / `ChipLink` (tags),
`Link` (locale-aware), plus base-ui backed `Button`, `Badge`, `Sheet`, `Sonner`.

**Rule:** if markup is repeated in more than two places, it belongs in a primitive.
`mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` used to appear ~30 times.

### Brand assets

`components/brand/logo.tsx` — `Logo` (a "V" over a horizon line, ochre right stroke),
`Wordmark`, `BrandLockup`. Used by header, footer and the favicon source
(`public/icon.svg`, rasterised by `pnpm icons`).

---

## 11. Motion

Tokens in `lib/motion.ts`. Rules the code enforces:

- **Only `transform` and `opacity` are animated** — everything stays on the compositor.
- `lib/scroll-store.ts` is the single scroll listener (rAF-throttled,
  `useSyncExternalStore`). `components/motion/parallax.tsx` subscribes imperatively and
  writes the transform **straight to the DOM**, so a scroll-linked effect never
  re-renders React.
- `lib/use-reveal.ts` is a single shared `IntersectionObserver` for all reveals.
  Elements already on screen at mount are shown immediately rather than "armed", so
  visible content never blinks out.
- `siteConfig.features.motion` turns reveal + parallax off; `prefers-reduced-motion` and
  coarse pointers disable them automatically.

**`scroll-behavior: smooth` must NOT be set on `html`.** Next.js resets the scroll
position on every route change; with smooth scrolling that reset is *animated*, so a new
page appears to slide up from wherever the previous page was scrolled. Smooth scrolling
for in-page anchors is handled per-click in `components/layout/smooth-anchors.tsx`.

---

## 12. Configuration

### `lib/site.config.ts` — the single source of truth

Site name, URL, supported languages, author, description, social links, **navigation**,
footer columns, feature flags and reading defaults. Metadata, header, footer, sitemap and
JSON-LD all read from it, so changing a nav item or the site name is a one-file change.

### Feature flags

```ts
features: {
  commandPalette: true,     // planned, not implemented
  readingToolbar: true,     // font scale + focus mode bar
  continueReading: true,    // planned, not implemented
  readingTime: true,
  tableOfContents: true,
  motion: true,             // reveal + parallax
}
```

### Other config files

| File | Purpose |
|---|---|
| `sync.config.json` | content repos + their `kind`; documents how to add more galleries |
| `passwords.json` | **git-ignored**; vault passwords, injected from `POST_PASSWORDS` in CI |
| `eslint.config.mjs` | ESLint 9 flat config; `eslint-config-next` ships flat configs directly (no `FlatCompat`) |
| `vitest.config.ts` | Node environment, `@` alias; tests live in `lib/**/*.test.ts` |
| `next.config.mjs` | `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`, `reactStrictMode: false`, `experimental.cpus: 2`, `turbopack.root` |

---

## 13. SEO

- `app/sitemap.ts` — one entry per localized route (103 URLs) with `hreflang` alternates
  (`en`, `vi`, `x-default`). Generated from the content data, so new chapters and notes
  appear automatically.
- `app/robots.ts` — allows `/media/` (keeps images in image search), disallows `/my-album/`.
- `components/seo/json-ld.tsx` + `lib/seo.ts` — `WebSite`, `Person`, and factories for
  `Article` / `BreadcrumbList`. `serializeJsonLd()` escapes `<` so a string value cannot
  close the tag early.
- **CSP ships as a `<meta>` tag** because GitHub Pages cannot send response headers.
  `frame-ancestors` is intentionally omitted: the spec requires it as a header and
  browsers ignore it in a meta tag. `'unsafe-inline'` for scripts is required by
  `next-themes`, which injects a blocking script to apply the saved theme before first
  paint. `'unsafe-eval'` is added **only when `NODE_ENV === "development"`**, because
  React's dev build needs it.
- `public/.nojekyll` stops GitHub Pages from running Jekyll over the artifact.

---

## 14. Conventions

- **Comments in English** (required by `CONTRIBUTING.md`). Comments explain *why*, not
  what — the code already says what.
- Prefer primitives over repeated markup. Prefer tokens over hardcoded values.
- **Never `transition-all`.** Name the properties, and keep them to
  `transform`/`opacity` wherever possible.
- **Never nest an `<a>` inside an `<a>`.** Card components use `Chip`; `ChipLink` is only
  for contexts with no wrapping anchor. (This caused a real hydration error.)
- Client components: keep hooks **above** any early `return` / `notFound()` guard, or the
  hook count changes between renders.
- `useSyncExternalStore` (see `scroll-store.ts`) is the preferred pattern for state living
  outside React. `react-hooks/set-state-in-effect` is a warning, not an error; the
  remaining call sites are the "hydrate persisted UI state" case.
- Adding a pipeline step = one entry in `scripts/pipeline.mjs`.
- Adding a page = `Container`/`Section` for layout, a locale-less `href`, and
  `langParams()` for static params.

---

## 15. Lessons already paid for (do not repeat these)

| Symptom | Cause | Fix in place |
|---|---|---|
| `pnpm dev` slow, CPU > 1000 %, stuck "compiling" | `sync-dev.mjs` deleted generated `.webp` files, so 32 MB of images were re-encoded on **every** start | `cleanMediaDirectory()` keeps `.webp`; only changed files are copied; the image step is opt-in |
| Dev cache invalidated every run | `content.generated.ts` is re-encrypted with a random salt/IV, so *writing it always changes it* | input fingerprint cache skips the write |
| PostCSS/Tailwind pegging 10 cores | Tailwind auto source-detection walks the project (~341 ms per compile, once per parallel worker) | `@import 'tailwindcss' source(none)` + explicit `@source` dirs → 44 ms, identical CSS |
| Build worker count = 7 on an 8-thread box | Next defaults to `os.cpus().length - 1` | `experimental.cpus: 2` |
| A new page slides up from the previous scroll position | `scroll-behavior: smooth` on `html` animated Next's scroll reset | removed globally; handled per anchor click |
| `TimeoutError: Transition was aborted because of timeout in DOM update`, navigation felt lazy | a manual `document.startViewTransition()` waited for the new route with a `requestAnimationFrame` loop — and **rAF is throttled while a transition runs**, stretching 400 ms into seconds | View Transitions removed. Cross-page motion is pure CSS (`PageTransition`, 300 ms opacity). See the note in `lib/motion.ts` |
| `Another next dev server is already running` | a stale `next dev` still held port 3000 | `pnpm dev:stop` |
| `eval() is not supported in this environment` | CSP had no `unsafe-eval` in dev | added for dev only |
| `<a> cannot be a descendant of <a>` + hydration error | `ChipLink` inside a card that is itself a link | cards use `Chip` |
| Lock padlock flashes before content appears | the vault key lived only in a component ref, so every revisit re-ran PBKDF2; and the lock form rendered while the session was still being checked | module-level key cache + a `restoring` state that renders `VaultPlaceholder` |

---

## 16. Known gaps / next steps

| # | Item | Notes |
|---|---|---|
| 1 | **Personal projects section** | Not built yet. Plan: add `kind: "projects"` to `DESTINATIONS`, emit `allProjects` in the generator, add `app/[lang]/projects/{page,[slug]/page}.tsx`, `components/content/project-card.tsx`, a nav entry in `site.config.ts`, and check out a `vuongthm/projects` repo in CI |
| 2 | **Pages still on ad-hoc section markup** | `stories`, `notes`, `tags`, `tags/[tag]`, `about`, `about/people`, chapter & note detail. They inherit the new tokens automatically but do not yet use `Section` / `SectionHeading` |
| 3 | **Whole content tree shipped to the client** | `notes`, `stories`, `tags` and the home page are `"use client"` and import `content.generated.ts`, so all content is bundled and hydrated. Moving them to server components is the biggest remaining performance win |
| 4 | **3 broken images** | `app/[lang]/about/people/page.tsx` references `/about/people-{ba,aaa,bbb}.png`; `public/about/` only contains `travel-*.png` → 404s |
| 5 | **`public/avatar.png` is 5.2 MB** rendered at 48 px | Convert to a small WebP and update the three references |
| 6 | **`html lang` is hardcoded `"en"`** in `app/layout.tsx` | `/vi/` should declare `lang="vi"`. `<html>` lives in the root layout, which has no locale param — needs a small client effect in `LangProvider` |
| 7 | **Weak passwords** | `passwords.json` contains `"123"` / `"123456"` for some entries |
| 8 | **`series-page-client.tsx` hardcodes a gallery** | `album-{1..6}.png` for the "internship" series: fixed count, fixed extension. Emitting the list from the generator would fix it and let `prune-originals` drop 6 more PNGs |

---

## 17. Deployment

`.github/workflows/deploy.yml`, two jobs:

1. **`verify`** (quality gate, runs in parallel): install → `pnpm pipeline` → typecheck →
   lint → test. It exists because the `lint` script had been broken for a long time.
2. **`build` + `deploy`**:
   - checks out `core/` (this repo) plus `stories/`, `network-notes/`, `my-album/` as
     **siblings**, reproducing the local layout;
   - writes `passwords.json` from `secrets.POST_PASSWORDS`;
   - `pnpm install --frozen-lockfile`, then `pnpm build` with `OPTIMIZE_IMAGES=1`;
   - uploads `core/out` and deploys to GitHub Pages.

Triggers: `push` to `main`, `repository_dispatch: [content-updated]` (so a push to a
content repo can rebuild the site), and manual dispatch.

Dependabot keeps npm and GitHub Actions current; minor/patch updates are grouped, and
majors for `next` / `react` are ignored on purpose.

---

## 18. Current state (as of the last build)

- `pnpm build` → **112 static pages, 0 errors**; `pnpm typecheck` 0 errors;
  `pnpm lint` 0 errors (a handful of warnings); `pnpm test` 7/7 passing.
- `out/` ≈ **51 MB**; the largest remaining assets are the original PNGs that are still
  referenced (13 of them, kept deliberately by `prune-originals`).
- Verified end-to-end: all 36 ciphertexts in the real generated data decrypt with the
  real passwords, and a wrong password returns `null` rather than garbage.

### If you are an AI picking this up

1. Read `lib/site.config.ts`, `app/globals.css` (tokens) and `scripts/pipeline.mjs` first —
   they define the conventions everything else follows.
2. Run `pnpm verify` before and after changes; `pnpm build` before claiming anything works.
3. Never edit `lib/content.generated.ts` — it is generated.
4. Never commit `passwords.json`.
5. When touching animation, navigation or the pipeline, read §15 first: those are the
   areas where an apparently reasonable change has already caused a real regression.





