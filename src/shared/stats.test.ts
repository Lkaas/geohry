import { describe, expect, it } from 'vitest'
import { applyResult, EMPTY_STATS } from './stats'

describe('applyResult – denní výzva', () => {
  it('započítá výhru a rozložení pokusů', () => {
    const s = applyResult(EMPTY_STATS, { won: true, attempts: 4, date: '2026-11-16' }, 'daily')
    expect(s).toMatchObject({ played: 1, won: 1, currentStreak: 1, maxStreak: 1, distribution: { '4': 1 } })
  })
  it('série roste jen při výhrách v po sobě jdoucích dnech', () => {
    let s = applyResult(EMPTY_STATS, { won: true, attempts: 3, date: '2026-11-14' }, 'daily')
    s = applyResult(s, { won: true, attempts: 5, date: '2026-11-15' }, 'daily')
    expect(s.currentStreak).toBe(2)
    s = applyResult(s, { won: true, attempts: 5, date: '2026-11-17' }, 'daily') // vynechaný den
    expect(s.currentStreak).toBe(1)
    expect(s.maxStreak).toBe(2)
  })
  it('prohra sérii vynuluje', () => {
    let s = applyResult(EMPTY_STATS, { won: true, attempts: 3, date: '2026-11-14' }, 'daily')
    s = applyResult(s, { won: false, attempts: 8, date: '2026-11-15' }, 'daily')
    expect(s).toMatchObject({ played: 2, won: 1, currentStreak: 0, maxStreak: 1 })
  })
  it('stejný den se nezapočítá dvakrát', () => {
    const once = applyResult(EMPTY_STATS, { won: true, attempts: 3, date: '2026-11-14' }, 'daily')
    const twice = applyResult(once, { won: true, attempts: 3, date: '2026-11-14' }, 'daily')
    expect(twice).toBe(once)
  })
  it('nemění původní objekt', () => {
    const before = { ...EMPTY_STATS, distribution: {} }
    applyResult(before, { won: true, attempts: 2, date: '2026-11-14' }, 'daily')
    expect(before).toEqual(EMPTY_STATS)
  })
})

describe('applyResult – volná hra', () => {
  it('série je počet výher v řadě', () => {
    let s = applyResult(EMPTY_STATS, { won: true, attempts: 3 }, 'free')
    s = applyResult(s, { won: true, attempts: 3 }, 'free')
    expect(s.currentStreak).toBe(2)
    expect(s.distribution).toEqual({ '3': 2 })
    s = applyResult(s, { won: false, attempts: 9 }, 'free')
    expect(s.currentStreak).toBe(0)
    expect(s.maxStreak).toBe(2)
  })
})
