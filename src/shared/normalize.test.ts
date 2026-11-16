import { describe, expect, it } from 'vitest'
import { findCountryExact, normalize, searchCountries } from './normalize'

describe('normalize', () => {
  it('odstraní diakritiku, velká písmena a interpunkci', () => {
    expect(normalize('Česko')).toBe('cesko')
    expect(normalize('  Guinea-Bissau ')).toBe('guinea bissau')
    expect(normalize("Côte d'Ivoire")).toBe('cote d ivoire')
    expect(normalize('ŠALAMOUNOVY OSTROVY')).toBe('salamounovy ostrovy')
  })
})

describe('searchCountries', () => {
  const ids = (q: string, exclude?: string[]) => searchCountries(q, { exclude: new Set(exclude) }).map((h) => h.country.id)

  it('najde zemi bez diakritiky', () => {
    expect(ids('cesko')[0]).toBe('CZE')
    expect(ids('svedsko')[0]).toBe('SWE')
  })

  it('zná alternativní názvy', () => {
    expect(ids('usa')[0]).toBe('USA')
    expect(ids('holandsko')[0]).toBe('NLD')
    expect(ids('ceska republika')[0]).toBe('CZE')
    expect(ids('barma')[0]).toBe('MMR')
  })

  it('vrací název aliasu, na který dotaz seděl', () => {
    expect(searchCountries('holan')[0].matched).toBe('Holandsko')
    expect(searchCountries('nizo')[0].matched).toBe('Nizozemsko')
  })

  it('řadí začátek názvu před výskyt uvnitř', () => {
    const result = ids('ni')
    expect(result.indexOf('NER')).toBeLessThan(result.indexOf('BEN') === -1 ? Infinity : result.indexOf('BEN'))
    expect(result.slice(0, 4)).toEqual(expect.arrayContaining(['NER', 'NGA', 'NIC', 'NLD']))
  })

  it('najde zemi podle druhého slova názvu', () => {
    expect(ids('korea')).toEqual(expect.arrayContaining(['KOR', 'PRK']))
    expect(ids('guinea')).toEqual(expect.arrayContaining(['GIN', 'GNB', 'GNQ', 'PNG']))
  })

  it('nenabízí vyloučené země', () => {
    expect(ids('cesko', ['CZE'])).not.toContain('CZE')
  })

  it('na prázdný dotaz nevrací nic', () => {
    expect(searchCountries('   ')).toEqual([])
  })
})

describe('findCountryExact', () => {
  it('najde přesný název i alias', () => {
    expect(findCountryExact('ČESKO')?.id).toBe('CZE')
    expect(findCountryExact('jar')?.id).toBe('ZAF')
    expect(findCountryExact('ces')).toBeUndefined()
  })
})
