// Herní logika hry Tajemná vlajka: uhodnout vlajku podle nápověd seřazených od mlhavých po přesné.
// Čisté funkce bez závislosti na UI.
import { COUNTRIES, getCountry } from '../../shared/data'
import { firstLetter } from '../../shared/normalize'
import { dailyPick, randomPick } from '../../shared/random'
import type { DailyStatus } from '../../shared/stats'
import type { Continent, Country, FlagColor } from '../../shared/types'
import type { GameMode } from '../../shared/types'

export const GAME_ID = 'flag-clues'
/** Nejvýš tolik nápověd o vlajce; za nimi následuje nápověda o kontinentu a případně ještě první písmeno názvu. */
export const MAX_FLAG_CLUES = 6

export interface Clue {
  id: string
  /** Text nápovědy, celá věta. */
  text: string
  test: (country: Country) => boolean
}

const COLOR: Record<FlagColor, { name: string; capital: string }> = {
  red: { name: 'červená', capital: 'Červená' },
  white: { name: 'bílá', capital: 'Bílá' },
  blue: { name: 'modrá', capital: 'Modrá' },
  green: { name: 'zelená', capital: 'Zelená' },
  yellow: { name: 'žlutá', capital: 'Žlutá' },
  black: { name: 'černá', capital: 'Černá' },
  orange: { name: 'oranžová', capital: 'Oranžová' },
}
const COUNT_TEXT: Record<number, string> = { 2: 'dvě barvy', 3: 'tři barvy', 4: 'čtyři barvy', 5: 'pět barev', 6: 'šest barev' }
const CONTINENT_LOCATIVE: Record<Continent, string> = {
  Evropa: 'v Evropě',
  Asie: 'v Asii',
  Afrika: 'v Africe',
  'Severní Amerika': 'v Severní Americe',
  'Jižní Amerika': 'v Jižní Americe',
  'Austrálie a Oceánie': 'v Austrálii a Oceánii',
}

const share = (c: Country, color: FlagColor) => c.flag.shares[color] ?? 0
/** O kolik procentních bodů musí největší barva převyšovat druhou, aby se o ní mluvilo jako o převládající. */
export const DOMINANT_MARGIN = 5

/** Barva, která zabírá jasně největší plochu. null = žádná jasně nepřevládá (např. trikolóra ze stejných pruhů). */
export function dominantColor(c: Country): FlagColor | null {
  const ranked = [...c.flag.colors].sort((a, b) => share(c, b) - share(c, a))
  return share(c, ranked[0]) - share(c, ranked[1]) >= DOMINANT_MARGIN ? ranked[0] : null
}
const hasSymbol = (c: Country) => c.flag.star || c.flag.sun || c.flag.crescent || c.flag.cross || c.flag.animal || c.flag.text

/** Podíl barvy zaokrouhlený na pět procent (nejméně 5). */
export const roundedShare = (percent: number) => Math.max(5, Math.round(percent / 5) * 5)
/** Tolerance u nápovědy "zabírá asi X %": vlajka sedí, když se podíl liší nejvýš o tolik procentních bodů. */
export const SHARE_TOLERANCE = 5
/** Pod touto hranicí se mluví o "nepatrné části plochy". */
export const TINY_SHARE = 3

/** Všechny nápovědy, které o vlajce dané země platí (v libovolném pořadí). */
export function candidateClues(target: Country): Clue[] {
  const f = target.flag
  const clues: Clue[] = []
  const n = f.colors.length
  clues.push({ id: `count-${n}`, text: `Vlajka má ${COUNT_TEXT[n] ?? `${n} barev`}.`, test: (c) => c.flag.colors.length === n })

  for (const color of f.colors) {
    clues.push({ id: `has-${color}`, text: `Je na ní ${COLOR[color].name} barva.`, test: (c) => c.flag.colors.includes(color) })
    const percent = share(target, color)
    if (percent < TINY_SHARE) {
      clues.push({
        id: `tiny-${color}`,
        text: `${COLOR[color].capital} zabírá jen nepatrnou část plochy (do ${TINY_SHARE} %).`,
        test: (c) => c.flag.colors.includes(color) && share(c, color) < TINY_SHARE,
      })
    } else {
      const rounded = roundedShare(percent)
      clues.push({
        id: `share-${color}-${rounded}`,
        text: `${COLOR[color].capital} zabírá asi ${rounded} % plochy.`,
        test: (c) => c.flag.colors.includes(color) && Math.abs(share(c, color) - rounded) <= SHARE_TOLERANCE,
      })
    }
  }
  for (const color of ['red', 'white', 'blue'] as FlagColor[]) {
    if (!f.colors.includes(color)) clues.push({ id: `no-${color}`, text: `Není na ní ${COLOR[color].name} barva.`, test: (c) => !c.flag.colors.includes(color) })
  }
  const top = dominantColor(target)
  if (top) clues.push({ id: `dominant-${top}`, text: `Nejvíc plochy zabírá ${COLOR[top].name}.`, test: (c) => dominantColor(c) === top })
  else clues.push({ id: 'no-dominant', text: 'Žádná barva na ní výrazně nepřevládá.', test: (c) => dominantColor(c) === null })

  if (f.star) clues.push({ id: 'star', text: 'Je na ní hvězda.', test: (c) => c.flag.star })
  if (f.sun) clues.push({ id: 'sun', text: 'Je na ní slunce s paprsky.', test: (c) => c.flag.sun })
  if (f.crescent) clues.push({ id: 'crescent', text: 'Je na ní půlměsíc.', test: (c) => c.flag.crescent })
  if (f.cross) clues.push({ id: 'cross', text: 'Je na ní kříž.', test: (c) => c.flag.cross })
  if (f.animal) clues.push({ id: 'animal', text: 'Je na ní zvíře.', test: (c) => c.flag.animal })
  if (f.text) clues.push({ id: 'text', text: 'Je na ní nápis.', test: (c) => c.flag.text })
  if (!hasSymbol(target)) clues.push({ id: 'no-symbol', text: 'Není na ní hvězda, slunce, půlměsíc, kříž, zvíře ani nápis.', test: (c) => !hasSymbol(c) })
  if (f.hoistTriangle) clues.push({ id: 'triangle', text: 'Má klín u žerdi.', test: (c) => c.flag.hoistTriangle })
  if (f.stripes === 'horizontal') clues.push({ id: 'horizontal', text: 'Skládá se jen z vodorovných pruhů.', test: (c) => c.flag.stripes === 'horizontal' })
  if (f.stripes === 'vertical') clues.push({ id: 'vertical', text: 'Skládá se jen ze svislých pruhů.', test: (c) => c.flag.stripes === 'vertical' })
  return clues
}

export function continentClue(target: Country): Clue {
  return { id: 'continent', text: `Patří zemi, která leží ${CONTINENT_LOCATIVE[target.continent]}.`, test: (c) => c.continent === target.continent }
}

/** Kódy zemí, jejichž vlajka vyhovuje všem zadaným nápovědám. */
export function matchingCountries(clues: readonly Clue[]): string[] {
  return COUNTRIES.filter((c) => clues.every((clue) => clue.test(c))).map((c) => c.id)
}

/**
 * Kolik vlajek má zhruba zbývat po 1., 2., ... nápovědě. Díky tomu jdou nápovědy od mlhavých k přesným:
 * první vyřadí asi polovinu světa, poslední nechá jen pár vlajek.
 */
const TARGET_REMAINING = [100, 50, 22, 9, 4, 1]

/**
 * Vybere a seřadí nápovědy pro danou zemi. V každém kroku se z nepoužitých nápověd vezme ta,
 * po které zbude počet vyhovujících vlajek nejblíž plánu (TARGET_REMAINING). Nápověda, která by nic
 * nevyřadila, se nepoužije. Za nápovědami o vlajce je vždy kontinent.
 */
export function selectClues(targetId: string): Clue[] {
  const target = getCountry(targetId)
  const pool = candidateClues(target)
  const chosen: Clue[] = []
  let remaining = COUNTRIES.length
  for (let step = 0; step < MAX_FLAG_CLUES && remaining > 1; step++) {
    let best: { clue: Clue; size: number; distance: number } | null = null
    for (const clue of pool) {
      if (chosen.includes(clue)) continue
      const size = matchingCountries([...chosen, clue]).length
      if (size >= remaining) continue
      const distance = Math.abs(Math.log(size) - Math.log(TARGET_REMAINING[step]))
      if (!best || distance < best.distance) best = { clue, size, distance }
    }
    if (!best) break
    chosen.push(best.clue)
    remaining = best.size
  }
  const clues = [...chosen, continentClue(target)]
  // když ani kontinent nestačí (vlajky jako Nizozemsko a Lucembursko vypadají v datech stejně), přidá se první písmeno názvu
  if (matchingCountries(clues).length > 1) {
    const letter = firstLetter(target.name)
    clues.push({ id: 'letter', text: `Název země začíná na ${letter}.`, test: (c) => firstLetter(c.name) === letter })
  }
  return clues
}

export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  const ids = COUNTRIES.map((c) => c.id)
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, ids) : randomPick(ids, random)
}

/** Tip je kód země, nebo null = hráč si nechal ukázat další nápovědu bez tipování. */
export type Guess = string | null

export function roundStatus(targetId: string, guesses: readonly Guess[], clueCount: number): DailyStatus {
  if (guesses.includes(targetId)) return 'won'
  return guesses.length >= clueCount ? 'lost' : 'playing'
}

/** Kolik nápověd je právě vidět: první hned, další po každém tipu. */
export function visibleClueCount(guesses: readonly Guess[], clueCount: number): number {
  return Math.min(clueCount, guesses.length + 1)
}

export function buildShareText(label: string, targetId: string, guesses: readonly Guess[], clueCount: number): string {
  const won = guesses.includes(targetId)
  const squares = guesses.map((g) => (g === targetId ? '🟩' : g === null ? '⬜' : '🟥')).join('')
  return [`GeoHry: Tajemná vlajka (${label}) ${won ? guesses.length : 'X'}/${clueCount}`, squares].join('\n')
}
