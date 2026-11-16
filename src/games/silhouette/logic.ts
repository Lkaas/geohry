// Herní logika hry Silueta (styl Worldle): poznat zemi podle obrysu. Čisté funkce bez závislosti na UI.
import { COUNTRIES, getCountry } from '../../shared/data'
import { bearingDeg, centerDistanceKm, compass } from '../../shared/geo'
import { dailyPick, randomPick } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'

export const GAME_ID = 'silhouette'
export const MAX_GUESSES = 6

/** Hrají se země, jejichž obrys je na mapě 1:50m rozumně vidět (bez ministátů a drobných ostrovů). */
export const TARGET_IDS = COUNTRIES.filter((c) => !c.marker).map((c) => c.id)

export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, TARGET_IDS) : randomPick(TARGET_IDS, random)
}

/** Největší možná vzdálenost dvou míst na Zemi (polovina obvodu). */
const HALF_EARTH_KM = 20_000

export interface GuessResult {
  id: string
  correct: boolean
  /** Vzdálenost středů v km. */
  km: number
  /** Směr od tipu k hledané zemi (azimut), null u správného tipu. */
  bearing: number | null
  /** Blízkost 0–100 %: 100 = správně, 0 = na opačné straně Země. */
  proximity: number
}

export function evaluateGuess(targetId: string, guessId: string): GuessResult {
  const target = getCountry(targetId)
  const guess = getCountry(guessId)
  const correct = targetId === guessId
  const km = centerDistanceKm(guess, target)
  return { id: guessId, correct, km, bearing: correct ? null : bearingDeg(guess, target), proximity: correct ? 100 : Math.min(99, Math.max(0, Math.round((1 - km / HALF_EARTH_KM) * 100))) }
}

export function roundStatus(targetId: string, guesses: readonly string[]): DailyStatus {
  if (guesses.includes(targetId)) return 'won'
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing'
}

/** Pět čtverečků podle blízkosti (každý = 20 %), za nimi šipka směru. */
export function shareRow(result: GuessResult): string {
  if (result.correct) return '🟩🟩🟩🟩🟩 🎯'
  const full = Math.floor(result.proximity / 20)
  const half = result.proximity % 20 >= 10 ? 1 : 0
  return '🟩'.repeat(full) + '🟨'.repeat(half) + '⬛'.repeat(5 - full - half) + ' ' + compass(result.bearing ?? 0).arrow
}

export function buildShareText(label: string, results: readonly GuessResult[], won: boolean): string {
  return [`GeoHry: Silueta (${label}) ${won ? results.length : 'X'}/${MAX_GUESSES}`, ...results.map(shareRow)].join('\n')
}
