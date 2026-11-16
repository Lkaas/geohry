// Herní logika hry GeoGrid: generátor mřížky 3×3, kontrola odpovědí, vzácnost. Čisté funkce bez závislosti na UI.
import { COUNTRIES, getCountry } from '../../shared/data'
import { dailyRandom, shuffled } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'
import { CATEGORIES, GROUP_LIMIT, getCategory, hasCategory, isFlagCategory, type Category } from './categories'

export const GAME_ID = 'geogrid'
export const SIZE = 3
/** Hráč má 12 tipů na 9 políček (počítají se správné i špatné). */
export const MAX_GUESSES = 12
/** Každé políčko musí mít aspoň tolik správných odpovědí. */
export const MIN_ANSWERS = 3
/** V každé mřížce jsou aspoň dvě kategorie o vlajkách. */
export const MIN_FLAG_CATEGORIES = 2

/** Mřížka = identifikátory kategorií řádků a sloupců. Políčka se číslují 0–8 po řádcích. */
export interface Grid {
  rows: string[]
  cols: string[]
}

// země splňující každou kategorii (spočítáno jednou)
const MEMBERS = new Map(CATEGORIES.map((category) => [category.id, COUNTRIES.filter(category.test).map((c) => c.id)]))
const MEMBER_SETS = new Map([...MEMBERS].map(([id, list]) => [id, new Set(list)]))

/** Země, které splňují obě kategorie. */
export function answersFor(rowId: string, colId: string): string[] {
  const colSet = MEMBER_SETS.get(colId)!
  return MEMBERS.get(rowId)!.filter((id) => colSet.has(id))
}

export const rowOf = (cell: number) => Math.floor(cell / SIZE)
export const colOf = (cell: number) => cell % SIZE

/** Všechny správné odpovědi pro políčko. */
export function validAnswers(grid: Grid, cell: number): string[] {
  return answersFor(grid.rows[rowOf(cell)], grid.cols[colOf(cell)])
}

export function isValidAnswer(grid: Grid, cell: number, countryId: string): boolean {
  return validAnswers(grid, cell).includes(countryId)
}

/** Které z obou podmínek políčka země nesplňuje (pro vysvětlení špatného tipu). */
export function failedCategories(grid: Grid, cell: number, countryId: string): Category[] {
  const country = getCountry(countryId)
  return [getCategory(grid.rows[rowOf(cell)]), getCategory(grid.cols[colOf(cell)])].filter((category) => !category.test(country))
}

/** Dá se každému políčku přiřadit jiná země? (zpětné prohledávání, políčka s nejméně možnostmi napřed) */
export function hasDistinctSolution(grid: Grid): boolean {
  const options = Array.from({ length: SIZE * SIZE }, (_, cell) => validAnswers(grid, cell)).sort((a, b) => a.length - b.length)
  const used = new Set<string>()
  const assign = (i: number): boolean => {
    if (i === options.length) return true
    for (const id of options[i]) {
      if (used.has(id)) continue
      used.add(id)
      if (assign(i + 1)) return true
      used.delete(id)
    }
    return false
  }
  return assign(0)
}

/** Splňuje mřížka všechna pravidla? */
export function isPlayableGrid(grid: Grid): boolean {
  const ids = [...grid.rows, ...grid.cols]
  if (grid.rows.length !== SIZE || grid.cols.length !== SIZE || new Set(ids).size !== ids.length || !ids.every(hasCategory)) return false
  const groupCounts = new Map<string, number>()
  for (const id of ids) {
    const group = getCategory(id).group
    groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1)
    if (groupCounts.get(group)! > (GROUP_LIMIT[group] ?? 1)) return false
  }
  if (ids.filter((id) => isFlagCategory(getCategory(id))).length < MIN_FLAG_CATEGORIES) return false
  for (let cell = 0; cell < SIZE * SIZE; cell++) if (validAnswers(grid, cell).length < MIN_ANSWERS) return false
  return hasDistinctSolution(grid)
}

/**
 * Vygeneruje hratelnou mřížku. Postup: náhodně tři řádky, k nim se hledají sloupce,
 * které s každým řádkem dají aspoň MIN_ANSWERS odpovědí. Když to nevyjde, zkusí se jiné řádky.
 */
export function generateGrid(random: () => number = Math.random): Grid {
  const withinLimit = (chosen: Category[], next: Category) =>
    chosen.filter((c) => c.group === next.group).length < (GROUP_LIMIT[next.group] ?? 1)

  for (let attempt = 0; attempt < 5000; attempt++) {
    const pool = shuffled(CATEGORIES, random)
    const rows: Category[] = []
    for (const category of pool) {
      if (rows.length < SIZE && withinLimit(rows, category)) rows.push(category)
    }
    const cols: Category[] = []
    for (const category of pool) {
      if (cols.length === SIZE) break
      if (rows.includes(category) || !withinLimit([...rows, ...cols], category)) continue
      if (rows.every((row) => answersFor(row.id, category.id).length >= MIN_ANSWERS)) cols.push(category)
    }
    if (cols.length < SIZE) continue
    const grid = { rows: rows.map((c) => c.id), cols: cols.map((c) => c.id) }
    if (isPlayableGrid(grid)) return grid
  }
  throw new Error('Nepodařilo se vygenerovat mřížku')
}

export function pickGrid(mode: GameMode, dateKey: string, random: () => number = Math.random): Grid {
  return generateGrid(mode === 'daily' ? dailyRandom(GAME_ID, dateKey) : random)
}

/**
 * Vzácnost odpovědi 0–100. Skutečná data o tom, co hráči odpovídají, nemáme, proto náhradní měřítko:
 * správné odpovědi políčka se seřadí podle počtu obyvatel a nejlidnatější země dostane 0, nejmenší 100.
 * Malé, méně známé země jsou tedy "vzácnější" odpověď než velké.
 */
export function rarity(grid: Grid, cell: number, countryId: string): number {
  const ranked = validAnswers(grid, cell).sort((a, b) => getCountry(b).population - getCountry(a).population)
  const index = ranked.indexOf(countryId)
  if (index < 0) return 0
  return ranked.length === 1 ? 100 : Math.round((index / (ranked.length - 1)) * 100)
}

/** Stav hry: vyplněná políčka (kód země nebo null) a počet použitých tipů. */
export function gridStatus(cells: readonly (string | null)[], guessesUsed: number): DailyStatus {
  if (cells.every((c) => c !== null)) return 'won'
  return guessesUsed >= MAX_GUESSES ? 'lost' : 'playing'
}

export const filledCount = (cells: readonly (string | null)[]) => cells.filter((c) => c !== null).length

/** Průměrná vzácnost přes všech 9 políček (nevyplněné se počítá jako 0). */
export function totalRarity(grid: Grid, cells: readonly (string | null)[]): number {
  const sum = cells.reduce((acc, id, cell) => acc + (id ? rarity(grid, cell, id) : 0), 0)
  return Math.round(sum / cells.length)
}

export function buildShareText(label: string, grid: Grid, cells: readonly (string | null)[], guessesUsed: number): string {
  const rows = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (cells[r * SIZE + c] ? '🟩' : '⬜')).join(''))
  return [`GeoHry: GeoGrid (${label})`, `${filledCount(cells)}/9 políček, ${guessesUsed}/${MAX_GUESSES} tipů, vzácnost ${totalRarity(grid, cells)}`, ...rows].join('\n')
}
