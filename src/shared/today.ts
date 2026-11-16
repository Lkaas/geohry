// Přehled dnešních denních výzev pro úvodní stránku.
import type { GameInfo } from '../games/registry'
import { activeDailyStreak, dailyStatus, loadStats, type DailyStatus } from './stats'

export interface TodayItem {
  game: GameInfo
  status: DailyStatus | 'none'
}

export interface TodaySummary {
  items: TodayItem[]
  /** Dohrané výzvy (splněné i nevyšlé). */
  done: number
  total: number
  /** Další výzva k hraní: nejdřív rozehraná, jinak první nezačatá. */
  next: GameInfo | null
  /** Nejdelší série denních výher, která dnes ještě trvá. */
  bestStreak: number
}

export function summarizeToday(games: readonly GameInfo[], today: string): TodaySummary {
  const playable = games.filter((g) => g.component)
  const items = playable.map((game) => ({ game, status: dailyStatus(game.id, today) }))
  const done = items.filter((i) => i.status === 'won' || i.status === 'lost').length
  const next = (items.find((i) => i.status === 'playing') ?? items.find((i) => i.status === 'none'))?.game ?? null
  const bestStreak = Math.max(0, ...playable.map((g) => activeDailyStreak(loadStats(g.id, 'daily'), today)))
  return { items, done, total: items.length, next, bestStreak }
}
