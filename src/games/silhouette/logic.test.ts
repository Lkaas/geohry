import { describe, expect, it } from 'vitest'
import { compass } from '../../shared/geo'
import { MAX_GUESSES, TARGET_IDS, buildShareText, evaluateGuess, pickTarget, roundStatus, shareRow } from './logic'

describe('evaluateGuess', () => {
  it('správný tip', () => {
    expect(evaluateGuess('CZE', 'CZE')).toEqual({ id: 'CZE', correct: true, km: 0, bearing: null, proximity: 100 })
  })
  it('blízká země má vysokou blízkost, vzdálená nízkou', () => {
    const near = evaluateGuess('CZE', 'AUT')
    const far = evaluateGuess('CZE', 'NZL')
    expect(near.proximity).toBeGreaterThan(95)
    expect(near.proximity).toBeLessThan(100)
    expect(far.proximity).toBeLessThan(15)
    expect(far.km).toBeGreaterThan(17000)
  })
  it('směr vede od tipu k hledané zemi', () => {
    expect(compass(evaluateGuess('CZE', 'ESP').bearing!).label).toBe('severovýchod')
    expect(compass(evaluateGuess('CZE', 'SWE').bearing!).label).toBe('jih')
  })
})

describe('roundStatus', () => {
  it('výhra, prohra, rozehráno', () => {
    expect(roundStatus('CZE', ['AUT'])).toBe('playing')
    expect(roundStatus('CZE', ['AUT', 'CZE'])).toBe('won')
    expect(roundStatus('CZE', ['AUT', 'DEU', 'POL', 'SVK', 'HUN', 'FRA'])).toBe('lost')
    expect(MAX_GUESSES).toBe(6)
  })
})

describe('výběr a sdílení', () => {
  it('cíle neobsahují ministáty', () => {
    expect(TARGET_IDS).toContain('CZE')
    expect(TARGET_IDS).toContain('IDN')
    expect(TARGET_IDS).not.toContain('VAT')
    expect(TARGET_IDS).not.toContain('TUV')
  })
  it('denní cíl je deterministický', () => {
    expect(pickTarget('daily', '2026-11-16')).toBe(pickTarget('daily', '2026-11-16'))
  })
  it('řádky ke sdílení', () => {
    expect(shareRow(evaluateGuess('CZE', 'CZE'))).toBe('🟩🟩🟩🟩🟩 🎯')
    // Nový Zéland je od Česka přes 17 000 km: nejvýš půl čtverečku
    expect([...shareRow(evaluateGuess('CZE', 'NZL'))].slice(0, 5).join('')).toMatch(/^(🟨|⬛)⬛⬛⬛⬛$/u)
    expect([...shareRow(evaluateGuess('CZE', 'AUT'))].slice(0, 5).join('')).toBe('🟩🟩🟩🟩🟨')
    const text = buildShareText('16. 11. 2026', [evaluateGuess('CZE', 'AUT'), evaluateGuess('CZE', 'CZE')], true)
    expect(text.split('\n')[0]).toBe('GeoHry: Silueta (16. 11. 2026) 2/6')
    expect(buildShareText('volná hra', [evaluateGuess('CZE', 'AUT')], false).split('\n')[0]).toBe('GeoHry: Silueta (volná hra) X/6')
  })
})
