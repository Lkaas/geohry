import { describe, expect, it } from 'vitest'
import { dailyPick, dateKey, dayNumber, formatDateKey, previousDateKey, seededRandom, shuffled } from './random'

describe('seededRandom', () => {
  it('se stejným semínkem dává stejnou posloupnost', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('vrací čísla mezi 0 a 1', () => {
    const r = seededRandom(7)
    for (let i = 0; i < 1000; i++) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('datum', () => {
  it('dateKey formátuje místní datum', () => {
    expect(dateKey(new Date(2026, 10, 16, 23, 59))).toBe('2026-11-16')
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('dayNumber počítá dny od 1. 1. 2026', () => {
    expect(dayNumber('2026-01-01')).toBe(0)
    expect(dayNumber('2026-01-02')).toBe(1)
    expect(dayNumber('2027-01-01')).toBe(365)
  })
  it('previousDateKey přechází přes měsíc i rok', () => {
    expect(previousDateKey('2026-11-16')).toBe('2026-11-15')
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28')
    expect(previousDateKey('2027-01-01')).toBe('2026-12-31')
  })
  it('formatDateKey píše datum česky', () => {
    expect(formatDateKey('2026-11-06')).toBe('6. 11. 2026')
  })
})

describe('dailyPick', () => {
  const items = Array.from({ length: 50 }, (_, i) => i)
  it('je deterministický', () => {
    expect(dailyPick('hra', '2026-11-16', items)).toBe(dailyPick('hra', '2026-11-16', items))
  })
  it('různé hry mají ve stejný den různé pořadí', () => {
    const a = items.map((_, d) => dailyPick('a', previousNDays(d), items))
    const b = items.map((_, d) => dailyPick('b', previousNDays(d), items))
    expect(a).not.toEqual(b)
  })
  it('během jednoho cyklu se žádná položka nezopakuje', () => {
    // dny 0..49 jsou první cyklus
    const picks = items.map((_, d) => dailyPick('hra', keyOfDay(d), items))
    expect(new Set(picks).size).toBe(items.length)
  })
})

describe('shuffled', () => {
  it('zachová všechny prvky a nemění původní pole', () => {
    const original = [1, 2, 3, 4, 5]
    const result = shuffled(original, seededRandom(1))
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
    expect(original).toEqual([1, 2, 3, 4, 5])
  })
})

function keyOfDay(day: number): string {
  const date = new Date(Date.UTC(2026, 0, 1 + day))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
function previousNDays(n: number): string {
  return keyOfDay(400 + n)
}
