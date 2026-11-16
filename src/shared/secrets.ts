// Drobné easter eggy mimo Československo (to je v easterEgg.ts). Nic se tu neukazuje samo, vše se musí najít:
//  - tajná slova v políčku pro zemi (fiktivní a zaniklé země, Měsíc, Antarktida),
//  - Konami kód kdekoli na stránce,
//  - státní svátky a Den Země na domovské stránce,
//  - změna titulku karty, když hráč přepne jinam.
import { normalize } from './normalize'

export interface SecretWord {
  /** Názvy, na které to reaguje (bez ohledu na diakritiku a velikost písmen). */
  names: string[]
  title: string
  lines: string[]
}

/** Slova, která nejsou v seznamu zemí. Test hlídá, že žádné slovo nepatří skutečné zemi. */
export const SECRET_WORDS: SecretWord[] = [
  {
    names: ['Wakanda'],
    title: 'Wakanda',
    lines: ['Na mapě není. Prý se schovává tak dobře, že ji nenajdou ani satelity.'],
  },
  {
    names: ['Narnie'],
    title: 'Narnie',
    lines: ['Do Narnie se chodí skříní, ne po souši. Cesta mezi zeměmi tam nevede.'],
  },
  {
    names: ['Mordor'],
    title: 'Mordor',
    lines: ['Do Mordoru prý nejde jen tak vejít. Na mapě světa ho ale nehledej, leží ve Středozemi.'],
  },
  {
    names: ['Atlantida'],
    title: 'Atlantida',
    lines: ['Prý leží pod vodou. Tip se nepočítá, ale moře na mapě je skutečné.'],
  },
  {
    names: ['Kocourkov'],
    title: 'Kocourkov',
    lines: ['Není to stát, ale pojem pro místo, kde se dějí pošetilosti. Na mapě ho nenajdeš a tip se nepočítá.'],
  },
  {
    names: ['Země', 'Planeta Země', 'Zeměkoule', 'Svět'],
    title: 'Planeta Země',
    lines: ['Tipuješ planetu, na které právě stojíš. Hledaná země na ní je, to ti slíbit můžu.'],
  },
  {
    names: ['Měsíc', 'Luna'],
    title: 'Měsíc',
    lines: ['Na Měsíci žádné státy nejsou, jen pár vlajek po cestě.'],
  },
  {
    names: ['Antarktida'],
    title: 'Antarktida',
    lines: ['Nepatří žádnému státu. Smlouva z roku 1959 ji vyhradila vědě a míru.'],
  },
  // zaniklé státy: jen věcně, tip se nepočítá
  {
    names: ['Sovětský svaz', 'SSSR', 'CCCP'],
    title: 'Sovětský svaz',
    lines: ['Takový stát už mapa nezná. Existoval v letech 1922 až 1991. Tip se nepočítá.'],
  },
  {
    names: ['Jugoslávie'],
    title: 'Jugoslávie',
    lines: ['Takový stát už mapa nezná. Vznikl v roce 1918 a rozpadl se v 90. letech, poslední zbytek (svaz Srbska a Černé Hory) zanikl v roce 2006. Tip se nepočítá.'],
  },
  {
    names: ['NDR', 'Východní Německo'],
    title: 'Německá demokratická republika',
    lines: ['Takový stát už mapa nezná. Existoval v letech 1949 až 1990. Tip se nepočítá.'],
  },
  {
    names: ['Rakousko-Uhersko'],
    title: 'Rakousko-Uhersko',
    lines: ['Takový stát už mapa nezná. Existoval v letech 1867 až 1918, a vznikl tedy po něm i Československo. Tip se nepočítá.'],
  },
]

const SECRET_INDEX = new Map<string, SecretWord>()
for (const secret of SECRET_WORDS) for (const name of secret.names) SECRET_INDEX.set(normalize(name), secret)

/** Je napsaný text některé z tajných slov? */
export function findSecretWord(text: string): SecretWord | undefined {
  return SECRET_INDEX.get(normalize(text))
}

/** Co říkají signální vlajky nad nápisem GeoHry (klik na ně na domovské stránce). Význam podle Mezinárodního signálního kodexu. */
export const FLAG_MEANINGS: [letter: string, meaning: string][] = [
  ['G', 'Potřebuji lodivoda.'],
  ['E', 'Měním kurz doprava.'],
  ['O', 'Člověk přes palubu!'],
  ['H', 'Mám na palubě lodivoda.'],
  ['R', 'Dnes bez významu (do roku 1969: „cesta kolem mé lodi je volná“).'],
  ['Y', 'Vleče se mi kotva.'],
]

/** Věta pod nadpisem domovské stránky ve vybraných dnech, jinak null. */
export function specialDayNote(date: Date): string | null {
  const day = date.getDate()
  const month = date.getMonth() + 1
  if (day === 28 && month === 10) return 'Dnes je státní svátek: Den vzniku samostatného československého státu (1918).'
  if (day === 17 && month === 11) return 'Dnes je státní svátek: Den boje za svobodu a demokracii.'
  if (day === 1 && month === 1) return 'Dnes je Nový rok a Den obnovy samostatného českého státu.'
  if (day === 22 && month === 4) return 'Dnes je Den Země. Tuhle planetu hrajeme celou.'
  return null
}

/** Konami kód. */
export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** Posune postup v Konami kódu. Vrací nový postup (počet správně stisknutých kláves); KONAMI.length = hotovo. */
export function advanceKonami(progress: number, key: string): number {
  const k = key.length === 1 ? key.toLowerCase() : key
  if (k === KONAMI[progress]) return progress + 1
  return k === KONAMI[0] ? 1 : 0
}
