// Klávesové zkratky pro hraní na počítači. Jednopísmenné zkratky fungují, jen když se právě nepíše
// do políčka. Z políčka pro zemi se odejde klávesou Esc (nabídka se zavře, druhé Esc políčko opustí).
import { findGame } from '../games/registry'

export type ShortcutAction =
  | { type: 'navigate'; route: string }
  | { type: 'theme' }
  | { type: 'sheet' }
  /** Kliknutí na prvek s atributem data-shortcut (tlačítka her a rámu hry). */
  | { type: 'click'; target: 'new' | 'mode' | 'help' | 'stats' | 'backup' }

export type Scope = 'home' | 'game' | 'page'

export function scopeOf(route: string): Scope {
  if (route === '') return 'home'
  return findGame(route)?.component ? 'game' : 'page'
}

/** Co udělá klávesa na dané obrazovce. `key` je `event.key` (písmena malá). Vrací null, když klávesa nic nedělá. */
export function resolveShortcut(key: string, route: string): ShortcutAction | null {
  const scope = scopeOf(route)
  switch (key) {
    case '?':
      return { type: 'sheet' }
    case 'd':
      return { type: 'theme' }
    case 'm':
      return scope === 'home' ? null : { type: 'navigate', route: '' }
  }
  if (scope === 'home') {
    if (key === 's') return { type: 'navigate', route: 'sbirka' }
    if (key === 'a') return { type: 'navigate', route: 'atlas' }
    if (key === 'l') return { type: 'navigate', route: 'slaba-mista' }
    if (key === 'b') return { type: 'click', target: 'backup' }
  }
  if (scope === 'game') {
    if (key === 'n') return { type: 'click', target: 'new' }
    if (key === 'r') return { type: 'click', target: 'mode' }
    if (key === 'p') return { type: 'click', target: 'help' }
    if (key === 't') return { type: 'click', target: 'stats' }
  }
  return null
}

const TYPING_INPUTS = new Set(['text', 'search', 'email', 'url', 'number', 'password', 'tel', ''])

/** Píše se právě do políčka (text, textarea, výběr)? Pak se zkratky nespouští. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true
  if (el.tagName === 'INPUT') return TYPING_INPUTS.has((el as HTMLInputElement).type)
  return el.isContentEditable === true
}

export const SHORTCUTS_EVENT = 'geohry:shortcuts'

/** Otevře okno s přehledem zkratek. */
export function openShortcuts(): void {
  window.dispatchEvent(new CustomEvent(SHORTCUTS_EVENT))
}

/** Najde ve stránce prvek, na který zkratka míří. Pro přepnutí režimu je to ten, který zrovna není vybraný. */
export function findShortcutTarget(target: string): HTMLElement | null {
  const selector = target === 'mode' ? '[data-shortcut="mode"][aria-pressed="false"]' : `[data-shortcut="${target}"]`
  return document.querySelector<HTMLElement>(selector)
}

export interface ShortcutSection {
  title: string
  rows: { keys: string[]; text: string }[]
}

export const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'Všude',
    rows: [
      { keys: ['?'], text: 'Tenhle přehled' },
      { keys: ['D'], text: 'Přepnout světlý a tmavý režim' },
      { keys: ['M'], text: 'Zpět na přehled her' },
      { keys: ['Esc'], text: 'V políčku pro zemi: zavře nabídku, podruhé políčko opustí. Pak fungují písmenné zkratky' },
      { keys: ['↑', '↓', 'Enter'], text: 'V políčku pro zemi: výběr z nabídky' },
    ],
  },
  {
    title: 'Na přehledu her',
    rows: [
      { keys: ['S'], text: 'Sbírka zemí' },
      { keys: ['A'], text: 'Atlas zemí' },
      { keys: ['L'], text: 'Slabá místa' },
      { keys: ['B'], text: 'Záloha postupu' },
    ],
  },
  {
    title: 'Ve hře',
    rows: [
      { keys: ['N'], text: 'Nová hra (po dohrání kola)' },
      { keys: ['R'], text: 'Přepnout denní výzvu a volnou hru' },
      { keys: ['P'], text: 'Jak hrát' },
      { keys: ['T'], text: 'Statistiky' },
    ],
  },
]
