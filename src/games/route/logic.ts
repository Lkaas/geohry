// Herní logika hry Cesta mezi zeměmi (styl Travle). Čisté funkce bez závislosti na UI.
//
// Pojmy:
//   krok      = přechod přes jednu pozemní hranici
//   "between" = počet zemí, které leží na nejkratší cestě mezi startem a cílem (bez startu a cíle).
//               Česko -> Francie: nejkratší cesta Česko–Německo–Francie, between = 1.
import { COUNTRIES, getCountry } from '../../shared/data'
import { dailyPick, hashString, randomPick } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'

export const GAME_ID = 'route'

/** Hádanky mají na nejkratší cestě 2 až 6 zemí mezi startem a cílem. */
export const MIN_BETWEEN = 2
export const MAX_BETWEEN = 6
/** Kolik tipů navíc má hráč oproti nejkratší cestě. */
export const EXTRA_GUESSES = 4

const GRAPH = new Map(COUNTRIES.map((c) => [c.id, c.neighbors]))

/**
 * Prohledávání do šířky: počet kroků ze země `start` do všech dosažitelných zemí.
 * Když je zadáno `allowed`, smí se chodit jen přes tyto země.
 */
export function stepsFrom(start: string, allowed?: ReadonlySet<string>): Map<string, number> {
  const steps = new Map<string, number>([[start, 0]])
  const queue = [start]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]
    for (const next of GRAPH.get(current) ?? []) {
      if (steps.has(next) || (allowed && !allowed.has(next))) continue
      steps.set(next, steps.get(current)! + 1)
      queue.push(next)
    }
  }
  return steps
}

export interface Puzzle {
  /** Start a cíl. */
  a: string
  b: string
  /** Počet zemí na nejkratší cestě mezi A a B. */
  between: number
  /** Kolik tipů má hráč k dispozici. */
  maxGuesses: number
}

export function makePuzzle(a: string, b: string): Puzzle {
  const steps = stepsFrom(a).get(b)
  if (steps === undefined || steps < 2) throw new Error(`Mezi ${a} a ${b} nevede cesta přes aspoň jednu zemi`)
  return { a, b, between: steps - 1, maxGuesses: steps - 1 + EXTRA_GUESSES }
}

let pairsCache: [string, string][] | null = null

/** Všechny dvojice zemí (a < b podle abecedy kódů), mezi kterými má nejkratší cesta 2–6 zemí. */
export function allPuzzlePairs(): [string, string][] {
  if (pairsCache) return pairsCache
  const pairs: [string, string][] = []
  for (const country of COUNTRIES) {
    for (const [other, steps] of stepsFrom(country.id)) {
      if (country.id < other && steps - 1 >= MIN_BETWEEN && steps - 1 <= MAX_BETWEEN) pairs.push([country.id, other])
    }
  }
  pairsCache = pairs
  return pairs
}

/** Vybere hádanku: u denní výzvy podle data (pro všechny stejnou), u volné hry náhodně. */
export function pickPuzzle(mode: GameMode, dateKey: string, random: () => number = Math.random): Puzzle {
  const pairs = allPuzzlePairs()
  const [x, y] = mode === 'daily' ? dailyPick(GAME_ID, dateKey, pairs) : randomPick(pairs, random)
  // směr cesty se střídá, aby start nebyl vždy ten abecedně první
  const flip = mode === 'daily' ? hashString(dateKey) % 2 === 1 : random() < 0.5
  return flip ? makePuzzle(y, x) : makePuzzle(x, y)
}

/** shortest = leží na některé nejkratší cestě, near = zacházka o jednu zemi, off = mimo. */
export type GuessKind = 'shortest' | 'near' | 'off'

export function classifyGuess(puzzle: Puzzle, countryId: string): GuessKind {
  getCountry(countryId) // ověří, že země existuje
  const fromA = stepsFrom(puzzle.a).get(countryId)
  const fromB = stepsFrom(puzzle.b).get(countryId)
  if (fromA === undefined || fromB === undefined) return 'off'
  const detour = fromA + fromB - (puzzle.between + 1)
  if (detour === 0) return 'shortest'
  if (detour === 1) return 'near'
  return 'off'
}

/** Tvoří uhodnuté země souvislou cestu ze startu do cíle? */
export function isConnected(puzzle: Puzzle, guesses: readonly string[]): boolean {
  const allowed = new Set([puzzle.a, puzzle.b, ...guesses])
  return stepsFrom(puzzle.a, allowed).has(puzzle.b)
}

export function roundStatus(puzzle: Puzzle, guesses: readonly string[]): DailyStatus {
  if (isConnected(puzzle, guesses)) return 'won'
  return guesses.length >= puzzle.maxGuesses ? 'lost' : 'playing'
}

/** Jedna z nejkratších cest včetně startu a cíle (pro ukázání řešení). */
export function oneShortestPath(a: string, b: string): string[] {
  const toB = stepsFrom(b)
  if (!toB.has(a)) return []
  const path = [a]
  let current = a
  while (current !== b) {
    // další zemí je soused, který je k cíli o krok blíž; při více možnostech abecedně první
    current = [...(GRAPH.get(current) ?? [])].filter((n) => toB.get(n) === toB.get(current)! - 1).sort()[0]
    path.push(current)
  }
  return path
}

/**
 * Nápověda: země na některé nejkratší cestě, kterou hráč ještě netipoval ani neměl napovězenou.
 * Bere se ta nejblíž startu. Když už žádná není, vrací undefined.
 */
export function nextHint(puzzle: Puzzle, guesses: readonly string[], hints: readonly string[]): string | undefined {
  const known = new Set([puzzle.a, puzzle.b, ...guesses, ...hints])
  const fromA = stepsFrom(puzzle.a)
  return COUNTRIES.map((c) => c.id)
    .filter((id) => !known.has(id) && classifyGuess(puzzle, id) === 'shortest')
    .sort((x, y) => fromA.get(x)! - fromA.get(y)! || x.localeCompare(y))[0]
}

const KIND_EMOJI: Record<GuessKind, string> = { shortest: '🟩', near: '🟧', off: '🟥' }

export interface ShareInput {
  label: string
  puzzle: Puzzle
  guesses: readonly string[]
  hintCount: number
  won: boolean
}

export function buildShareText({ label, puzzle, guesses, hintCount, won }: ShareInput): string {
  const route = `${getCountry(puzzle.a).name} → ${getCountry(puzzle.b).name}`
  const score = won ? `${guesses.length}/${puzzle.maxGuesses} tipů` : `nedokončeno (${guesses.length}/${puzzle.maxGuesses})`
  const lines = [`GeoHry: Cesta mezi zeměmi (${label})`, `${route}, ${score}, nejkratší cesta ${puzzle.between}`]
  lines.push(guesses.map((id) => KIND_EMOJI[classifyGuess(puzzle, id)]).join('') + (hintCount > 0 ? ` 💡×${hintCount}` : ''))
  return lines.join('\n')
}
