import { describe, expect, it } from 'vitest'
import { COUNTRIES } from '../../shared/data'
import { seededRandom } from '../../shared/random'
import { buildShareText, evaluateAll, evaluateGuess, heatColor, heatEmoji, pickTarget, plural, sortByDistance, trendOf } from './logic'

describe('evaluateGuess', () => {
  it('správný tip', () => {
    expect(evaluateGuess('CZE', 'CZE')).toEqual({ id: 'CZE', km: 0, neighbor: false, correct: true })
  })
  it('soused má 0 km a příznak sousedství', () => {
    expect(evaluateGuess('CZE', 'AUT')).toEqual({ id: 'AUT', km: 0, neighbor: true, correct: false })
  })
  it('vzdálená země má kladnou vzdálenost a není soused', () => {
    const r = evaluateGuess('CZE', 'JPN')
    expect(r.neighbor).toBe(false)
    expect(r.correct).toBe(false)
    expect(r.km).toBeGreaterThan(7000)
  })
  it('blízká nesousední země nikdy nemá 0 km', () => {
    // Namibie a Zimbabwe se téměř dotýkají, ale hranici nemají
    expect(evaluateGuess('NAM', 'ZWE').km).toBeGreaterThan(0)
  })
  it('neznámá země vyhodí chybu', () => {
    expect(() => evaluateGuess('CZE', 'XXX')).toThrow()
  })
})

describe('trendOf', () => {
  it('porovnává s předchozím tipem', () => {
    expect(trendOf(undefined, 500)).toBe('first')
    expect(trendOf(1000, 500)).toBe('hotter')
    expect(trendOf(500, 1000)).toBe('colder')
    expect(trendOf(500, 500)).toBe('same')
  })
})

describe('evaluateAll', () => {
  it('čísluje tipy, určuje trend a nejlepší dosavadní tip', () => {
    const all = evaluateAll('CZE', ['JPN', 'FRA', 'BRA', 'DEU', 'CZE'])
    expect(all.map((g) => g.order)).toEqual([1, 2, 3, 4, 5])
    expect(all.map((g) => g.trend)).toEqual(['first', 'hotter', 'colder', 'hotter', 'same'])
    expect(all.map((g) => g.best)).toEqual([true, true, false, true, false])
    expect(all[4].correct).toBe(true)
  })
})

describe('sortByDistance', () => {
  it('řadí správný tip, pak sousedy, pak podle km', () => {
    const sorted = sortByDistance(evaluateAll('CZE', ['JPN', 'DEU', 'FRA', 'CZE', 'AUT']))
    expect(sorted.map((g) => g.id)).toEqual(['CZE', 'DEU', 'AUT', 'FRA', 'JPN'])
  })
})

describe('heatColor', () => {
  it('blízko je červená, daleko modrá', () => {
    expect(heatColor(0)).toBe('#A80F1C')
    expect(heatColor(20000)).toBe('#4F7DC4')
  })
  it('vrací platnou barvu pro jakoukoli vzdálenost', () => {
    for (const km of [1, 399, 400, 401, 1999, 5000, 7499, 12000, 19999]) expect(heatColor(km)).toMatch(/^#[0-9A-F]{6}$/)
  })
  it('červená složka s rostoucí vzdáleností od 2500 km dál neroste', () => {
    const red = (km: number) => parseInt(heatColor(km).slice(1, 3), 16)
    expect(red(3000)).toBeGreaterThan(red(8000))
    expect(red(8000)).toBeGreaterThan(red(12000))
  })
})

describe('sdílení', () => {
  it('emoji podle vzdálenosti', () => {
    expect(heatEmoji({ id: 'A', km: 0, neighbor: false, correct: true })).toBe('🟩')
    expect(heatEmoji({ id: 'A', km: 0, neighbor: true, correct: false })).toBe('🟥')
    expect(heatEmoji({ id: 'A', km: 2000, neighbor: false, correct: false })).toBe('🟧')
    expect(heatEmoji({ id: 'A', km: 4000, neighbor: false, correct: false })).toBe('🟨')
    expect(heatEmoji({ id: 'A', km: 8000, neighbor: false, correct: false })).toBe('🟦')
    expect(heatEmoji({ id: 'A', km: 15000, neighbor: false, correct: false })).toBe('⬜')
  })
  it('text výhry neprozrazuje zemi', () => {
    const guesses = evaluateAll('CZE', ['JPN', 'DEU', 'CZE'])
    const text = buildShareText({ label: '16. 11. 2026', guesses, gaveUp: false })
    expect(text).toBe('GeoHry: Tajemná země (16. 11. 2026)\nUhodnuto na 3. pokus\n🟦🟥🟩')
    expect(text).not.toContain('Česko')
  })
  it('text po vzdání a zalomení po deseti', () => {
    const guesses = evaluateAll('CZE', ['JPN', 'DEU', 'FRA', 'ESP', 'ITA', 'POL', 'SVK', 'AUT', 'HUN', 'CHE', 'BEL'])
    const text = buildShareText({ label: 'volná hra', guesses, gaveUp: true })
    const lines = text.split('\n')
    expect(lines[1]).toBe('Vzdáno po 11 tipech')
    expect(lines).toHaveLength(4)
  })
})

describe('pickTarget', () => {
  it('denní výzva je pro stejný den vždy stejná', () => {
    expect(pickTarget('daily', '2026-11-16')).toBe(pickTarget('daily', '2026-11-16'))
  })
  it('denní výzvy se za 197 dní nezopakují', () => {
    const picks = new Set<string>()
    for (let day = 0; day < 197; day++) {
      const d = new Date(Date.UTC(2026, 0, 1 + day))
      picks.add(pickTarget('daily', d.toISOString().slice(0, 10)))
    }
    expect(picks.size).toBe(197)
  })
  it('volná hra vybírá z platných zemí', () => {
    const id = pickTarget('free', '2026-11-16', seededRandom(5))
    expect(COUNTRIES.some((c) => c.id === id)).toBe(true)
  })
})

describe('plural', () => {
  it('skloňuje česky', () => {
    expect([1, 2, 5].map((n) => plural(n, 'tip', 'tipy', 'tipů'))).toEqual(['tip', 'tipy', 'tipů'])
  })
})
