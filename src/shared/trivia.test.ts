// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { COUNTRIES, getCountry, hasCountry } from './data'
import { COUNTRY_TRIVIA, DOMAIN_NOTES, countryForDomain, parseDomain, takeTrivia } from './trivia'

beforeEach(() => localStorage.clear())

describe('perličky o zemích', () => {
  it('každá patří existující zemi a má text', () => {
    for (const [id, note] of Object.entries(COUNTRY_TRIVIA)) {
      expect(hasCountry(id), id).toBe(true)
      expect(note.title.length).toBeGreaterThan(0)
      expect(note.lines.length).toBeGreaterThan(0)
    }
  })

  it('ukáže se jen jednou', () => {
    expect(takeTrivia('NPL')?.title).toBe('Nepál')
    expect(takeTrivia('NPL')).toBeNull()
    expect(takeTrivia('CZE')).toBeNull()
  })

  it('dvojnásobně vnitrozemské jsou podle dat právě Lichtenštejnsko a Uzbekistán', () => {
    const double = COUNTRIES.filter((c) => c.landlocked && c.neighbors.length > 0 && c.neighbors.every((n) => getCountry(n).landlocked)).map((c) => c.id)
    expect(double.sort()).toEqual(['LIE', 'UZB'])
  })

  it('Čad a Rumunsko mají stejné barvy, Irsko a Pobřeží slonoviny také', () => {
    expect([...getCountry('TCD').flag.colors].sort()).toEqual([...getCountry('ROU').flag.colors].sort())
    expect([...getCountry('IRL').flag.colors].sort()).toEqual([...getCountry('CIV').flag.colors].sort())
  })

  it('Vatikán je podle dat nejmenší stát', () => {
    const smallest = [...COUNTRIES].sort((a, b) => a.area - b.area)[0]
    expect(smallest.id).toBe('VAT')
  })
})

describe('domény', () => {
  it('rozpozná tečku a dvě písmena', () => {
    expect(parseDomain('.tv')).toBe('tv')
    expect(parseDomain('  .FM ')).toBe('fm')
    expect(parseDomain('tv')).toBeNull()
    expect(parseDomain('.com')).toBeNull()
    expect(parseDomain('.c')).toBeNull()
  })

  it('najde zemi podle domény', () => {
    expect(countryForDomain('tv')?.id).toBe('TUV')
    expect(countryForDomain('fm')?.id).toBe('FSM')
    expect(countryForDomain('cz')?.id).toBe('CZE')
    expect(countryForDomain('uk')?.id).toBe('GBR')
    expect(countryForDomain('ai')).toBeUndefined()
    expect(countryForDomain('su')).toBeUndefined()
  })

  it('poznámky mají text', () => {
    for (const note of Object.values(DOMAIN_NOTES)) expect(note.lines.length).toBeGreaterThan(0)
  })
})
