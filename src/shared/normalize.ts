import { COUNTRIES } from './data'
import type { Country } from './types'

/** Převede text na tvar pro porovnávání: malá písmena, bez diakritiky, bez interpunkce. "Česko" -> "cesko" */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export interface SearchHit {
  country: Country
  /** Název nebo alias, na který dotaz seděl (kvůli zobrazení "Nizozemsko (Holandsko)"). */
  matched: string
  /** Menší = lepší shoda. */
  rank: number
}

interface IndexEntry {
  country: Country
  labels: { text: string; norm: string; words: string[]; isAlias: boolean }[]
}

const INDEX: IndexEntry[] = COUNTRIES.map((country) => ({
  country,
  labels: [country.name, ...country.aliases].map((text, i) => {
    const norm = normalize(text)
    return { text, norm, words: norm.split(' '), isAlias: i > 0 }
  }),
}))

const collator = new Intl.Collator('cs')

/**
 * Najde země podle rozepsaného textu. Nezáleží na diakritice ani velikosti písmen.
 * Pořadí: přesná shoda, začátek názvu, začátek některého slova, výskyt kdekoli; názvy mají přednost před aliasy.
 */
export function searchCountries(query: string, options: { exclude?: ReadonlySet<string>; limit?: number } = {}): SearchHit[] {
  const q = normalize(query)
  if (!q) return []
  const hits: SearchHit[] = []
  for (const entry of INDEX) {
    if (options.exclude?.has(entry.country.id)) continue
    let best: SearchHit | null = null
    for (const label of entry.labels) {
      let rank: number
      if (label.norm === q) rank = 0
      else if (label.norm.startsWith(q)) rank = label.isAlias ? 2 : 1
      else if (label.words.some((w) => w.startsWith(q))) rank = label.isAlias ? 4 : 3
      else if (q.length >= 3 && label.norm.includes(q)) rank = label.isAlias ? 6 : 5
      else continue
      if (!best || rank < best.rank) best = { country: entry.country, matched: label.text, rank }
    }
    if (best) hits.push(best)
  }
  hits.sort((a, b) => a.rank - b.rank || collator.compare(a.country.name, b.country.name))
  return options.limit ? hits.slice(0, options.limit) : hits
}

/** Vrátí zemi, jejíž název nebo alias přesně odpovídá textu (po normalizaci). */
export function findCountryExact(text: string): Country | undefined {
  const q = normalize(text)
  if (!q) return undefined
  return INDEX.find((e) => e.labels.some((l) => l.norm === q))?.country
}

/**
 * První písmeno názvu podle české abecedy: Ch je samostatné písmeno (Chile nezačíná na C)
 * a písmena s háčkem také (Č, Š, Ř, Ž). Ostatní diakritika se ignoruje (Á -> A, Í -> I).
 */
export function firstLetter(text: string): string {
  const n = normalize(text)
  if (n.startsWith('ch')) return 'CH'
  const original = text.trim()[0].toUpperCase()
  return 'ČŠŘŽ'.includes(original) ? original : n[0].toUpperCase()
}
