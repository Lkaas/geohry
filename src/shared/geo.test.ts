import { describe, expect, it } from 'vitest'
import { getCountry, borderDistanceKm, areNeighbors, COUNTRIES } from './data'
import { bearingDeg, centerDistanceKm, compass, formatKm } from './geo'

describe('data', () => {
  it('má 197 zemí', () => {
    expect(COUNTRIES).toHaveLength(197)
  })
  it('sousedé mají vzdálenost hranic 0 a naopak', () => {
    expect(borderDistanceKm('CZE', 'DEU')).toBe(0)
    expect(areNeighbors('CZE', 'DEU')).toBe(true)
    expect(borderDistanceKm('CZE', 'HRV')).toBeGreaterThan(100)
    expect(areNeighbors('CZE', 'HRV')).toBe(false)
    expect(areNeighbors('CZE', 'CZE')).toBe(false)
  })
  it('matice je symetrická', () => {
    expect(borderDistanceKm('JPN', 'BRA')).toBe(borderDistanceKm('BRA', 'JPN'))
  })
})

describe('geo', () => {
  const cze = getCountry('CZE')
  it('vzdálenost středů odpovídá realitě', () => {
    const km = centerDistanceKm(cze, getCountry('JPN'))
    expect(km).toBeGreaterThan(8000)
    expect(km).toBeLessThan(10000)
    expect(centerDistanceKm(cze, cze)).toBe(0)
  })
  it('směr z Česka', () => {
    expect(compass(bearingDeg(cze, getCountry('SWE'))).label).toBe('sever')
    expect(compass(bearingDeg(cze, getCountry('UKR'))).label).toBe('východ')
    expect(compass(bearingDeg(cze, getCountry('ITA'))).label).toBe('jih')
    expect(compass(bearingDeg(cze, getCountry('FRA'))).label).toBe('západ')
  })
  it('compass zvládne okraje', () => {
    expect(compass(359).label).toBe('sever')
    expect(compass(-10).label).toBe('sever')
    expect(compass(135).label).toBe('jihovýchod')
  })
  it('formatKm odděluje tisíce', () => {
    expect(formatKm(12345).replace(/\s/g, ' ')).toBe('12 345 km')
  })
})
