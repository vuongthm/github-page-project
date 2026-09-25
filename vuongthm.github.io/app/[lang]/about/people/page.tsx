"use client"

import { Link } from "@/components/ui/link"
import { Container } from "@/components/ui/container"
import { Avatar } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useLang } from "@/components/providers/lang-provider"

const PEOPLE_EN = [
  {
    name: "Ba (Father)",
    role: "Family",
    bio: "The man who kept every school prize in a tin box and never needed to say he was proud.",
  },
  {
    name: "AAA",
    role: "Closest friend",
    bio: "The person who told me to start writing publicly when I was still afraid to.",
  },
  {
    name: "BBB",
    role: "Colleague & co-founder",
    bio: "We built the first broken product together. Still building, still breaking things.",
  },
]

const PEOPLE_VI = [
  {
    name: "Ba",
    role: "Gia đình",
    bio: "Người đã cất mọi tờ giấy khen vào hộp sắt mà không cần nói thêm gì.",
  },
  {
    name: "aaa",
    role: "Người bạn thân nhất",
    bio: "Người đã nói với tôi hãy bắt đầu viết công khai khi tôi còn sợ.",
  },
  {
    name: "bbb",
    role: "Đồng nghiệp",
    bio: "Cùng nhau làm ra sản phẩm đầu tiên rồi thất bại. Vẫn đang làm, vẫn đang thất bại.",
  },
]

const COPY = {
  en: {
    heading: "People in my life",
    desc: "A few of the people who have shaped how I think, what I build, and who I am.",
    back: "Back to About",
  },
  vi: {
    heading: "Những người trong cuộc đời tôi",
    desc: "Một số người đã định hình cách tôi suy nghĩ, những gì tôi làm, và con người tôi.",
    back: "Quay lại Về tôi",
  },
}

export default function PeoplePage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const people = lang === "en" ? PEOPLE_EN : PEOPLE_VI

  return (
    <>
      <Header />

      <main className="pt-14">
        <Container className="pt-10 pb-[var(--space-section)] sm:pt-14">
          <Link
            href="/about"
            className="mb-8 inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            {c.back}
          </Link>

          <div className="mb-10">
            <h1 className="mt-3 mb-3 font-serif text-3xl font-semibold text-balance text-pretty text-foreground sm:text-4xl">
              {c.heading}
            </h1>
            <p className="max-w-xl text-pretty text-lead leading-relaxed text-muted-foreground">
              {c.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {people.map((person) => (
              <div
                key={person.name}
                className="flex flex-col items-center text-center gap-3 p-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-accent-brand/30 transition-colors duration-150"
              >
                {/* No portrait file exists for these entries yet, so the Avatar
                    renders initials. Add `photo: "/about/people-x.png"` back to
                    the data above and it will be used automatically. */}
                <Avatar name={person.name} size="lg" />
                <div>
                  <p className="font-medium text-foreground text-small leading-snug">
                    {person.name}
                  </p>
                  <p className="text-[11px] text-accent-brand mt-0.5">{person.role}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                    {person.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>

      <Footer lang={lang} />
    </>
  )
}