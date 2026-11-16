import { describe, expect, it } from 'vitest'
import { COUNTRIES } from './data'
import { continentProgress, rankOf } from './collection'

describe('rankOf', () => {
  it('nejlidnatější a největší země mají pořadí 1', () => {
    const mostPeople = [...COUNTRIES].sort((a, b) => b.population - a.population)[0]
    const largest = [...COUNTRIES].sort((a, b) => b.area - a.area)[0]
    expect(rankOf(mostPeople.id, 'population')).toBe(1)
    expect(rankOf(largest.id, 'area')).toBe(1)
    expect(largest.id).toBe('RUS')
  })
  it('nejmenší stát je poslední', () => {
    expect(rankOf('VAT', 'area')).toBeGreaterThanOrEqual(COUNTRIES.length - 1)
  })
  it('neznámá země vyhodí chybu', () => {
    expect(() => rankOf('XXX', 'area')).toThrow()
  })
})

describe('continentProgress', () => {
  it('sečte země po kontinentech', () => {
    const progress = continentProgress(new Set(['CZE', 'DEU', 'JPN']))
    expect(progress.reduce((n, p) => n + p.total, 0)).toBe(COUNTRIES.length)
    expect(progress.find((p) => p.continent === 'Evropa')?.have).toBe(2)
    expect(progress.find((p) => p.continent === 'Asie')?.have).toBe(1)
    expect(progress.find((p) => p.continent === 'Afrika')?.have).toBe(0)
  })
})
