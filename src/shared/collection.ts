// Výpočty pro Sbírku zemí (pořadí podle dat, postup po kontinentech).
import { COUNTRIES } from './data'
import type { Continent } from './types'

export type RankKey = 'population' | 'area'

/** Pořadí země od největší hodnoty: 1 = nejlidnatější / největší. Při shodě mají země stejné pořadí. */
export function rankOf(countryId: string, key: RankKey): number {
  const value = COUNTRIES.find((c) => c.id === countryId)?.[key]
  if (value === undefined) throw new Error('Neznámá země: ' + countryId)
  return 1 + COUNTRIES.filter((c) => c[key] > value).length
}

const CONTINENT_ORDER: Continent[] = ['Evropa', 'Asie', 'Afrika', 'Severní Amerika', 'Jižní Amerika', 'Austrálie a Oceánie']

export interface ContinentProgress {
  continent: Continent
  have: number
  total: number
}

/** Kolik zemí z každého kontinentu už je ve sbírce. */
export function continentProgress(have: ReadonlySet<string>): ContinentProgress[] {
  return CONTINENT_ORDER.map((continent) => {
    const inContinent = COUNTRIES.filter((c) => c.continent === continent)
    return { continent, have: inContinent.filter((c) => have.has(c.id)).length, total: inContinent.length }
  })
}
