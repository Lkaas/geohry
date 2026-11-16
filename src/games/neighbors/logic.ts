// Herní logika hry Sousedé: vyjmenovat všechny země, se kterými zadaná země sousedí. Čisté funkce bez závislosti na UI.
import { COUNTRIES, allNeighbors, getCountry } from '../../shared/data'
import { dailyPick, randomPick } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'

export const GAME_ID = 'neighbors'
/** Po třetí chybě hra končí. */
export const MAX_MISTAKES = 3
/** Hrají se jen země s aspoň dvěma sousedy. */
export const MIN_NEIGHBORS = 2

export const TARGET_IDS = COUNTRIES.filter((c) => allNeighbors(c).length >= MIN_NEIGHBORS).map((c) => c.id)

/** Sousedé, které je potřeba najít: pozemní hranice i hranice přes zámořská území. */
export function neighborsOf(countryId: string): string[] {
  return allNeighbors(getCountry(countryId))
}

/** Sousedí tyto dvě země jen přes zámořské území? */
export function isOverseasBorder(countryId: string, otherId: string): boolean {
  return getCountry(countryId).overseasNeighbors.includes(otherId)
}

export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, TARGET_IDS) : randomPick(TARGET_IDS, random)
}

export interface Progress {
  /** Správně uhodnutí sousedé v pořadí tipů. */
  found: string[]
  /** Špatné tipy. */
  mistakes: string[]
  /** Sousedé, kteří ještě chybí. */
  missing: string[]
  status: DailyStatus
}

export function evaluate(targetId: string, guesses: readonly string[]): Progress {
  const neighbors = neighborsOf(targetId)
  const found = guesses.filter((id) => neighbors.includes(id))
  const mistakes = guesses.filter((id) => !neighbors.includes(id))
  const missing = neighbors.filter((id) => !found.includes(id))
  const status: DailyStatus = missing.length === 0 ? 'won' : mistakes.length >= MAX_MISTAKES ? 'lost' : 'playing'
  return { found, mistakes, missing, status }
}

export function buildShareText(label: string, targetId: string, guesses: readonly string[]): string {
  const neighbors = neighborsOf(targetId)
  const { found, mistakes } = evaluate(targetId, guesses)
  const squares = guesses.map((id) => (neighbors.includes(id) ? '🟩' : '🟥')).join('')
  return [`GeoHry: Sousedé (${label})`, `${found.length}/${neighbors.length} sousedů, chyby: ${mistakes.length}`, squares].join('\n')
}
