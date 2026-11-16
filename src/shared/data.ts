import countriesJson from '../data/countries.json'
import distancesJson from '../data/distances.json'
import type { Country } from './types'

/** Všech 197 zemí, seřazených podle kódu. */
export const COUNTRIES = countriesJson as unknown as Country[]

const byId = new Map(COUNTRIES.map((c) => [c.id, c]))
const matrixIndex = new Map(distancesJson.ids.map((id, i) => [id, i]))
const matrix = distancesJson.km as number[][]

export function getCountry(id: string): Country {
  const c = byId.get(id)
  if (!c) throw new Error('Neznámá země: ' + id)
  return c
}

export function hasCountry(id: string): boolean {
  return byId.has(id)
}

/** Nejkratší vzdálenost mezi hranicemi dvou zemí v km. 0 = země sousedí (nebo je to tatáž země). */
export function borderDistanceKm(a: string, b: string): number {
  const i = matrixIndex.get(a)
  const j = matrixIndex.get(b)
  if (i === undefined || j === undefined) throw new Error(`Neznámá země: ${a} / ${b}`)
  return matrix[i][j]
}

export function areNeighbors(a: string, b: string): boolean {
  return a !== b && getCountry(a).neighbors.includes(b)
}

/** Cesta k obrázku vlajky (funguje i v podsložce díky relativní cestě). */
export function flagUrl(country: Country): string {
  return `${import.meta.env.BASE_URL}flags/${country.iso2}.svg`
}

/** Všichni sousedé země včetně těch přes zámořská území (Francie tak sousedí i s Nizozemskem, Brazílií a Surinamem). */
export function allNeighbors(country: Country): string[] {
  return [...country.neighbors, ...country.overseasNeighbors]
}
