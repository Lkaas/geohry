import { loadJson, saveJson } from './storage'
import { previousDateKey } from './random'
import type { GameMode } from './types'

export interface GameStats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  /** Kolikrát hráč vyhrál na daný počet pokusů: { "3": 2, "4": 5 } */
  distribution: Record<string, number>
  /** Datum poslední započítané denní výzvy (aby se jedna nezapočítala dvakrát). */
  lastDaily?: string
  /** Datum poslední vyhrané denní výzvy (pro sérii po sobě jdoucích dní). */
  lastDailyWon?: string
}

export interface GameResult {
  won: boolean
  /** Počet pokusů (u výhry se zapisuje do rozložení). */
  attempts: number
  /** Datum denní výzvy "2026-11-16". U volné hry se nepoužívá. */
  date?: string
}

export const EMPTY_STATS: GameStats = { played: 0, won: 0, currentStreak: 0, maxStreak: 0, distribution: {} }

/**
 * Čistá funkce: vrátí nové statistiky po započtení výsledku.
 * Denní výzva: série = počet po sobě jdoucích dní s výhrou. Volná hra: série = počet výher v řadě.
 */
export function applyResult(stats: GameStats, result: GameResult, mode: GameMode): GameStats {
  if (mode === 'daily' && result.date && stats.lastDaily === result.date) return stats
  const next: GameStats = { ...stats, distribution: { ...stats.distribution }, played: stats.played + 1 }
  if (result.won) {
    next.won += 1
    const key = String(result.attempts)
    next.distribution[key] = (next.distribution[key] ?? 0) + 1
    if (mode === 'daily' && result.date) {
      const continues = stats.lastDailyWon === previousDateKey(result.date)
      next.currentStreak = continues ? stats.currentStreak + 1 : 1
      next.lastDailyWon = result.date
    } else {
      next.currentStreak = stats.currentStreak + 1
    }
  } else {
    next.currentStreak = 0
  }
  next.maxStreak = Math.max(stats.maxStreak, next.currentStreak)
  if (mode === 'daily' && result.date) next.lastDaily = result.date
  return next
}

/**
 * Série denních výher, která ještě trvá: poslední výhra byla dnes nebo včera.
 * Uložené `currentStreak` se přepočítá až při další hře, takže po vynechaných dnech by ukazovalo starou hodnotu.
 */
export function activeDailyStreak(stats: GameStats, today: string): number {
  if (!stats.lastDailyWon) return 0
  return stats.lastDailyWon === today || stats.lastDailyWon === previousDateKey(today) ? stats.currentStreak : 0
}

const statsKey = (gameId: string, mode: GameMode) => `stats:${gameId}:${mode}`

export function loadStats(gameId: string, mode: GameMode): GameStats {
  return { ...EMPTY_STATS, ...loadJson<Partial<GameStats>>(statsKey(gameId, mode), {}) }
}

export function recordResult(gameId: string, mode: GameMode, result: GameResult): GameStats {
  const next = applyResult(loadStats(gameId, mode), result, mode)
  saveJson(statsKey(gameId, mode), next)
  return next
}

// ---------------------------------------------------------------------------
// Rozehraná / dohraná denní výzva
// ---------------------------------------------------------------------------
export type DailyStatus = 'playing' | 'won' | 'lost'

/** Každá hra si do denního stavu ukládá, co potřebuje, ale vždy včetně pole `status`. */
export interface DailyStateBase {
  status: DailyStatus
}

const dailyKey = (gameId: string, date: string) => `daily:${gameId}:${date}`

export function loadDaily<T extends DailyStateBase>(gameId: string, date: string): T | null {
  return loadJson<T | null>(dailyKey(gameId, date), null)
}

export function saveDaily<T extends DailyStateBase>(gameId: string, date: string, state: T): void {
  saveJson(dailyKey(gameId, date), state)
}

/** Stav dnešní výzvy pro dlaždici na domovské obrazovce. */
export function dailyStatus(gameId: string, date: string): DailyStatus | 'none' {
  return loadDaily<DailyStateBase>(gameId, date)?.status ?? 'none'
}

// ---------------------------------------------------------------------------
// Album vlajek: které země už hráč někdy uhodl (využije budoucí hra Album vlajek)
// ---------------------------------------------------------------------------
export function collectedCountries(): Record<string, string> {
  return loadJson<Record<string, string>>('album', {})
}

/** Zapíše, že hráč zemi uhodl. Vrací true, pokud je to poprvé. */
export function collectCountry(countryId: string, date: string): boolean {
  const album = collectedCountries()
  if (album[countryId]) return false
  album[countryId] = date
  saveJson('album', album)
  return true
}
