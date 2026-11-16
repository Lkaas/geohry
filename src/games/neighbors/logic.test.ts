import { describe, expect, it } from 'vitest'
import { getCountry } from '../../shared/data'
import { allNeighbors } from '../../shared/data'
import { MAX_MISTAKES, TARGET_IDS, buildShareText, evaluate, isOverseasBorder, neighborsOf, pickTarget } from './logic'

describe('evaluate', () => {
  it('Česko má čtyři sousedy', () => {
    expect([...getCountry('CZE').neighbors].sort()).toEqual(['AUT', 'DEU', 'POL', 'SVK'])
  })
  it('rozdělí tipy na správné a špatné a pozná, co chybí', () => {
    const p = evaluate('CZE', ['DEU', 'HUN', 'POL'])
    expect(p.found).toEqual(['DEU', 'POL'])
    expect(p.mistakes).toEqual(['HUN'])
    expect([...p.missing].sort()).toEqual(['AUT', 'SVK'])
    expect(p.status).toBe('playing')
  })
  it('výhra po nalezení všech, i s chybami', () => {
    expect(evaluate('CZE', ['DEU', 'HUN', 'POL', 'CHE', 'AUT', 'SVK']).status).toBe('won')
  })
  it('prohra po třetí chybě', () => {
    expect(evaluate('CZE', ['HUN', 'CHE']).status).toBe('playing')
    expect(evaluate('CZE', ['HUN', 'CHE', 'FRA']).status).toBe('lost')
    expect(MAX_MISTAKES).toBe(3)
  })
  it('poslední soused vyhraje, i kdyby už byly dvě chyby', () => {
    expect(evaluate('CZE', ['HUN', 'CHE', 'DEU', 'POL', 'AUT', 'SVK']).status).toBe('won')
  })
})

describe('zámořské hranice', () => {
  it('Francie sousedí s Nizozemskem na Svatém Martinu a s Brazílií a Surinamem přes Guyanu', () => {
    expect(neighborsOf('FRA')).toEqual(expect.arrayContaining(['NLD', 'BRA', 'SUR', 'DEU', 'ESP']))
    expect(neighborsOf('FRA')).toHaveLength(11)
    expect([...neighborsOf('NLD')].sort()).toEqual(['BEL', 'DEU', 'FRA'])
    expect(neighborsOf('BRA')).toContain('FRA')
    expect(neighborsOf('SUR')).toContain('FRA')
  })
  it('rozliší zámořskou hranici od běžné', () => {
    expect(isOverseasBorder('FRA', 'NLD')).toBe(true)
    expect(isOverseasBorder('NLD', 'FRA')).toBe(true)
    expect(isOverseasBorder('FRA', 'DEU')).toBe(false)
  })
  it('Nizozemsko se uzná jako soused Francie a je potřeba k výhře', () => {
    const land = getCountry('FRA').neighbors
    expect(evaluate('FRA', land).status).toBe('playing')
    expect(evaluate('FRA', land).missing.sort()).toEqual(['BRA', 'NLD', 'SUR'])
    expect(evaluate('FRA', [...land, 'NLD', 'BRA', 'SUR']).status).toBe('won')
  })
  it('běžný seznam sousedů (cesty, vzdálenosti) zámořské hranice neobsahuje', () => {
    expect(getCountry('FRA').neighbors).not.toContain('NLD')
    expect(getCountry('FRA').neighbors).not.toContain('BRA')
  })
})

describe('výběr země', () => {
  it('cíle mají aspoň dva sousedy', () => {
    expect(TARGET_IDS.length).toBeGreaterThan(120)
    for (const id of TARGET_IDS) expect(allNeighbors(getCountry(id)).length).toBeGreaterThanOrEqual(2)
    expect(TARGET_IDS).not.toContain('JPN')
    expect(TARGET_IDS).not.toContain('PRT') // jediný soused
  })
  it('denní cíl je deterministický', () => {
    expect(pickTarget('daily', '2026-11-16')).toBe(pickTarget('daily', '2026-11-16'))
  })
})

describe('sdílení', () => {
  it('text', () => {
    expect(buildShareText('16. 11. 2026', 'CZE', ['DEU', 'HUN', 'POL'])).toBe('GeoHry: Sousedé (16. 11. 2026)\n2/4 sousedů, chyby: 1\n🟩🟥🟩')
  })
})
