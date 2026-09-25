# UI work remaining (handoff)

Written at the end of the Phase 1–3 session. Everything below was verified by
`pnpm verify && pnpm build` at the time of writing: **116/116 static pages, 0 errors**,
`transition-all` = 0, legacy design tokens = 0 in both source and `out/**/*.html`.

Read §14/§15 of the project handoff first. The frozen list still applies:
`lib/crypto.mjs`, `lib/use-vault.ts`, pipeline + caches, locale logic in
`ui/link.tsx`, static export, `lib/content.generated.ts`, `passwords.json`.
Never: `scroll-behavior: smooth` on `html`, View Transitions, `transition-all`,
animating anything but `transform`/`opacity`, nested `<a>`, hooks below early
returns. Only `FloatDock` may render a `position: fixed` control.

## Method that has been proven on two pages

Swapping a hand-rolled container for the shared one touches **two** lines, and
the closing tag is the part that breaks. Verified procedure:

1. Read the opening line and find where its `</div>` sits. Do not guess: pages
   with locked/placeholder branches (`note-page-client`, `chapter-page-client`,
   `my-album`) do **not** end with `</div></main>` and must be read first.
2. Change the opening tag and the closing tag in the same pass.
3. `tsc` catches an unbalanced tree immediately — cheaper than the full build.

Opening tag to replace:

```
mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 <padding classes>
```

becomes

```tsx
<Container className="<padding classes, with pb-[var(--space-section)] for the last band>">
```

`import { Container } from "@/components/ui/container"` — add next to the other
`@/components/ui/*` imports. **Never use an existing import as the `old_text`
anchor**: that silently deletes it (this happened twice; `tsc` caught both).

## Page header formula

Used by `/tags`, `/notes`, `/stories`, `/saved`, `/tags/[tag]`, `/about/people`:

```tsx
<Eyebrow tone="brand">{c.eyebrow}</Eyebrow>
<h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
  {c.heading}
</h1>
<p className="max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">{c.description}</p>
```

Add `eyebrow` to that page's `COPY`/`LABELS` for **both** locales (a missing key
is a type error, which is the point of the pattern). `SectionHeading` is `h2|h3`
only, so a page title is always a hand-written `<h1>`.

## Containers

**Done.** Every hand-rolled `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` wrapper in
`app/**` is now the shared `Container`, with `pb-16` and friends replaced by
`pb-[var(--space-section)]`. Pages swapped and verified: `/tags/[tag]`,
`/about/people`, `/notes` (both bands), `/about`, `/notes/[slug]`,
`/stories/[series]/[chapter]`, `/my-album`, `/stories/[series]` (three bands).

Two wrappers are kept on purpose, both in `series-page-client.tsx`:

```
154: absolute top-6  ... (back link over the cover image)
159: absolute bottom-0 ... (title badge over the cover image)
```

They are positioned inside the hero overlay, so they are not page bands and must
stay in step with the image, not with the page rhythm. `header.tsx:227` is also
left alone: the header has its own `h-14` rhythm.

The closing-tag trap is worth repeating: `/my-album` and `/stories/[series]` do
**not** end with `</div></main>`. The lightbox/modal markup sits after `</main>`
(the main element closes at line 379 and 355 respectively), so the anchor for
the container close has to be taken from the region before `</main>` — for the
album page that is the `</LockedScreen>` block, for the series page the
`</div>` immediately above `</LockedScreen>`.

## Still open from Phase 1

`/stories/[series]` and both detail pages keep their hero/reader layout on
purpose; they need the header formula only where there is a plain in-flow
heading, not over the cover image.

## Phase 4 and 5

- **Phase 4 — projects.** Flag `features.projects` exists and is `false`. Blocked
  on one decision: data from a static config, from `content/projects/*.md` through
  the existing generator, or from the GitHub API.
- **Phase 5 — AI assistant.** Flag `features.aiAssistant` is `false`. The dock
  already reserves the `ask-ai` entry, gated on the flag plus a reading page. The
  locked-content check belongs in the panel, which knows the page data, not in
  the dock.

## Verification gates

```
pnpm verify            # tsc --noEmit, eslint, vitest
pnpm build             # must report 116/116 pages, 0 errors, then prune
```

Useful post-build assertions:

```
grep -rho "transition-all" app components lib | wc -l          # 0
grep -rho "rounded-xl" out --include="*.html" | wc -l          # 0
grep -c "<item>" out/en/feed.xml                               # 11, public only
```

RSS must never contain a slug whose generated entry has `isLocked: true`.
Note that `passwords.json` is a password registry consulted only when
`locked: true`; a key there does **not** mean the item is private (`osi-model`
and `tcp-ip-model` are `locked: false` and public, and the sitemap lists them).
