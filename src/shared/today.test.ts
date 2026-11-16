// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameInfo } from '../games/registry'
import { listKeys, removeKey, saveJson } from './storage'
import { activeDailyStreak, EMPTY_STATS } from './stats'
import { summarizeToday } from './today'

// stačí cokoli, co je "hratelné" (má komponentu); komponenta se tu nespouští
const fake = (id: string, playable = true): GameInfo => ({
  id,
  route: id,
  title: id,
  description: '',
  emblem: 'star',
  component: playable ? ({} as never) : undefined,
})
const GAMES = [fake('a'), fake('b'), fake('c'), fake('soon', false)]

beforeEach(() => {
  for (const key of listKeys()) removeKey(key)
})

describe('summarizeToday', () => {
  it('na začátku dne nic není hotové a další je první hra', () => {
    const s = summarizeToday(GAMES, '2026-11-16')
    expect(s.total).toBe(3)
    expect(s.done).toBe(0)
    expect(s.next?.id).toBe('a')
    expect(s.bestStreak).toBe(0)
  })

  it('nehratelné hry (Připravuje se) se nepočítají', () => {
    expect(summarizeToday(GAMES, '2026-11-16').items.map((i) => i.game.id)).toEqual(['a', 'b', 'c'])
  })

  it('splněná i nevyšlá výzva se počítá jako dohraná', () => {
    saveJson('daily:a:2026-11-16', { status: 'won' })
    saveJson('daily:b:2026-11-16', { status: 'lost' })
    const s = summarizeToday(GAMES, '2026-11-16')
    expect(s.done).toBe(2)
    expect(s.next?.id).toBe('c')
  })

  it('rozehraná výzva má při výběru další přednost', () => {
    saveJson('daily:a:2026-11-16', { status: 'won' })
    saveJson('daily:c:2026-11-16', { status: 'playing' })
    expect(summarizeToday(GAMES, '2026-11-16').next?.id).toBe('c')
  })

  it('když je hotovo všechno, další není žádná', () => {
    for (const id of ['a', 'b', 'c']) saveJson(`daily:${id}:2026-11-16`, { status: 'won' })
    const s = summarizeToday(GAMES, '2026-11-16')
    expect(s.done).toBe(3)
    expect(s.next).toBeNull()
  })

  it('výzvy z jiného dne se nepočítají', () => {
    saveJson('daily:a:2026-11-15', { status: 'won' })
    expect(summarizeToday(GAMES, '2026-11-16').done).toBe(0)
  })

  it('série je nejdelší z her a jen taková, která ještě trvá', () => {
    saveJson('stats:a:daily', { ...EMPTY_STATS, currentStreak: 3, lastDailyWon: '2026-11-15' })
    saveJson('stats:b:daily', { ...EMPTY_STATS, currentStreak: 7, lastDailyWon: '2026-11-10' })
    expect(summarizeToday(GAMES, '2026-11-16').bestStreak).toBe(3)
  })
})

describe('activeDailyStreak', () => {
  const stats = { ...EMPTY_STATS, currentStreak: 4 }
  it('trvá, když poslední výhra byla dnes nebo včera', () => {
    expect(activeDailyStreak({ ...stats, lastDailyWon: '2026-11-16' }, '2026-11-16')).toBe(4)
    expect(activeDailyStreak({ ...stats, lastDailyWon: '2026-11-15' }, '2026-11-16')).toBe(4)
  })
  it('přes měsíc a rok funguje také', () => {
    expect(activeDailyStreak({ ...stats, lastDailyWon: '2026-12-31' }, '2027-01-01')).toBe(4)
  })
  it('po vynechaném dni končí', () => {
    expect(activeDailyStreak({ ...stats, lastDailyWon: '2026-11-14' }, '2026-11-16')).toBe(0)
  })
  it('bez výhry je nula', () => {
    expect(activeDailyStreak(stats, '2026-11-16')).toBe(0)
  })
})
