import { describe, expect, it } from 'vitest'
import { getCountry } from '../../shared/data'
import { formatRounded, formatUsd } from '../../shared/format'
import { seededRandom } from '../../shared/random'
import { DAILY_LENGTH, PARAMS, buildSequence, buildShareText, correctAnswer, dailyParam, finalStatus, getParam, pickSequence, valueOf } from './logic'

const nbsp = (s: string) => s.replace(/\s/g, ' ')

describe('témata', () => {
  it('je jich šest a mají jedinečná id', () => {
    expect(PARAMS.map((p) => p.id)).toEqual(['population', 'area', 'gdp', 'gdp-per-capita', 'density', 'temperature'])
  })
  it('hodnoty pro Česko dávají smysl', () => {
    const cze = getCountry('CZE')
    expect(getParam('population').value(cze)).toBeGreaterThan(10_000_000)
    expect(getParam('gdp').value(cze)).toBeGreaterThan(2e11)
    expect(getParam('gdp-per-capita').value(cze)).toBeGreaterThan(20_000)
    expect(getParam('density').value(cze)).toBeGreaterThan(100)
    expect(getParam('density').value(cze)).toBeLessThan(200)
  })
  it('chybějící údaj je null a taková země se v posloupnosti neobjeví', () => {
    expect(getParam('gdp').value(getCountry('PRK'))).toBeNull()
    expect(getParam('temperature').value(getCountry('TWN'))).toBeNull()
    const seq = buildSequence(getParam('gdp'), seededRandom(1), 100)
    expect(seq).not.toContain('PRK')
    expect(seq).not.toContain('TWN')
  })
})

describe('buildSequence', () => {
  it.each(PARAMS.map((p) => p.id))('%s: bez opakování a sousední dvojice se dost liší', (id) => {
    const param = getParam(id)
    const seq = buildSequence(param, seededRandom(42), 60)
    expect(seq).toHaveLength(61)
    expect(new Set(seq).size).toBe(seq.length)
    for (let i = 1; i < seq.length; i++) expect(param.tooClose(valueOf(param, seq[i - 1]), valueOf(param, seq[i]))).toBe(false)
  })
  it('denní posloupnost je deterministická a má 15 porovnání', () => {
    const param = getParam('area')
    const a = pickSequence('daily', param, '2026-11-16')
    expect(a).toEqual(pickSequence('daily', param, '2026-11-16'))
    expect(a).toHaveLength(DAILY_LENGTH + 1)
    expect(a).not.toEqual(pickSequence('daily', getParam('gdp'), '2026-11-16'))
  })
})

describe('odpovědi', () => {
  it('correctAnswer', () => {
    expect(correctAnswer(getParam('population'), 'CZE', 'IND')).toBe('more')
    expect(correctAnswer(getParam('population'), 'IND', 'CZE')).toBe('less')
    expect(correctAnswer(getParam('area'), 'CZE', 'RUS')).toBe('more')
    expect(correctAnswer(getParam('temperature'), 'CZE', 'CAN')).toBe('less')
    expect(correctAnswer(getParam('gdp'), 'CZE', 'USA')).toBe('more')
    expect(correctAnswer(getParam('density'), 'CZE', 'AUS')).toBe('less')
  })
  it('finalStatus', () => {
    expect(finalStatus(4)).toBe('lost')
    expect(finalStatus(5)).toBe('won')
  })
})

describe('dailyParam', () => {
  it('témata se po dnech střídají dokola', () => {
    const ids = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-01-06', '2026-01-07'].map((d) => dailyParam(d).id)
    expect(new Set(ids.slice(0, 6)).size).toBe(6)
    expect(ids[6]).toBe(ids[0])
    expect(dailyParam('2025-12-31').id).toBe(PARAMS[PARAMS.length - 1].id)
  })
})

describe('formátování a sdílení', () => {
  it('částky v USD', () => {
    expect(nbsp(formatUsd(27_360_935_000_000))).toBe('27,36 bil. USD')
    expect(nbsp(formatUsd(330_858_339_871))).toBe('330,9 mld. USD')
    expect(nbsp(formatUsd(62_280_311))).toBe('62,3 mil. USD')
  })
  it('zaokrouhlení na tři platné číslice', () => {
    expect(nbsp(formatRounded(30386, 'USD'))).toBe('30 400 USD')
    expect(nbsp(formatRounded(138.4, 'obyv./km²'))).toBe('138 obyv./km²')
    expect(nbsp(formatRounded(3.42, 'obyv./km²'))).toBe('3,4 obyv./km²')
  })
  it('text ke sdílení', () => {
    expect(buildShareText('16. 11. 2026', getParam('gdp'), 3, false)).toBe('GeoHry: Víc, nebo míň? (16. 11. 2026)\nTéma: HDP, série 3\n🟩🟩🟩🟥')
    expect(buildShareText('volná hra', getParam('area'), 2, true).split('\n')[2]).toBe('🟩🟩')
  })
})
