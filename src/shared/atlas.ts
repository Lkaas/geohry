// Výběr a řazení zemí pro Atlas.
import { COUNTRIES } from './data'
import { searchCountries } from './normalize'
import type { Continent, Country, FlagColor } from './types'

export type SortKey = 'name' | 'population' | 'area' | 'density'
export type SymbolKey = 'star' | 'sun' | 'crescent' | 'cross' | 'animal' | 'text'

export interface AtlasFilter {
  text: string
  continent: Continent | null
  /** Vlajka musí mít všechny vybrané barvy. */
  colors: readonly FlagColor[]
  /** Vlajka musí mít všechny vybrané symboly. */
  symbols: readonly SymbolKey[]
}

export const EMPTY_FILTER: AtlasFilter = { text: '', continent: null, colors: [], symbols: [] }

export const CONTINENTS: Continent[] = ['Evropa', 'Asie', 'Afrika', 'Severní Amerika', 'Jižní Amerika', 'Austrálie a Oceánie']

export const COLOR_LABELS: Record<FlagColor, string> = {
  red: 'červená',
  white: 'bílá',
  blue: 'modrá',
  green: 'zelená',
  yellow: 'žlutá',
  black: 'černá',
  orange: 'oranžová',
}

export const SYMBOL_LABELS: Record<SymbolKey, string> = {
  star: 'hvězda',
  sun: 'slunce',
  crescent: 'půlměsíc',
  cross: 'kříž',
  animal: 'zvíře',
  text: 'nápis',
}

export const SORT_LABELS: Record<SortKey, string> = {
  name: 'Názvu',
  population: 'Počtu obyvatel',
  area: 'Rozlohy',
  density: 'Hustoty zalidnění',
}

/** Obyvatel na km². */
export function density(country: Country): number {
  return country.population / country.area
}

export function isFiltered(filter: AtlasFilter): boolean {
  return filter.text.trim() !== '' || filter.continent !== null || filter.colors.length > 0 || filter.symbols.length > 0
}

export function filterCountries(filter: AtlasFilter): Country[] {
  let list: readonly Country[] = COUNTRIES
  if (filter.text.trim()) {
    const ids = new Set(searchCountries(filter.text).map((h) => h.country.id))
    list = list.filter((c) => ids.has(c.id))
  }
  return list.filter(
    (c) =>
      (filter.continent === null || c.continent === filter.continent) &&
      filter.colors.every((color) => c.flag.colors.includes(color)) &&
      filter.symbols.every((symbol) => c.flag[symbol]),
  )
}

const collator = new Intl.Collator('cs')

/** Seřadí kopii seznamu. U čísel je výchozí směr od největšího, u názvu podle abecedy. */
export function sortCountries(list: readonly Country[], key: SortKey, reverse = false): Country[] {
  const out = [...list]
  const value = (c: Country) => (key === 'population' ? c.population : key === 'area' ? c.area : density(c))
  if (key === 'name') out.sort((a, b) => collator.compare(a.name, b.name))
  else out.sort((a, b) => value(b) - value(a) || collator.compare(a.name, b.name))
  return reverse ? out.reverse() : out
}
