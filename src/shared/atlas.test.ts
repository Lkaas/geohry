import { describe, expect, it } from 'vitest'
import { COUNTRIES, getCountry } from './data'
import { EMPTY_FILTER, density, filterCountries, isFiltered, sortCountries } from './atlas'

describe('filterCountries', () => {
  it('bez filtru vrátí všechny země', () => {
    expect(filterCountries(EMPTY_FILTER)).toHaveLength(COUNTRIES.length)
    expect(isFiltered(EMPTY_FILTER)).toBe(false)
  })

  it('text hledá i bez diakritiky', () => {
    const ids = filterCountries({ ...EMPTY_FILTER, text: 'cesko' }).map((c) => c.id)
    expect(ids).toContain('CZE')
  })

  it('kontinent nechá jen země toho kontinentu', () => {
    const list = filterCountries({ ...EMPTY_FILTER, continent: 'Evropa' })
    expect(list.length).toBeGreaterThan(30)
    expect(list.every((c) => c.continent === 'Evropa')).toBe(true)
  })

  it('víc barev znamená, že vlajka musí mít všechny', () => {
    const list = filterCountries({ ...EMPTY_FILTER, colors: ['green', 'orange'] })
    expect(list.map((c) => c.id)).toContain('IRL')
    expect(list.every((c) => c.flag.colors.includes('green') && c.flag.colors.includes('orange'))).toBe(true)
  })

  it('symbol a kontinent se kombinují', () => {
    const list = filterCountries({ ...EMPTY_FILTER, continent: 'Asie', symbols: ['crescent'] })
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((c) => c.continent === 'Asie' && c.flag.crescent)).toBe(true)
  })

  it('nesplnitelná kombinace vrátí prázdný seznam', () => {
    expect(filterCountries({ ...EMPTY_FILTER, text: 'xyzxyz' })).toEqual([])
  })
})

describe('sortCountries', () => {
  it('podle názvu česky: Chile je za Hondurasem a před Indií, Česko za Čadem a před Dánskem', () => {
    const names = sortCountries(COUNTRIES, 'name').map((c) => c.name)
    const at = (name: string) => names.indexOf(name)
    expect([at('Honduras'), at('Chile'), at('Indie')].every((i) => i >= 0)).toBe(true)
    expect(at('Chile')).toBeGreaterThan(at('Honduras'))
    expect(at('Chile')).toBeLessThan(at('Indie'))
    expect(at('Česko')).toBeGreaterThan(at('Čad') - 1)
    expect(at('Česko')).toBeLessThan(at('Dánsko'))
  })

  it('podle obyvatel od největšího, zpětně od nejmenšího', () => {
    const desc = sortCountries(COUNTRIES, 'population')
    expect(desc[0].population).toBeGreaterThanOrEqual(desc[1].population)
    expect(sortCountries(COUNTRIES, 'population', true)[0].id).toBe(desc[desc.length - 1].id)
  })

  it('podle rozlohy je první Rusko a poslední Vatikán', () => {
    const list = sortCountries(COUNTRIES, 'area')
    expect(list[0].id).toBe('RUS')
    expect(list[list.length - 1].id).toBe('VAT')
  })

  it('hustota je počet obyvatel na km²', () => {
    const mco = getCountry('MCO')
    expect(density(mco)).toBeCloseTo(mco.population / mco.area)
    expect(sortCountries(COUNTRIES, 'density')[0].id).toBe('MCO')
  })

  it('původní pole nemění', () => {
    const before = COUNTRIES.map((c) => c.id).join()
    sortCountries(COUNTRIES, 'population')
    expect(COUNTRIES.map((c) => c.id).join()).toBe(before)
  })
})
