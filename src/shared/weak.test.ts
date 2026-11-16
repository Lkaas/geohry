// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { listKeys, removeKey } from './storage'
import { loadWeak, practiceQueue, recordPractice, recordRound, troubleOf, weakList } from './weak'

beforeEach(() => {
  for (const key of listKeys()) removeKey(key)
})

describe('slabá místa', () => {
  it('vyhraná kola zemi mezi slabá místa nezařadí', () => {
    recordRound('CZE', false, '2026-11-10')
    recordRound('CZE', false, '2026-11-11')
    expect(loadWeak().CZE).toEqual({ rounds: 2, lost: 0, fixed: 0, last: '2026-11-11' })
    expect(weakList()).toEqual([])
  })

  it('prohra zemi zařadí, víc prohr ji posune výš', () => {
    recordRound('TCD', true, '2026-11-10')
    recordRound('ROU', true, '2026-11-11')
    recordRound('TCD', true, '2026-11-12')
    expect(weakList().map((w) => [w.id, w.trouble])).toEqual([
      ['TCD', 2],
      ['ROU', 1],
    ])
  })

  it('při stejném počtu potíží je první ta, která se řešila naposledy', () => {
    recordRound('TCD', true, '2026-11-10')
    recordRound('ROU', true, '2026-11-12')
    expect(weakList().map((w) => w.id)).toEqual(['ROU', 'TCD'])
  })

  it('správná odpověď při procvičování ubere potíž, špatná ne', () => {
    recordRound('TCD', true, '2026-11-10')
    recordRound('TCD', true, '2026-11-11')
    recordPractice('TCD', false, '2026-11-12')
    expect(troubleOf(loadWeak().TCD)).toBe(2)
    recordPractice('TCD', true, '2026-11-12')
    expect(troubleOf(loadWeak().TCD)).toBe(1)
    recordPractice('TCD', true, '2026-11-12')
    expect(weakList()).toEqual([])
  })

  it('procvičování nikdy neodečte víc, než kolik bylo potíží', () => {
    recordRound('TCD', true, '2026-11-10')
    recordPractice('TCD', true, '2026-11-11')
    recordPractice('TCD', true, '2026-11-11')
    expect(loadWeak().TCD.fixed).toBe(1)
    recordRound('TCD', true, '2026-11-12')
    expect(troubleOf(loadWeak().TCD)).toBe(1)
  })

  it('neznámou zemi ignoruje', () => {
    recordRound('XXX', true, '2026-11-10')
    expect(loadWeak()).toEqual({})
  })
})

describe('practiceQueue', () => {
  const items = Array.from({ length: 14 }, (_, i) => ({ id: 'AAA' + i, trouble: 14 - i, rounds: 1, last: '' }))

  it('vezme nejvýš deset nejslabších zemí', () => {
    const queue = practiceQueue(items, 10, () => 0.5)
    expect(queue).toHaveLength(10)
    const ids = new Set(queue.map((q) => q.countryId))
    expect(ids.has('AAA0')).toBe(true)
    expect(ids.has('AAA13')).toBe(false)
  })

  it('každá země je v řadě jednou a druhy otázek se střídají', () => {
    const queue = practiceQueue(items.slice(0, 5), 10, () => 0.3)
    expect(new Set(queue.map((q) => q.countryId)).size).toBe(5)
    expect(queue.map((q) => q.kind)).toEqual(['flag', 'capital', 'flag', 'capital', 'flag'])
  })

  it('prázdný seznam dá prázdnou řadu', () => {
    expect(practiceQueue([])).toEqual([])
  })
})
