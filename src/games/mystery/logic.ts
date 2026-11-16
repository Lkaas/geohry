// Herní logika hry Tajemná země (styl Globle). Čisté funkce bez závislosti na UI.
import { COUNTRIES, areNeighbors, borderDistanceKm, getCountry } from '../../shared/data'
import { dailyPick, randomPick } from '../../shared/random'
import type { GameMode } from '../../shared/types'
import { plural } from '../../shared/text'

export { plural }

export const GAME_ID = 'mystery'

export interface GuessResult {
  /** Kód tipované země. */
  id: string
  /** Nejkratší vzdálenost mezi hranicemi tipu a hledané země v km. */
  km: number
  /** Tip sousedí s hledanou zemí. */
  neighbor: boolean
  /** Tip je hledaná země. */
  correct: boolean
}

/** Jak si tip stojí proti předchozímu tipu. */
export type Trend = 'first' | 'hotter' | 'colder' | 'same'

export interface RankedGuess extends GuessResult {
  /** Pořadí tipu (od 1). */
  order: number
  trend: Trend
  /** Tip byl ve chvíli zadání nejblíž ze všech dosavadních. */
  best: boolean
}

/** Vybere hledanou zemi: u denní výzvy podle data (pro všechny stejnou), u volné hry náhodně. */
export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  const ids = COUNTRIES.map((c) => c.id)
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, ids) : randomPick(ids, random)
}

export function evaluateGuess(targetId: string, guessId: string): GuessResult {
  getCountry(guessId) // ověří, že země existuje
  const correct = guessId === targetId
  return {
    id: guessId,
    km: correct ? 0 : borderDistanceKm(targetId, guessId),
    neighbor: areNeighbors(targetId, guessId),
    correct,
  }
}

export function trendOf(previousKm: number | undefined, km: number): Trend {
  if (previousKm === undefined) return 'first'
  if (km < previousKm) return 'hotter'
  if (km > previousKm) return 'colder'
  return 'same'
}

/** Vyhodnotí všechny tipy v pořadí, v jakém je hráč zadal. */
export function evaluateAll(targetId: string, guessIds: readonly string[]): RankedGuess[] {
  const out: RankedGuess[] = []
  let bestSoFar = Infinity
  for (const [i, id] of guessIds.entries()) {
    const result = evaluateGuess(targetId, id)
    const previous = out[i - 1]
    out.push({ ...result, order: i + 1, trend: trendOf(previous?.km, result.km), best: result.km < bestSoFar })
    bestSoFar = Math.min(bestSoFar, result.km)
  }
  return out
}

/** Seřadí tipy od nejbližšího (správný tip je první, pak sousedé, pak podle km; při shodě dřívější tip výš). */
export function sortByDistance<T extends GuessResult & { order: number }>(guesses: readonly T[]): T[] {
  const weight = (g: GuessResult) => (g.correct ? -2 : g.neighbor ? -1 : g.km)
  return [...guesses].sort((a, b) => weight(a) - weight(b) || a.order - b.order)
}

// ---------------------------------------------------------------------------
// Barvy: studená (daleko) -> teplá (blízko)
// ---------------------------------------------------------------------------
export const CORRECT_COLOR = '#1E9E57'

/** Zlomové body barevné škály: [vzdálenost v km, barva]. Mezi body se barva plynule míchá. */
const HEAT_STOPS: [number, string][] = [
  [0, '#A80F1C'],
  [400, '#D92B25'],
  [1200, '#F0692B'],
  [2500, '#F7A63A'],
  [4500, '#F6E08C'],
  [7500, '#8FB3E0'],
  [12000, '#4F7DC4'],
]

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgbToHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

/** Barva tipu podle vzdálenosti od hledané země. */
export function heatColor(km: number): string {
  if (km <= HEAT_STOPS[0][0]) return HEAT_STOPS[0][1]
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [km1, color1] = HEAT_STOPS[i]
    if (km <= km1) {
      const [km0, color0] = HEAT_STOPS[i - 1]
      const t = (km - km0) / (km1 - km0)
      const a = hexToRgb(color0)
      const b = hexToRgb(color1)
      return rgbToHex(a.map((v, k) => v + (b[k] - v) * t))
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1]
}

export function guessColor(guess: GuessResult): string {
  return guess.correct ? CORRECT_COLOR : heatColor(guess.km)
}

/** Čtvereček pro sdílení výsledku. */
export function heatEmoji(guess: GuessResult): string {
  if (guess.correct) return '🟩'
  if (guess.km <= 800) return '🟥'
  if (guess.km <= 2500) return '🟧'
  if (guess.km <= 5000) return '🟨'
  if (guess.km <= 9000) return '🟦'
  return '⬜'
}

export interface ShareInput {
  /** Např. "16. 11. 2026" u denní výzvy, jinak "volná hra". */
  label: string
  guesses: readonly GuessResult[]
  gaveUp: boolean
}

/** Text ke sdílení: neprozrazuje zemi, jen jak se hráč přibližoval. */
export function buildShareText({ label, guesses, gaveUp }: ShareInput): string {
  const headline = gaveUp ? `Vzdáno po ${guesses.length} ${plural(guesses.length, 'tipu', 'tipech', 'tipech')}` : `Uhodnuto na ${guesses.length}. pokus`
  const squares = guesses.map(heatEmoji)
  const rows: string[] = []
  for (let i = 0; i < squares.length; i += 10) rows.push(squares.slice(i, i + 10).join(''))
  return [`GeoHry: Tajemná země (${label})`, headline, ...rows].join('\n')
}
