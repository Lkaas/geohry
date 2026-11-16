// Pamětní okamžiky (např. 197. odehraná hra).
import { loadJson, saveJson } from './storage'
import { loadStats } from './stats'

/** Součet odehraných her (denních i volných) ve všech hrách. */
export function totalPlayed(gameIds: readonly string[]): number {
  return gameIds.reduce((sum, id) => sum + loadStats(id, 'daily').played + loadStats(id, 'free').played, 0)
}

/** Vrátí true jen poprvé, když součet dosáhne cíle. Pak si zapamatuje, že už se ukázalo. */
export function reachedOnce(key: string, current: number, target: number): boolean {
  if (current < target) return false
  const seenKey = `milestone:${key}`
  if (loadJson(seenKey, false)) return false
  saveJson(seenKey, true)
  return true
}
