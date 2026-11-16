import { describe, expect, it } from 'vitest'
import { getCountry } from '../../shared/data'
import { seededRandom } from '../../shared/random'
import { CATEGORIES, GROUP_LIMIT, firstLetter, getCategory, isFlagCategory } from './categories'
import {
  MAX_GUESSES, MIN_ANSWERS, MIN_FLAG_CATEGORIES, answersFor, buildShareText, failedCategories, generateGrid, gridStatus, hasDistinctSolution, isPlayableGrid,
  isValidAnswer, pickGrid, rarity, totalRarity, validAnswers, type Grid,
} from './logic'

const grid: Grid = {
  rows: ['continent-evropa', 'flag-star', 'landlocked'],
  cols: ['flag-red', 'pop-over-50m', 'name-multiword'],
}

describe('kategorie', () => {
  it('mají jedinečná id a každá má aspoň 3 země', () => {
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(CATEGORIES.length)
    for (const category of CATEGORIES) expect(answersFor(category.id, category.id).length, category.id).toBeGreaterThanOrEqual(3)
  })
  it('velká část je o vlajkách', () => {
    expect(CATEGORIES.filter(isFlagCategory).length).toBeGreaterThanOrEqual(20)
  })
  it('známé příklady', () => {
    const cze = getCountry('CZE')
    expect(getCategory('continent-evropa').test(cze)).toBe(true)
    expect(getCategory('landlocked').test(cze)).toBe(true)
    expect(getCategory('flag-triangle').test(cze)).toBe(true)
    expect(getCategory('flag-green').test(cze)).toBe(false)
    expect(getCategory('flag-3-colors').test(cze)).toBe(true)
    expect(getCategory('borders-DEU').test(cze)).toBe(true)
    // zámořské hranice: Francie sousedí s Brazílií přes Guyanu, Nizozemsko s Francií na Svatém Martinu
    expect(getCategory('borders-BRA').test(getCountry('FRA'))).toBe(true)
    expect(getCategory('borders-FRA').test(getCountry('NLD'))).toBe(true)
    expect(getCategory('borders-FRA').test(getCountry('CZE'))).toBe(false)
    expect(getCategory('flag-crescent').test(getCountry('TUR'))).toBe(true)
    expect(getCategory('flag-horizontal').test(getCountry('DEU'))).toBe(true)
    expect(getCategory('flag-vertical').test(getCountry('FRA'))).toBe(true)
    expect(getCategory('island').test(getCountry('JPN'))).toBe(true)
    expect(getCategory('pop-over-100m').test(getCountry('IND'))).toBe(true)
  })
  it('firstLetter bere Ch jako samostatné písmeno a rozlišuje háčky', () => {
    expect(firstLetter('Chile')).toBe('CH')
    expect(firstLetter('Čína')).toBe('Č')
    expect(firstLetter('Česko')).toBe('Č')
    expect(firstLetter('Kanada')).toBe('K')
    expect(firstLetter('Írán')).toBe('I')
    expect(firstLetter('Švédsko')).toBe('Š')
    expect(firstLetter('Ázerbájdžán')).toBe('A')
  })
})

describe('odpovědi', () => {
  it('validAnswers je průnik obou kategorií', () => {
    const answers = validAnswers(grid, 0) // Evropa × vlajka s červenou
    expect(answers).toContain('CZE')
    expect(answers).not.toContain('SWE')
    expect(answers).not.toContain('JPN')
  })
  it('isValidAnswer a failedCategories', () => {
    expect(isValidAnswer(grid, 0, 'CZE')).toBe(true)
    expect(isValidAnswer(grid, 0, 'SWE')).toBe(false)
    expect(failedCategories(grid, 0, 'SWE').map((c) => c.id)).toEqual(['flag-red'])
    expect(failedCategories(grid, 0, 'BRA').map((c) => c.id)).toEqual(['continent-evropa', 'flag-red'])
    expect(failedCategories(grid, 0, 'CZE')).toEqual([])
  })
  it('políčka se číslují po řádcích', () => {
    // políčko 5 = řádek 1 (hvězda) × sloupec 2 (víc slov)
    expect(validAnswers(grid, 5)).toContain('USA')
    expect(validAnswers(grid, 5)).not.toContain('CZE')
  })
})

describe('generateGrid', () => {
  it('vytvoří hratelné mřížky pro mnoho různých semínek', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const g = generateGrid(seededRandom(seed))
      expect(isPlayableGrid(g), JSON.stringify(g)).toBe(true)
      for (let cell = 0; cell < 9; cell++) expect(validAnswers(g, cell).length).toBeGreaterThanOrEqual(MIN_ANSWERS)
      const all = [...g.rows, ...g.cols].map(getCategory)
      expect(all.filter(isFlagCategory).length).toBeGreaterThanOrEqual(MIN_FLAG_CATEGORIES)
      const groups = new Map<string, number>()
      for (const c of all) groups.set(c.group, (groups.get(c.group) ?? 0) + 1)
      for (const [group, n] of groups) expect(n).toBeLessThanOrEqual(GROUP_LIMIT[group] ?? 1)
      expect(hasDistinctSolution(g)).toBe(true)
    }
  })
  it('je deterministický pro stejné semínko', () => {
    expect(generateGrid(seededRandom(7))).toEqual(generateGrid(seededRandom(7)))
  })
  it('denní mřížka je pro stejný den stejná a jiný den jiná', () => {
    expect(pickGrid('daily', '2026-11-16')).toEqual(pickGrid('daily', '2026-11-16'))
    expect(pickGrid('daily', '2026-11-16')).not.toEqual(pickGrid('daily', '2026-11-17'))
  })
  it('používá pestrou nabídku kategorií', () => {
    const used = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const g = generateGrid(seededRandom(seed))
      for (const id of [...g.rows, ...g.cols]) used.add(id)
    }
    expect(used.size).toBeGreaterThan(CATEGORIES.length * 0.6)
  })
})

describe('isPlayableGrid', () => {
  it('odmítne mřížku s prázdným políčkem', () => {
    expect(isPlayableGrid({ rows: ['continent-evropa', 'flag-star', 'landlocked'], cols: ['continent-asie', 'flag-red', 'name-multiword'] })).toBe(false)
  })
  it('odmítne opakovanou kategorii a neznámou kategorii', () => {
    expect(isPlayableGrid({ rows: ['flag-red', 'flag-star', 'landlocked'], cols: ['flag-red', 'pop-over-50m', 'name-multiword'] })).toBe(false)
    expect(isPlayableGrid({ rows: ['nesmysl', 'flag-star', 'landlocked'], cols: ['flag-red', 'pop-over-50m', 'name-multiword'] })).toBe(false)
  })
})

describe('vzácnost a stav', () => {
  it('nejlidnatější odpověď má vzácnost 0, nejmenší 100', () => {
    const answers = validAnswers(grid, 0).sort((a, b) => getCountry(b).population - getCountry(a).population)
    expect(rarity(grid, 0, answers[0])).toBe(0)
    expect(rarity(grid, 0, answers[answers.length - 1])).toBe(100)
    expect(rarity(grid, 0, 'JPN')).toBe(0) // neplatná odpověď
  })
  it('totalRarity je průměr přes 9 políček', () => {
    const answers = validAnswers(grid, 0).sort((a, b) => getCountry(b).population - getCountry(a).population)
    const cells = [answers[answers.length - 1], null, null, null, null, null, null, null, null]
    expect(totalRarity(grid, cells)).toBe(Math.round(100 / 9))
  })
  it('gridStatus', () => {
    const empty = Array<string | null>(9).fill(null)
    expect(gridStatus(empty, 0)).toBe('playing')
    expect(gridStatus(empty, MAX_GUESSES)).toBe('lost')
    expect(gridStatus(Array<string | null>(9).fill('CZE'), 9)).toBe('won')
    expect(gridStatus(Array<string | null>(9).fill('CZE'), MAX_GUESSES)).toBe('won')
  })
  it('text ke sdílení', () => {
    const cells = ['CZE', null, null, null, 'USA', null, null, null, null]
    const lines = buildShareText('16. 11. 2026', grid, cells, 5).split('\n')
    expect(lines[0]).toBe('GeoHry: GeoGrid (16. 11. 2026)')
    expect(lines[1]).toMatch(/^2\/9 políček, 5\/12 tipů, vzácnost \d+$/)
    expect(lines.slice(2)).toEqual(['🟩⬜⬜', '⬜🟩⬜', '⬜⬜⬜'])
  })
})
