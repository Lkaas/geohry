// Perličky o zemích a doménách. Ukážou se jako zpráva dole, když hráč zadá danou zemi (každá jen jednou).
// Všechna tvrzení jsou ověřená (zdroje v HANDOFF.md); co jde, kontrolují i testy proti datům projektu.
import { COUNTRIES } from './data'
import { loadJson, saveJson } from './storage'
import type { Country } from './types'

export interface Note {
  title: string
  lines: string[]
}

/** Perličky podle kódu země. */
export const COUNTRY_TRIVIA: Record<string, Note> = {
  LIE: {
    title: 'Lichtenštejnsko',
    lines: [
      'Dvojnásobně vnitrozemský stát: k moři se dostaneš až přes dvě hranice, protože Rakousko i Švýcarsko moře nemají.',
      'Na olympiádě 1936 se zjistilo, že má stejnou vlajku jako Haiti. V roce 1937 přidalo korunu.',
    ],
  },
  UZB: {
    title: 'Uzbekistán',
    lines: ['Dvojnásobně vnitrozemský stát, jako Lichtenštejnsko. Jiné takové dva státy na světě nejsou.'],
  },
  NPL: {
    title: 'Nepál',
    lines: ['Jediná národní vlajka na světě, která není obdélníková ani čtvercová. Jak ji sestrojit, popisuje přímo ústava.'],
  },
  VAT: {
    title: 'Vatikán',
    lines: ['Nejmenší stát světa. Má čtvercovou vlajku, a takovou má jen ještě Švýcarsko.'],
  },
  CHE: {
    title: 'Švýcarsko',
    lines: ['Čtvercová vlajka. Mezi státy ji má jen ještě Vatikán.'],
  },
  TCD: {
    title: 'Čad',
    lines: ['Vlajka téměř stejná jako rumunská. Liší se hlavně odstínem modré.'],
  },
  ROU: {
    title: 'Rumunsko',
    lines: ['Vlajka téměř stejná jako čadská. Liší se hlavně odstínem modré.'],
  },
  IDN: {
    title: 'Indonésie',
    lines: ['Červená nad bílou, stejně jako na vlajce Monaka. Rozdíl je v poměru stran: 2:3 u Indonésie, 4:5 u Monaka.'],
  },
  MCO: {
    title: 'Monako',
    lines: ['Červená nad bílou, stejně jako na vlajce Indonésie. Rozdíl je v poměru stran: 4:5 u Monaka, 2:3 u Indonésie.'],
  },
  HTI: {
    title: 'Haiti',
    lines: ['Na olympiádě 1936 se zjistilo, že Lichtenštejnsko má stejnou civilní vlajku. Lichtenštejnsko v roce 1937 přidalo na vlajku korunu.'],
  },
  IRL: {
    title: 'Irsko',
    lines: ['Zelená, bílá, oranžová. Pobřeží slonoviny má stejné tři barvy v opačném pořadí.'],
  },
  CIV: {
    title: 'Pobřeží slonoviny',
    lines: ['Oranžová, bílá, zelená. Irsko má stejné tři barvy v opačném pořadí.'],
  },
  PHL: {
    title: 'Filipíny',
    lines: ['Vlajka se podle zákona otáčí červenou nahoru, když je země ve válce. V míru je nahoře modrá.'],
  },
}

const SEEN_KEY = 'trivia-seen'

/** Vrátí perličku pro zemi, pokud nějaká je a ještě se neukázala, a zapíše, že se ukázala. */
export function takeTrivia(countryId: string): Note | null {
  const note = COUNTRY_TRIVIA[countryId]
  if (!note) return null
  const seen = loadJson<string[]>(SEEN_KEY, [])
  if (seen.includes(countryId)) return null
  saveJson(SEEN_KEY, [...seen, countryId])
  return note
}

/** Poznámky k doménám podle koncovky (bez tečky). Platí i pro koncovky, které nepatří žádné zemi v seznamu. */
export const DOMAIN_NOTES: Record<string, Note> = {
  tv: { title: '.tv', lines: ['Doména .tv patří Tuvalu. Televizní a streamovací weby ji kupují kvůli zkratce, ne kvůli Tichému oceánu.'] },
  fm: { title: '.fm', lines: ['Doména .fm patří Mikronésii. Rádia a podcasty ji používají kvůli zkratce FM.'] },
  cz: { title: '.cz', lines: ['Doma.'] },
  ai: { title: '.ai', lines: ['Doména .ai patří Anguille, britskému území v Karibiku. V seznamu zemí není, ale firmy kolem umělé inteligence ji milují.'] },
  su: { title: '.su', lines: ['Doména .su zbyla po Sovětském svazu, který zanikl v roce 1991. Existuje dodnes.'] },
}

/** Z textu ".tv" vrátí "tv". Vrací null, když to není tečka a dvě písmena. */
export function parseDomain(text: string): string | null {
  const match = /^\s*\.([a-zA-Z]{2})\s*$/.exec(text)
  return match ? match[1].toLowerCase() : null
}

/** Země, které patří národní doména. Výjimka: .uk patří Spojenému království (kód GB). */
export function countryForDomain(tld: string): Country | undefined {
  const iso2 = tld === 'uk' ? 'gb' : tld
  return COUNTRIES.find((c) => c.iso2 === iso2)
}
