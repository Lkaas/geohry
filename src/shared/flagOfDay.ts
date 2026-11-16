// Vlajka dne na domovské stránce: jedna země pro každý den a jedna věta spočítaná z dat projektu.
import { COUNTRIES } from './data'
import { dailyPick, dailyRandom } from './random'
import type { Country, FlagColor } from './types'

const COLOR_GENITIVE: Record<FlagColor, string> = {
  red: 'červené',
  white: 'bílé',
  blue: 'modré',
  green: 'zelené',
  yellow: 'žluté',
  black: 'černé',
  orange: 'oranžové',
}

const SYMBOLS: [key: 'star' | 'sun' | 'crescent' | 'cross' | 'animal' | 'text' | 'hoistTriangle', phrase: string][] = [
  ['star', 's hvězdou'],
  ['sun', 'se sluncem'],
  ['crescent', 's půlměsícem'],
  ['cross', 's křížem'],
  ['animal', 'se zvířetem'],
  ['text', 's nápisem'],
  ['hoistTriangle', 's klínem u žerdi'],
]

const RARE = 12 // „zajímavé“ je to, co splňuje nejvýš tolik zemí nebo je to do této příčky v pořadí
const TOP = 10

/** „z“ nebo „ze“ před číslem podle toho, jak se čte: ze dvou, ze tří, ze čtyř, ze šesti, ze sedmi, ze dvanácti, ale z pěti, z osmi. */
function preposition(n: number): 'z' | 'ze' {
  return [2, 3, 4, 6, 7, 12].includes(n) ? 'ze' : 'z'
}

/** Všechny zajímavé věty o vlajce a zemi, spočítané z dat. Prázdné pole = nic nevyniká. */
export function flagFacts(country: Country): string[] {
  const total = COUNTRIES.length
  const facts: string[] = []

  for (const [color, share] of Object.entries(country.flag.shares) as [FlagColor, number][]) {
    if (share < 15) continue
    const rank = 1 + COUNTRIES.filter((c) => (c.flag.shares[color] ?? 0) > share).length
    if (rank <= TOP) {
      facts.push(`${COLOR_GENITIVE[color][0].toUpperCase()}${COLOR_GENITIVE[color].slice(1)} zabírá ${Math.round(share)} % vlajky. To je ${rank === 1 ? 'největší' : `${rank}. největší`} podíl ze všech ${total} vlajek.`)
    }
  }

  for (const [key, phrase] of SYMBOLS) {
    if (!country.flag[key]) continue
    const count = COUNTRIES.filter((c) => c.flag[key]).length
    if (count > RARE) continue
    facts.push(count === 1 ? `Podle dat v GeoHrách je jediná ze ${total} vlajek ${phrase}.` : `Podle dat v GeoHrách je jednou ${preposition(count)} ${count} vlajek ${phrase}.`)
  }

  const byPeople = 1 + COUNTRIES.filter((c) => c.population > country.population).length
  if (byPeople <= TOP) facts.push(`Je ${byPeople}. nejlidnatější země ze ${total}.`)
  const byArea = 1 + COUNTRIES.filter((c) => c.area > country.area).length
  if (byArea <= TOP) facts.push(`Je ${byArea}. největší země ze ${total}.`)
  const smaller = COUNTRIES.filter((c) => c.area < country.area).length
  if (smaller < TOP) facts.push(smaller === 0 ? `Je nejmenší země ze ${total}.` : `Je ${smaller + 1}. nejmenší země ze ${total}.`)

  return facts
}

export interface FlagOfDay {
  country: Country
  fact: string
}

/**
 * Vlajka dne. `avoid` jsou země, které jsou dnes hledané v některé hře (aby vlajka dne nic neprozradila).
 * Bere se jen země, o které se dá říct něco zajímavého.
 */
export function flagOfDay(dateKey: string, avoid: ReadonlySet<string> = new Set()): FlagOfDay {
  const eligible = COUNTRIES.filter((c) => !avoid.has(c.id) && flagFacts(c).length > 0)
  const country = dailyPick('flag-of-day', dateKey, eligible)
  const facts = flagFacts(country)
  const rng = dailyRandom('flag-of-day-fact', dateKey)
  return { country, fact: facts[Math.floor(rng() * facts.length)] }
}
