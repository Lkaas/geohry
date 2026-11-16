// Kategorie pro GeoGrid. Každá kategorie je jen název + podmínka nad zemí,
// takže nová kategorie = jeden nový záznam v poli CATEGORIES (id po vydání už neměň, ukládá se do rozehraných her).
import { COUNTRIES, allNeighbors } from '../../shared/data'
import { firstLetter, normalize } from '../../shared/normalize'
import type { Continent, Country, FlagColor } from '../../shared/types'

export interface Category {
  id: string
  /** Text v záhlaví řádku nebo sloupce. */
  label: string
  /**
   * Skupina příbuzných kategorií. Generátor do jedné mřížky nedá víc kategorií
   * ze stejné skupiny, než dovoluje GROUP_LIMIT (výchozí 1).
   */
  group: string
  test: (country: Country) => boolean
}

/** Kolik kategorií z jedné skupiny smí být v jedné mřížce. Neuvedené skupiny: 1. */
export const GROUP_LIMIT: Record<string, number> = { 'flag-color': 2, 'flag-symbol': 2, continent: 2 }

/** Barva v 7. pádě i s předložkou: "Vlajka s červenou barvou", "Vlajka se zelenou barvou". */
const COLOR_NAMES: Record<FlagColor, string> = {
  red: 's červenou',
  white: 's bílou',
  blue: 's modrou',
  green: 'se zelenou',
  yellow: 'se žlutou',
  black: 's černou',
  orange: 's oranžovou',
}
const COLOR_NAMES_GENITIVE: Partial<Record<FlagColor, string>> = { red: 'červené', white: 'bílé', blue: 'modré' }

export { firstLetter }

/** Země s mnoha sousedy pro kategorie "Sousedí s ...". Název je v 7. pádě i s předložkou. */
const NEIGHBOR_HUBS: [string, string][] = [
  ['RUS', 's Ruskem'],
  ['CHN', 's Čínou'],
  ['BRA', 's Brazílií'],
  ['DEU', 's Německem'],
  ['FRA', 's Francií'],
  ['COD', 's DR Kongo'],
  ['IND', 's Indií'],
  ['TUR', 's Tureckem'],
  ['SAU', 'se Saúdskou Arábií'],
  ['SDN', 'se Súdánem'],
  ['TZA', 's Tanzanií'],
  ['AUT', 's Rakouskem'],
]
const MIN_LETTER_COUNTRIES = 9 // písmeno se stane kategorií, jen když na něj začíná aspoň tolik zemí

function letterCategories(kind: 'name' | 'capital'): Category[] {
  const pick = (c: Country) => firstLetter(kind === 'name' ? c.name : c.capital)
  const counts = new Map<string, number>()
  for (const c of COUNTRIES) counts.set(pick(c), (counts.get(pick(c)) ?? 0) + 1)
  return [...counts]
    .filter(([, n]) => n >= MIN_LETTER_COUNTRIES)
    .sort(([a], [b]) => a.localeCompare(b, 'cs'))
    .map(([letter]) => ({
      id: `${kind}-${letter}`,
      label: kind === 'name' ? `Název začíná na ${letter}` : `Hlavní město začíná na ${letter}`,
      group: `${kind}-letter`,
      test: (c: Country) => pick(c) === letter,
    }))
}

const CONTINENTS: Continent[] = ['Evropa', 'Asie', 'Afrika', 'Severní Amerika', 'Jižní Amerika', 'Austrálie a Oceánie']
const million = 1_000_000

export const CATEGORIES: Category[] = [
  // --- vlajky: barvy ---
  ...(Object.keys(COLOR_NAMES) as FlagColor[]).map((color) => ({
    id: `flag-${color}`,
    label: `Vlajka ${COLOR_NAMES[color]} barvou`,
    group: 'flag-color',
    test: (c: Country) => c.flag.colors.includes(color),
  })),
  ...(Object.keys(COLOR_NAMES_GENITIVE) as FlagColor[]).map((color) => ({
    id: `flag-no-${color}`,
    label: `Vlajka bez ${COLOR_NAMES_GENITIVE[color]} barvy`,
    group: 'flag-color',
    test: (c: Country) => !c.flag.colors.includes(color),
  })),
  { id: 'flag-2-colors', label: 'Vlajka má jen dvě barvy', group: 'flag-count', test: (c) => c.flag.colors.length === 2 },
  { id: 'flag-3-colors', label: 'Vlajka má přesně tři barvy', group: 'flag-count', test: (c) => c.flag.colors.length === 3 },
  { id: 'flag-4-colors', label: 'Vlajka má čtyři a více barev', group: 'flag-count', test: (c) => c.flag.colors.length >= 4 },
  // --- vlajky: symboly a vzory ---
  { id: 'flag-star', label: 'Vlajka s hvězdou', group: 'flag-symbol', test: (c) => c.flag.star },
  { id: 'flag-sun', label: 'Vlajka se sluncem', group: 'flag-symbol', test: (c) => c.flag.sun },
  { id: 'flag-crescent', label: 'Vlajka s půlměsícem', group: 'flag-symbol', test: (c) => c.flag.crescent },
  { id: 'flag-cross', label: 'Vlajka s křížem', group: 'flag-symbol', test: (c) => c.flag.cross },
  { id: 'flag-animal', label: 'Vlajka se zvířetem', group: 'flag-symbol', test: (c) => c.flag.animal },
  { id: 'flag-text', label: 'Vlajka s nápisem', group: 'flag-symbol', test: (c) => c.flag.text },
  { id: 'flag-triangle', label: 'Vlajka s klínem u žerdi', group: 'flag-shape', test: (c) => c.flag.hoistTriangle },
  { id: 'flag-horizontal', label: 'Vlajka jen z vodorovných pruhů', group: 'flag-shape', test: (c) => c.flag.stripes === 'horizontal' },
  { id: 'flag-vertical', label: 'Vlajka jen ze svislých pruhů', group: 'flag-shape', test: (c) => c.flag.stripes === 'vertical' },
  // --- poloha ---
  ...CONTINENTS.map((continent) => ({
    id: `continent-${normalize(continent).replace(/ /g, '-')}`,
    label: continent,
    group: 'continent',
    test: (c: Country) => c.continent === continent,
  })),
  { id: 'southern', label: 'Leží na jižní polokouli', group: 'hemisphere', test: (c) => c.lat < 0 },
  { id: 'landlocked', label: 'Vnitrozemský stát', group: 'coast', test: (c) => c.landlocked },
  { id: 'island', label: 'Ostrovní stát bez pozemní hranice', group: 'coast', test: (c) => c.neighbors.length === 0 },
  // --- sousedé ---
  { id: 'neighbors-5', label: 'Sousedí s pěti a více zeměmi', group: 'neighbor-count', test: (c) => allNeighbors(c).length >= 5 },
  { id: 'neighbors-1', label: 'Sousedí s jedinou zemí', group: 'neighbor-count', test: (c) => allNeighbors(c).length === 1 },
  ...NEIGHBOR_HUBS.map(([hub, phrase]) => ({
    id: `borders-${hub}`,
    label: `Sousedí ${phrase}`,
    group: 'neighbor',
    // včetně hranic přes zámořská území: Francie tak patří do "Sousedí s Brazílií"
    test: (c: Country) => allNeighbors(c).includes(hub),
  })),
  // --- čísla ---
  { id: 'pop-over-100m', label: 'Více než 100 milionů obyvatel', group: 'population', test: (c) => c.population > 100 * million },
  { id: 'pop-over-50m', label: 'Více než 50 milionů obyvatel', group: 'population', test: (c) => c.population > 50 * million },
  { id: 'pop-under-1m', label: 'Méně než 1 milion obyvatel', group: 'population', test: (c) => c.population < million },
  { id: 'area-over-1m', label: 'Rozloha přes 1 milion km²', group: 'area', test: (c) => c.area > million },
  { id: 'area-under-10k', label: 'Rozloha pod 10 000 km²', group: 'area', test: (c) => c.area < 10_000 },
  { id: 'temp-over-25', label: 'Průměrná teplota nad 25 °C', group: 'temperature', test: (c) => c.avgTemp !== null && c.avgTemp > 25 },
  { id: 'temp-under-10', label: 'Průměrná teplota pod 10 °C', group: 'temperature', test: (c) => c.avgTemp !== null && c.avgTemp < 10 },
  // --- názvy ---
  { id: 'name-multiword', label: 'Název má víc slov', group: 'name-shape', test: (c) => /[ -]/.test(c.name) },
  ...letterCategories('name'),
  ...letterCategories('capital'),
]

const byId = new Map(CATEGORIES.map((c) => [c.id, c]))

export function getCategory(id: string): Category {
  const category = byId.get(id)
  if (!category) throw new Error('Neznámá kategorie: ' + id)
  return category
}

export function hasCategory(id: string): boolean {
  return byId.has(id)
}

export const isFlagCategory = (category: Category) => category.group.startsWith('flag')
