// Slabá místa: u kterých zemí hráč nejčastěji neuspěje. Zapisuje se jen to, co hra sama pozná
// (země, kterou se nepodařilo vyřešit), nic se nehádá. Procvičením se potíž postupně odečítá.
import { COUNTRIES } from './data'
import { shuffled } from './random'
import { loadJson, saveJson } from './storage'

export interface WeakEntry {
  /** Kolik kol s touto zemí jako hledanou se dohrálo. */
  rounds: number
  /** V kolika z nich se ji nepodařilo vyřešit. */
  lost: number
  /** Kolikrát se ji hráč při procvičování trefil (odečítá se od `lost`). */
  fixed: number
  /** Datum posledního kola nebo procvičení. */
  last: string
}

const KEY = 'weak'
const KNOWN = new Set(COUNTRIES.map((c) => c.id))

const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)

export function loadWeak(): Record<string, WeakEntry> {
  const raw = loadJson<unknown>(KEY, {})
  const out: Record<string, WeakEntry> = {}
  if (typeof raw !== 'object' || raw === null) return out
  for (const [id, entry] of Object.entries(raw as Record<string, Partial<WeakEntry>>)) {
    if (!KNOWN.has(id) || typeof entry !== 'object' || entry === null) continue
    const lost = count(entry.lost)
    out[id] = { rounds: count(entry.rounds), lost, fixed: Math.min(count(entry.fixed), lost), last: typeof entry.last === 'string' ? entry.last : '' }
  }
  return out
}

/** Kolik potíží u země ještě zbývá. */
export function troubleOf(entry: WeakEntry | undefined): number {
  return entry ? Math.max(0, entry.lost - entry.fixed) : 0
}

/** Zapíše dohrané kolo, ve kterém byla hledaná zemí `countryId`. */
export function recordRound(countryId: string, lost: boolean, date: string): void {
  if (!KNOWN.has(countryId)) return
  const weak = loadWeak()
  const entry = weak[countryId] ?? { rounds: 0, lost: 0, fixed: 0, last: '' }
  weak[countryId] = { ...entry, rounds: entry.rounds + 1, lost: entry.lost + (lost ? 1 : 0), last: date }
  saveJson(KEY, weak)
}

/** Zapíše odpověď při procvičování. Správná odpověď ubere jednu potíž. */
export function recordPractice(countryId: string, correct: boolean, date: string): void {
  const weak = loadWeak()
  const entry = weak[countryId]
  if (!entry) return
  weak[countryId] = { ...entry, fixed: correct ? Math.min(entry.fixed + 1, entry.lost) : entry.fixed, last: date }
  saveJson(KEY, weak)
}

export interface WeakItem {
  id: string
  trouble: number
  rounds: number
  last: string
}

/** Země s nevyřešenou potíží: nejvíc potíží první, při shodě ta, která se řešila naposledy. */
export function weakList(weak: Record<string, WeakEntry> = loadWeak()): WeakItem[] {
  return Object.entries(weak)
    .map(([id, entry]) => ({ id, trouble: troubleOf(entry), rounds: entry.rounds, last: entry.last }))
    .filter((item) => item.trouble > 0)
    .sort((a, b) => b.trouble - a.trouble || b.last.localeCompare(a.last) || a.id.localeCompare(b.id))
}

export type PracticeKind = 'flag' | 'capital'

export interface PracticeQuestion {
  countryId: string
  kind: PracticeKind
}

/**
 * Otázky pro procvičení: až `size` nejslabších zemí v náhodném pořadí.
 * Druhy otázek se střídají (vlajka, hlavní město), aby se to neomrzelo.
 */
export function practiceQueue(items: readonly WeakItem[], size = 10, random: () => number = Math.random): PracticeQuestion[] {
  return shuffled(items.slice(0, size), random).map((item, i) => ({ countryId: item.id, kind: i % 2 === 0 ? 'flag' : 'capital' }))
}
