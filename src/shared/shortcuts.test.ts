// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { SHORTCUT_SECTIONS, findShortcutTarget, isTypingTarget, resolveShortcut, scopeOf } from './shortcuts'

describe('scopeOf', () => {
  it('rozpozná přehled, hru a ostatní stránky', () => {
    expect(scopeOf('')).toBe('home')
    expect(scopeOf('tajemna-zeme')).toBe('game')
    expect(scopeOf('atlas')).toBe('page')
    expect(scopeOf('atlas-CZE')).toBe('page')
    expect(scopeOf('sbirka')).toBe('page')
  })

  it('hra, která se teprve připravuje, není hra', () => {
    expect(scopeOf('flagle')).toBe('page')
  })
})

describe('resolveShortcut', () => {
  it('? a d fungují všude', () => {
    for (const route of ['', 'tajemna-zeme', 'atlas']) {
      expect(resolveShortcut('?', route)).toEqual({ type: 'sheet' })
      expect(resolveShortcut('d', route)).toEqual({ type: 'theme' })
    }
  })

  it('m vede domů, ale na přehledu nic nedělá', () => {
    expect(resolveShortcut('m', 'countryle')).toEqual({ type: 'navigate', route: '' })
    expect(resolveShortcut('m', '')).toBeNull()
  })

  it('na přehledu otevírají sbírku, atlas, slabá místa a zálohu', () => {
    expect(resolveShortcut('s', '')).toEqual({ type: 'navigate', route: 'sbirka' })
    expect(resolveShortcut('a', '')).toEqual({ type: 'navigate', route: 'atlas' })
    expect(resolveShortcut('l', '')).toEqual({ type: 'navigate', route: 'slaba-mista' })
    expect(resolveShortcut('b', '')).toEqual({ type: 'click', target: 'backup' })
  })

  it('ve hře ovládají hru a na přehledu nedělají nic', () => {
    expect(resolveShortcut('n', 'geogrid')).toEqual({ type: 'click', target: 'new' })
    expect(resolveShortcut('r', 'geogrid')).toEqual({ type: 'click', target: 'mode' })
    expect(resolveShortcut('p', 'geogrid')).toEqual({ type: 'click', target: 'help' })
    expect(resolveShortcut('t', 'geogrid')).toEqual({ type: 'click', target: 'stats' })
    expect(resolveShortcut('n', '')).toBeNull()
    expect(resolveShortcut('s', 'geogrid')).toBeNull()
  })

  it('jiné klávesy nedělají nic', () => {
    expect(resolveShortcut('x', '')).toBeNull()
    expect(resolveShortcut('Enter', 'geogrid')).toBeNull()
  })

  it('každá zkratka z přehledu pro uživatele opravdu existuje', () => {
    const letters = SHORTCUT_SECTIONS.flatMap((s) => s.rows)
      .flatMap((r) => r.keys)
      .filter((k) => /^[A-Z?]$/.test(k))
    const known = [
      resolveShortcut('d', ''),
      resolveShortcut('?', ''),
      resolveShortcut('m', 'atlas'),
      ...['s', 'a', 'l', 'b'].map((k) => resolveShortcut(k, '')),
      ...['n', 'r', 'p', 't'].map((k) => resolveShortcut(k, 'geogrid')),
    ]
    expect(letters).toHaveLength(known.length)
    expect(known.every((a) => a !== null)).toBe(true)
  })
})

describe('isTypingTarget', () => {
  it('textové políčko ano, tlačítko ne', () => {
    const input = document.createElement('input')
    expect(isTypingTarget(input)).toBe(true)
    input.type = 'search'
    expect(isTypingTarget(input)).toBe(true)
    input.type = 'checkbox'
    expect(isTypingTarget(input)).toBe(false)
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true)
    expect(isTypingTarget(document.createElement('select'))).toBe(true)
    expect(isTypingTarget(document.createElement('button'))).toBe(false)
    expect(isTypingTarget(document.body)).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})

describe('findShortcutTarget', () => {
  it('pro přepnutí režimu vrátí ten, který právě není vybraný', () => {
    document.body.innerHTML =
      '<button data-shortcut="mode" aria-pressed="true" id="a"></button><button data-shortcut="mode" aria-pressed="false" id="b"></button><button data-shortcut="new" id="n"></button>'
    expect(findShortcutTarget('mode')?.id).toBe('b')
    expect(findShortcutTarget('new')?.id).toBe('n')
    expect(findShortcutTarget('help')).toBeNull()
  })
})
