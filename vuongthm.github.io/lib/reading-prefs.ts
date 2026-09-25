import { siteConfig } from "./site.config"

/**
 * Reader preferences: font scale, content width and focus mode.
 *
 * Kept in a plain module (no React) so the same defaults can be serialised
 * into a blocking <head> script and applied before first paint, which avoids
 * the flash of wrong-sized text that a useEffect-only implementation causes.
 */

export interface ReadingPreferences {
  /** Multiplier applied to the base 1rem reading size. */
  scale: number
  /** Max width of the reading column in px. */
  width: number
  /** Hides the chrome (header, footer, side rails) while reading. */
  focus: boolean
}

export const READING_STORAGE_KEY = "vuong:reading-prefs"

export const defaultReadingPreferences: ReadingPreferences = {
  scale: siteConfig.reading.defaultScale,
  width: siteConfig.reading.widths[1],
  focus: false,
}

/** Clamps an arbitrary number into the configured scale range. */
export function clampScale(scale: number): number {
  const { minScale, maxScale } = siteConfig.reading
  return Math.min(maxScale, Math.max(minScale, Math.round(scale * 100) / 100))
}

/** Returns the next/previous scale step, or the same value at the bounds. */
export function stepScale(current: number, direction: 1 | -1): number {
  return clampScale(current + direction * siteConfig.reading.step)
}

export function clampWidth(width: number): number {
  const { widths } = siteConfig.reading
  return widths.includes(width) ? width : widths[1]
}

function normalize(input: Partial<ReadingPreferences> | null | undefined): ReadingPreferences {
  return {
    scale: clampScale(typeof input?.scale === "number" ? input.scale : defaultReadingPreferences.scale),
    width: clampWidth(typeof input?.width === "number" ? input.width : defaultReadingPreferences.width),
    focus: input?.focus === true,
  }
}

/** Reads preferences from localStorage, falling back to the site defaults. */
export function readReadingPreferences(): ReadingPreferences {
  if (typeof window === "undefined") return defaultReadingPreferences
  try {
    const raw = window.localStorage.getItem(READING_STORAGE_KEY)
    if (!raw) return defaultReadingPreferences
    return normalize(JSON.parse(raw) as Partial<ReadingPreferences>)
  } catch {
    return defaultReadingPreferences
  }
}

export function writeReadingPreferences(prefs: ReadingPreferences): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* storage disabled (private mode / quota) — preferences stay in memory */
  }
}

/**
 * Pushes preferences onto the document as CSS custom properties so every
 * component can consume them without subscribing to React state.
 */
export function applyReadingPreferences(prefs: ReadingPreferences): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--reading-scale", String(prefs.scale))
  root.style.setProperty("--reading-width", `${prefs.width}px`)
  root.toggleAttribute("data-focus-mode", prefs.focus)
}

/**
 * Inline script injected in <head>. Runs before paint so the saved scale and
 * focus mode are already applied on the very first frame.
 */
export const readingPreferencesInitScript = `
(function(){
  try {
    var d=${JSON.stringify(defaultReadingPreferences)};
    var k=${JSON.stringify(READING_STORAGE_KEY)};
    var p=JSON.parse(localStorage.getItem(k)||"null")||{};
    var s=typeof p.scale==="number"?p.scale:d.scale;
    var w=typeof p.width==="number"?p.width:d.width;
    var f=p.focus===true;
    var r=document.documentElement;
    r.style.setProperty("--reading-scale",String(s));
    r.style.setProperty("--reading-width",w+"px");
    if(f){r.setAttribute("data-focus-mode","");}
  } catch(e){}
})();
`.trim()
