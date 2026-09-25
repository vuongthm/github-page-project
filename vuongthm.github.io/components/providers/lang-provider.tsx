"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import type { Lang } from "@/lib/data"

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    if (params?.lang === "vi" || params?.lang === "en") {
      setLangState(params.lang as Lang)
    }
  }, [params?.lang])

  /*
    Keeps <html lang> correct per locale.
    The <html> element lives in the root layout, which has no locale param, so
    the attribute cannot be set during static rendering. Setting it here means
    `/vi/` no longer advertises itself to screen readers and search engines as
    English. Kept in an effect rather than in render so the server HTML and the
    first client render still match.
  */
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem("blog-lang", newLang)
    
    if (pathname) {
      const segments = pathname.split("/")
      if (segments[1] === "en" || segments[1] === "vi") {
        segments[1] = newLang
        router.push(segments.join("/"))
      } else {
        router.push(`/${newLang}`)
      }
    }
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}