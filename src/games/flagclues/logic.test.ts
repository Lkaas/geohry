import { describe, expect, it } from 'vitest'
import { COUNTRIES, getCountry } from '../../shared/data'
import { MAX_FLAG_CLUES, buildShareText, candidateClues, dominantColor, matchingCountries, pickTarget, roundStatus, roundedShare, selectClues, visibleClueCount } from './logic'

describe('candidateClues', () => {
  it('všechny nápovědy o vlajce pro danou zemi platí', () => {
    for (const country of COUNTRIES) for (const clue of candidateClues(country)) expect(clue.test(country), `${country.id} ${clue.id}`).toBe(true)
  })
  it('Turecko: dvě barvy, půlměsíc, hvězda, skoro celá červená', () => {
    const texts = candidateClues(getCountry('TUR')).map((c) => c.text)
    expect(texts).toContain('Vlajka má dvě barvy.')
    expect(texts).toContain('Je na ní půlměsíc.')
    expect(texts).toContain('Je na ní hvězda.')
    expect(texts).toContain('Červená zabírá asi 95 % plochy.')
    expect(texts).toContain('Bílá zabírá asi 5 % plochy.')
    expect(texts).toContain('Není na ní modrá barva.')
    expect(texts).toContain('Nejvíc plochy zabírá červená.')
  })
  it('Německo: jen vodorovné pruhy a žádný symbol', () => {
    const ids = candidateClues(getCountry('DEU')).map((c) => c.id)
    expect(ids).toContain('horizontal')
    expect(ids).toContain('no-symbol')
    expect(ids).not.toContain('star')
  })
  it('pomocné funkce', () => {
    expect(dominantColor(getCountry('TUR'))).toBe('red')
    expect(dominantColor(getCountry('BRA'))).toBe('green')
    // stejně široké pruhy: žádná barva nepřevládá
    expect(dominantColor(getCountry('DEU'))).toBeNull()
    expect(dominantColor(getCountry('FRA'))).toBeNull()
    expect(dominantColor(getCountry('TCD'))).toBeNull()
    expect([1, 7, 12, 93, 98].map(roundedShare)).toEqual([5, 5, 10, 95, 100])
  })
})

describe('selectClues', () => {
  it('každá další nápověda zužuje výběr a hledaná země vždy vyhovuje', () => {
    for (const country of COUNTRIES) {
      const clues = selectClues(country.id)
      expect(clues.length, country.id).toBeGreaterThanOrEqual(3)
      expect(clues.length).toBeLessThanOrEqual(MAX_FLAG_CLUES + 2)
      expect(clues.map((c) => c.id)).toContain('continent')
      expect(new Set(clues.map((c) => c.id)).size).toBe(clues.length)
      let previous = COUNTRIES.length
      // nápovědy o vlajce (ty před kontinentem) musí pokaždé něco vyřadit
      for (let i = 1; i <= clues.findIndex((c) => c.id === 'continent'); i++) {
        const size = matchingCountries(clues.slice(0, i)).length
        expect(size, `${country.id} krok ${i}`).toBeLessThan(previous)
        previous = size
      }
      expect(matchingCountries(clues)).toContain(country.id)
    }
  })
  it('první nápověda je mlhavá, na konci zbývá jen pár vlajek', () => {
    let firstTotal = 0
    let lastTotal = 0
    for (const country of COUNTRIES) {
      const clues = selectClues(country.id)
      firstTotal += matchingCountries(clues.slice(0, 1)).length
      lastTotal += matchingCountries(clues).length
    }
    expect(firstTotal / COUNTRIES.length).toBeGreaterThan(60)
    expect(lastTotal / COUNTRIES.length).toBeLessThan(1.1)
  })
  it('je deterministický', () => {
    expect(selectClues('TUR').map((c) => c.id)).toEqual(selectClues('TUR').map((c) => c.id))
  })
})

describe('průběh hry', () => {
  it('roundStatus a počet viditelných nápověd', () => {
    expect(roundStatus('TUR', [], 7)).toBe('playing')
    expect(roundStatus('TUR', ['TUN', null, 'TUR'], 7)).toBe('won')
    expect(roundStatus('TUR', ['TUN', null, 'CHN', 'MAR', 'VNM', 'ALB', 'CHE'], 7)).toBe('lost')
    expect(roundStatus('TUR', ['TUN', null, 'CHN', 'MAR', 'VNM', 'ALB', 'TUR'], 7)).toBe('won')
    expect(visibleClueCount([], 7)).toBe(1)
    expect(visibleClueCount(['TUN', null], 7)).toBe(3)
    expect(visibleClueCount(Array(9).fill(null), 7)).toBe(7)
  })
  it('text ke sdílení', () => {
    expect(buildShareText('16. 11. 2026', 'TUR', ['TUN', null, 'TUR'], 7)).toBe('GeoHry: Tajemná vlajka (16. 11. 2026) 3/7\n🟥⬜🟩')
    expect(buildShareText('volná hra', 'TUR', ['TUN'], 7).split('\n')[0]).toBe('GeoHry: Tajemná vlajka (volná hra) X/7')
  })
  it('denní cíl je deterministický', () => {
    expect(pickTarget('daily', '2026-11-16')).toBe(pickTarget('daily', '2026-11-16'))
  })
})
