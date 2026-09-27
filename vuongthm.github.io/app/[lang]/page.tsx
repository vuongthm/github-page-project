"use client"

import { motion } from "framer-motion"
import { Canvas } from "@react-three/fiber"
import { Suspense, lazy, use } from "react"
import { ModernHeader } from "@/components/layout/modern-header"
import { Footer } from "@/components/layout/footer"
import { HoverExpandCard } from "@/components/core/micro-hover-card"
import { ParallaxLayer } from "@/components/core/parallax-layer"
import { Container } from "@/components/ui/container"
import { Link } from "@/components/ui/link"
import { Eyebrow } from "@/components/ui/eyebrow"
import { ArrowRight } from "lucide-react"
import type { Lang } from "@/lib/data"
import { getVisibleSeries, getAllTags } from "@/lib/data"

const Hero3DScene = lazy(() =>
  import("@/components/core/3d-scene").then((mod) => ({ default: mod.Hero3DScene }))
)

export default function HomePage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = use(params)
  const series = getVisibleSeries(lang)
  const tags = getAllTags(lang)

  return (
    <>
      <ModernHeader />
      <main className="pt-16">
        <HeroSection lang={lang} />
        <FeaturedSection lang={lang} series={series} />
        <TagSection lang={lang} tags={tags} />
      </main>
      <Footer lang={lang} />
    </>
  )
}

function HeroSection({ lang }: { lang: Lang }) {
  return (
          <section className="relative min-h-screen md:min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} className="bg-transparent">
          <Suspense fallback={null}>
            <Hero3DScene />
          </Suspense>
        </Canvas>
      </div>
      {/* Gradient overlay to improve text legibility over 3D scene */}
      <div className="absolute inset-0 -z-9 bg-gradient-to-br from-background/95 via-background/80 to-transparent" />
            <div className="mx-auto max-w-[var(--container-max)] px-[var(--space-gutter)] pt-16 pb-24 md:pt-20 md:pb-32">
        <ParallaxLayer speed={0.2}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl"
          >
            <Eyebrow tone="brand" className="mb-4">
              {lang === "en" ? "Tech Life Stories" : "Công nghệ Cuộc sống Câu chuyện"}
            </Eyebrow>
            <h1 className="font-display text-display font-bold leading-tight text-foreground mb-6">
              {lang === "en" ? (
                <>Where <span className="text-accent-brand">code meets life</span></>
              ) : (
                <>Nơi <span className="text-accent-brand">code gặp cuộc sống</span></>
              )}
            </h1>
            <p className="text-lead text-muted-foreground/90 max-w-2xl mb-10">
              {lang === "en"
                ? "Technical notes, life stories."
                : "Ghi chú kỹ thuật, câu chuyện cuộc đời."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 rounded-xl bg-accent-brand px-6 py-3 text-sm font-medium text-background transition-all hover:scale-105 hover:bg-accent-brand/90"
              >
                {lang === "en" ? "Explore Stories" : "Khám phá chuyện"}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/notes"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-foreground/30 px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-accent-brand hover:text-accent-brand"
              >
                {lang === "en" ? "Tech Notes" : "Ghi chú kỹ thuật"}
              </Link>
            </div>
          </motion.div>
        </ParallaxLayer>
      </div>
    </section>
  )
}

function FeaturedSection({ lang, series }: { lang: Lang; series: any[] }) {
  return (
    <section className="py-[var(--space-section)]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Eyebrow tone="brand">{lang === "en" ? "Featured" : "Nổi bật"}</Eyebrow>
          <h2 className="font-display text-h1 font-bold text-foreground">
            {lang === "en" ? "Latest writing" : "Bài viết mới"}
          </h2>
        </motion.div>

<div className="grid grid-cols-1 gap-[var(--space-gutter)] md:grid-cols-2 lg:grid-cols-3">
          {series.slice(0, 6).map((s, i) => (
            <HoverExpandCard
              key={s.slug}
              href={`/stories/${s.slug}`}
              title={s.title}
              description={s.description}
              tags={[s.category]}
              className="h-full"
            />
          ))}
        </div>
      </Container>
    </section>
  )
}

function TagSection({ lang, tags }: { lang: Lang; tags: any[] }) {
  return (
    <section className="py-[var(--space-section)] bg-surface-sunken/30">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Eyebrow tone="brand">{lang === "en" ? "Topics" : "Chủ đề"}</Eyebrow>
          <h2 className="font-display text-h1 font-bold text-foreground">
            {lang === "en" ? "Explore by topics" : "Khám phá theo chủ đề"}
          </h2>
        </motion.div>
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {tags.slice(0, 15).map((tag) => (
            <Link
              key={tag.tag}
              href={`/tags/${tag.tag}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent-brand/5 hover:text-accent-brand"
            >
              <span className="text-xs opacity-70 group-hover:opacity-100">{tag.count}</span>
              {tag.tag}
            </Link>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

HomePage.displayName = "HomePage"
