import { describe, expect, it } from 'vitest'
import { getCountry } from '../../shared/data'
import { compass } from '../../shared/geo'
import {
  MAX_GUESSES, buildShareText, compare, compareByDifference, compareByRatio, formatArea, formatPopulation, formatTemperature, pickTarget, roundStatus, shareRow,
} from './logic'

const nbsp = (s: string) => s.replace(/\s/g, ' ')

describe('compareByRatio', () => {
  it('určuje směr k hledané hodnotě', () => {
    expect(compareByRatio(10, 20).direction).toBe('higher')
    expect(compareByRatio(20, 10).direction).toBe('lower')
    expect(compareByRatio(10, 10)).toEqual({ value: 10, direction: 'equal', closeness: 'exact' })
  })
  it('blízkost podle poměru', () => {
    expect(compareByRatio(100, 125).closeness).toBe('close')
    expect(compareByRatio(125, 100).closeness).toBe('close')
    expect(compareByRatio(100, 250).closeness).toBe('medium')
    expect(compareByRatio(100, 1000).closeness).toBe('far')
  })
})

describe('compareByDifference', () => {
  it('blízkost podle rozdílu', () => {
    expect(compareByDifference(8.6, 9.5)).toEqual({ value: 8.6, direction: 'higher', closeness: 'close' })
    expect(compareByDifference(8.6, 4)).toMatchObject({ direction: 'lower', closeness: 'medium' })
    expect(compareByDifference(8.6, 28).closeness).toBe('far')
    expect(compareByDifference(-3, -3).closeness).toBe('exact')
  })
  it('chybějící údaj dá unknown', () => {
    expect(compareByDifference(null, 10)).toEqual({ value: null, direction: 'unknown', closeness: 'unknown' })
    expect(compareByDifference(10, null)).toEqual({ value: 10, direction: 'unknown', closeness: 'unknown' })
  })
})

describe('compare', () => {
  it('správný tip má vše shodné a žádný směr', () => {
    const c = compare('CZE', 'CZE')
    expect(c.correct).toBe(true)
    expect(c.continent.match).toBe(true)
    expect(c.population.closeness).toBe('exact')
    expect(c.area.closeness).toBe('exact')
    expect(c.distanceKm).toBe(0)
    expect(c.bearing).toBeNull()
  })
  it('Česko hledané, tip Brazílie', () => {
    const c = compare('CZE', 'BRA')
    expect(c.correct).toBe(false)
    expect(c.continent).toEqual({ value: 'Jižní Amerika', match: false })
    expect(c.hemisphere).toEqual({ ns: 'J', ew: 'Z', nsMatch: false, ewMatch: false })
    expect(c.population).toMatchObject({ direction: 'lower', closeness: 'far' })
    expect(c.area).toMatchObject({ direction: 'lower', closeness: 'far' })
    expect(c.temperature).toMatchObject({ direction: 'lower', closeness: 'far' })
    expect(c.distanceKm).toBeGreaterThan(8000)
    expect(compass(c.bearing!).label).toBe('severovýchod')
  })
  it('Česko hledané, tip Rakousko je ve všem blízko', () => {
    const c = compare('CZE', 'AUT')
    expect(c.continent.match).toBe(true)
    expect(c.hemisphere.nsMatch && c.hemisphere.ewMatch).toBe(true)
    expect(c.population.closeness).toBe('close')
    expect(c.area.closeness).toBe('close')
    expect(c.temperature.closeness).toBe('close')
  })
  it('Tchaj-wan nemá teplotu', () => {
    expect(getCountry('TWN').avgTemp).toBeNull()
    expect(compare('TWN', 'JPN').temperature.closeness).toBe('unknown')
    expect(compare('JPN', 'TWN').temperature).toEqual({ value: null, direction: 'unknown', closeness: 'unknown' })
  })
})

describe('roundStatus', () => {
  it('výhra, prohra, rozehráno', () => {
    expect(roundStatus('CZE', ['DEU', 'CZE'])).toBe('won')
    expect(roundStatus('CZE', ['DEU'])).toBe('playing')
    const wrong = ['DEU', 'AUT', 'POL', 'SVK', 'HUN', 'FRA', 'ITA', 'ESP']
    expect(wrong).toHaveLength(MAX_GUESSES)
    expect(roundStatus('CZE', wrong)).toBe('lost')
    expect(roundStatus('CZE', [...wrong.slice(0, 7), 'CZE'])).toBe('won')
  })
})

describe('formátování', () => {
  it('populace', () => {
    expect(nbsp(formatPopulation(1_463_865_525))).toBe('1,46 mld.')
    expect(nbsp(formatPopulation(10_886_878))).toBe('10,9 mil.')
    expect(nbsp(formatPopulation(9_492))).toBe('9,5 tis.')
    expect(formatPopulation(825)).toBe('825')
  })
  it('rozloha a teplota', () => {
    expect(nbsp(formatArea(78871))).toBe('78 871 km²')
    expect(nbsp(formatArea(0.44))).toBe('0,4 km²')
    expect(nbsp(formatTemperature(8.6))).toBe('8,6 °C')
    expect(nbsp(formatTemperature(-4.03))).toMatch(/^[-−]4,0 °C$/)
    expect(formatTemperature(null)).toBe('údaj chybí')
  })
})

describe('sdílení', () => {
  it('řádek čtverečků a šipka', () => {
    expect(shareRow(compare('CZE', 'CZE'))).toBe('🟩🟩🟩🟩🟩🟩 🎯')
    expect(shareRow(compare('CZE', 'BRA'))).toBe('⬛⬛⬛⬛⬛⬛ ↗️')
    // šestý čtvereček je teplota (rozložení na znaky přes [...], emoji zabírají dva kódové body)
    expect([...shareRow(compare('JPN', 'TWN'))][5]).toBe('⬜')
  })
  it('celý text', () => {
    const text = buildShareText('16. 11. 2026', [compare('CZE', 'BRA'), compare('CZE', 'CZE')], true)
    expect(text.split('\n')[0]).toBe('GeoHry: Countryle (16. 11. 2026) 2/8')
    expect(text.split('\n')).toHaveLength(3)
    expect(buildShareText('volná hra', [compare('CZE', 'BRA')], false).split('\n')[0]).toBe('GeoHry: Countryle (volná hra) X/8')
  })
})

describe('pickTarget', () => {
  it('denní cíl je deterministický a liší se od Tajemné země', async () => {
    expect(pickTarget('daily', '2026-11-16')).toBe(pickTarget('daily', '2026-11-16'))
    const mystery = await import('../mystery/logic')
    const days = Array.from({ length: 30 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`)
    const same = days.filter((d) => pickTarget('daily', d) === mystery.pickTarget('daily', d)).length
    expect(same).toBeLessThan(5)
  })
})
