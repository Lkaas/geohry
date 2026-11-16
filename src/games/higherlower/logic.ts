// Herní logika hry Víc, nebo míň? Čisté funkce bez závislosti na UI.
// Každé kolo se hraje s jedním parametrem (obyvatelé, rozloha, HDP, ...), parametry se nemíchají.
import { COUNTRIES, getCountry } from '../../shared/data'
import { formatArea, formatPopulation, formatRounded, formatTemperature, formatUsd } from '../../shared/format'
import { dailyRandom, dayNumber } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { Country, GameMode } from '../../shared/types'

export const GAME_ID = 'higher-lower'

export interface Param {
  id: string
  /** Název tématu na přepínači. */
  label: string
  /** Otázka nad dvojicí zemí. */
  question: string
  /** Popisky tlačítek. */
  more: string
  less: string
  /** Hodnota země, null = údaj chybí (země se v tomto tématu neobjeví). */
  value: (country: Country) => number | null
  format: (value: number) => string
  /** Jsou si dvě hodnoty tak blízko, že by otázka byla nefér? */
  tooClose: (a: number, b: number) => boolean
}

/** Hodnoty se musí lišit aspoň o 15 % (u teploty o 1,5 °C), jinak se dvojice nepoužije. */
const ratioTooClose = (a: number, b: number) => Math.max(a, b) / Math.min(a, b) < 1.15

/** Seznam témat. Nové téma = nový záznam (id po vydání neměnit, ukládá se do rozehraných her). */
export const PARAMS: Param[] = [
  { id: 'population', label: 'Obyvatelé', question: 'Která země má víc obyvatel?', more: 'Víc obyvatel', less: 'Míň obyvatel', value: (c) => c.population, format: formatPopulation, tooClose: ratioTooClose },
  { id: 'area', label: 'Rozloha', question: 'Která země je větší?', more: 'Větší', less: 'Menší', value: (c) => c.area, format: formatArea, tooClose: ratioTooClose },
  { id: 'gdp', label: 'HDP', question: 'Která země má vyšší HDP?', more: 'Vyšší HDP', less: 'Nižší HDP', value: (c) => c.gdp, format: formatUsd, tooClose: ratioTooClose },
  {
    id: 'gdp-per-capita',
    label: 'HDP na obyvatele',
    question: 'Která země má vyšší HDP na obyvatele?',
    more: 'Vyšší',
    less: 'Nižší',
    value: (c) => (c.gdp === null ? null : c.gdp / c.population),
    format: (v) => formatRounded(v, 'USD'),
    tooClose: ratioTooClose,
  },
  {
    id: 'density',
    label: 'Hustota zalidnění',
    question: 'Která země je hustěji zalidněná?',
    more: 'Hustěji',
    less: 'Řidčeji',
    value: (c) => c.population / c.area,
    format: (v) => formatRounded(v, 'obyv./km²'),
    tooClose: ratioTooClose,
  },
  {
    id: 'temperature',
    label: 'Teplota',
    question: 'Ve které zemi je průměrně tepleji?',
    more: 'Tepleji',
    less: 'Chladněji',
    value: (c) => c.avgTemp,
    format: (v) => formatTemperature(v),
    tooClose: (a, b) => Math.abs(a - b) < 1.5,
  },
]

export function getParam(id: string): Param {
  const param = PARAMS.find((p) => p.id === id)
  if (!param) throw new Error('Neznámé téma: ' + id)
  return param
}

/** Denní výzva má téma podle dne (střídají se dokola) a nejvýš 15 porovnání. */
export const DAILY_LENGTH = 15
/** Série, od které se denní výzva počítá jako splněná. */
export const WIN_STREAK = 5
const FREE_LENGTH = 150

export function dailyParam(dateKey: string): Param {
  const n = PARAMS.length
  return PARAMS[((dayNumber(dateKey) % n) + n) % n]
}

export function valueOf(param: Param, countryId: string): number {
  const value = param.value(getCountry(countryId))
  if (value === null) throw new Error(`Země ${countryId} nemá údaj pro téma ${param.id}`)
  return value
}

/**
 * Posloupnost zemí pro jedno kolo: sousední dvojice se vždy dost liší a žádná země se neopakuje.
 * `comparisons` = počet porovnání (posloupnost má o jednu zemi víc).
 */
export function buildSequence(param: Param, random: () => number, comparisons: number): string[] {
  const pool = COUNTRIES.filter((c) => param.value(c) !== null).map((c) => c.id)
  const sequence = [pool[Math.floor(random() * pool.length)]]
  const used = new Set(sequence)
  while (sequence.length <= comparisons) {
    const current = valueOf(param, sequence[sequence.length - 1])
    const options = pool.filter((id) => !used.has(id) && !param.tooClose(current, valueOf(param, id)))
    if (options.length === 0) break
    const next = options[Math.floor(random() * options.length)]
    sequence.push(next)
    used.add(next)
  }
  return sequence
}

export function pickSequence(mode: GameMode, param: Param, dateKey: string, random: () => number = Math.random): string[] {
  return mode === 'daily' ? buildSequence(param, dailyRandom(`${GAME_ID}:${param.id}`, dateKey), DAILY_LENGTH) : buildSequence(param, random, FREE_LENGTH)
}

export type Answer = 'more' | 'less'

/** Správná odpověď: má druhá země víc, nebo míň než první? */
export function correctAnswer(param: Param, firstId: string, secondId: string): Answer {
  return valueOf(param, secondId) > valueOf(param, firstId) ? 'more' : 'less'
}

/** Stav po dohrání: série aspoň WIN_STREAK je úspěch. */
export function finalStatus(streak: number): DailyStatus {
  return streak >= WIN_STREAK ? 'won' : 'lost'
}

export function buildShareText(label: string, param: Param, streak: number, completed: boolean): string {
  const squares = '🟩'.repeat(streak) + (completed ? '' : '🟥')
  return [`GeoHry: Víc, nebo míň? (${label})`, `Téma: ${param.label}, série ${streak}${completed ? ' (bez chyby až do konce)' : ''}`, squares].join('\n')
}
