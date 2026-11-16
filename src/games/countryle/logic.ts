// Herní logika hry Countryle: porovnání vlastností tipované země s hledanou. Čisté funkce bez závislosti na UI.
import { COUNTRIES, getCountry } from '../../shared/data'
import { bearingDeg, centerDistanceKm, compass } from '../../shared/geo'
import { dailyPick, randomPick } from '../../shared/random'
import type { Continent, Country, GameMode } from '../../shared/types'

export const GAME_ID = 'countryle'
export const MAX_GUESSES = 8

/** Jak blízko je hodnota tipu hodnotě hledané země. unknown = údaj chybí. */
export type Closeness = 'exact' | 'close' | 'medium' | 'far' | 'unknown'
/** Má hledaná země hodnotu vyšší, nebo nižší než tip? */
export type Direction = 'higher' | 'lower' | 'equal' | 'unknown'

export interface NumberHint {
  /** Hodnota tipované země. */
  value: number | null
  direction: Direction
  closeness: Closeness
}

export interface Comparison {
  id: string
  correct: boolean
  continent: { value: Continent; match: boolean }
  /** Polokoule tipu: S/J (severní/jižní) a V/Z (východní/západní) a zda se shoduje s hledanou zemí. */
  hemisphere: { ns: 'S' | 'J'; ew: 'V' | 'Z'; nsMatch: boolean; ewMatch: boolean }
  population: NumberHint
  area: NumberHint
  temperature: NumberHint
  /** Vzdálenost středů v km a směr od tipu k hledané zemi (azimut ve stupních; null u správného tipu). */
  distanceKm: number
  bearing: number | null
}

// Hranice pro barvy. Populace a rozloha se porovnávají poměrem (větší / menší), teplota rozdílem ve °C.
export const RATIO_CLOSE = 1.3
export const RATIO_MEDIUM = 3
export const TEMP_CLOSE = 2
export const TEMP_MEDIUM = 6

export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  const ids = COUNTRIES.map((c) => c.id)
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, ids) : randomPick(ids, random)
}

const directionOf = (guess: number, target: number): Direction => (target > guess ? 'higher' : target < guess ? 'lower' : 'equal')

/** Porovnání poměrem: 10 mil. vs 12 mil. je "blízko", 10 mil. vs 25 mil. "středně", 10 mil. vs 100 mil. "daleko". */
export function compareByRatio(guess: number, target: number): NumberHint {
  const ratio = Math.max(guess, target) / Math.min(guess, target)
  const closeness: Closeness = ratio === 1 ? 'exact' : ratio <= RATIO_CLOSE ? 'close' : ratio <= RATIO_MEDIUM ? 'medium' : 'far'
  return { value: guess, direction: directionOf(guess, target), closeness }
}

/** Porovnání rozdílem (teplota). Když jedna z hodnot chybí, výsledek je "unknown". */
export function compareByDifference(guess: number | null, target: number | null): NumberHint {
  if (guess === null || target === null) return { value: guess, direction: 'unknown', closeness: 'unknown' }
  const diff = Math.abs(guess - target)
  const closeness: Closeness = diff === 0 ? 'exact' : diff <= TEMP_CLOSE ? 'close' : diff <= TEMP_MEDIUM ? 'medium' : 'far'
  return { value: guess, direction: directionOf(guess, target), closeness }
}

const hemisphereOf = (c: Country) => ({ ns: c.lat >= 0 ? ('S' as const) : ('J' as const), ew: c.lon >= 0 ? ('V' as const) : ('Z' as const) })

export function compare(targetId: string, guessId: string): Comparison {
  const target = getCountry(targetId)
  const guess = getCountry(guessId)
  const correct = targetId === guessId
  const th = hemisphereOf(target)
  const gh = hemisphereOf(guess)
  return {
    id: guessId,
    correct,
    continent: { value: guess.continent, match: guess.continent === target.continent },
    hemisphere: { ...gh, nsMatch: gh.ns === th.ns, ewMatch: gh.ew === th.ew },
    population: compareByRatio(guess.population, target.population),
    area: compareByRatio(guess.area, target.area),
    temperature: compareByDifference(guess.avgTemp, target.avgTemp),
    distanceKm: centerDistanceKm(guess, target),
    bearing: correct ? null : bearingDeg(guess, target),
  }
}

export function roundStatus(targetId: string, guesses: readonly string[]): 'playing' | 'won' | 'lost' {
  if (guesses.includes(targetId)) return 'won'
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing'
}

// Formátování hodnot je společné pro více her, viz src/shared/format.ts
export { formatArea, formatPopulation, formatTemperature } from '../../shared/format'

// ---------------------------------------------------------------------------
// Sdílení
// ---------------------------------------------------------------------------
const CLOSENESS_EMOJI: Record<Closeness, string> = { exact: '🟩', close: '🟩', medium: '🟨', far: '⬛', unknown: '⬜' }
const bool = (ok: boolean) => (ok ? '🟩' : '⬛')

/** Řádek čtverečků za jeden tip: kontinent, polokoule S/J, polokoule V/Z, populace, rozloha, teplota a šipka směru. */
export function shareRow(c: Comparison): string {
  const squares =
    bool(c.continent.match) + bool(c.hemisphere.nsMatch) + bool(c.hemisphere.ewMatch) + CLOSENESS_EMOJI[c.population.closeness] + CLOSENESS_EMOJI[c.area.closeness] + CLOSENESS_EMOJI[c.temperature.closeness]
  return `${squares} ${c.bearing === null ? '🎯' : compass(c.bearing).arrow}`
}

export function buildShareText(label: string, comparisons: readonly Comparison[], won: boolean): string {
  const score = won ? `${comparisons.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`
  return [`GeoHry: Countryle (${label}) ${score}`, ...comparisons.map(shareRow)].join('\n')
}
