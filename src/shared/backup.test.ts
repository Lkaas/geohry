// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyBackup, backupToJson, createBackup, decodeBackup, encodeBackup, mergeValue, summarizeBackup, validateBackup } from './backup'
import { listKeys, loadJson, removeKey, saveJson } from './storage'

beforeEach(() => {
  for (const key of listKeys()) removeKey(key)
})

describe('createBackup', () => {
  it('vezme všechny klíče, ale ne rozehrané denní hry ze starších dnů', () => {
    saveJson('album', { CZE: '2026-11-01' })
    saveJson('stats:mystery:daily', { played: 3 })
    saveJson('daily:mystery:2026-11-15', { status: 'won' })
    saveJson('daily:mystery:2026-11-16', { status: 'playing' })
    const backup = createBackup('2026-11-16')
    expect(Object.keys(backup.data).sort()).toContain('album')
    expect(Object.keys(backup.data)).toContain('daily:mystery:2026-11-16')
    expect(Object.keys(backup.data)).not.toContain('daily:mystery:2026-11-15')
  })
})

describe('kód a soubor', () => {
  it('kód projde tam a zpět, včetně češtiny', () => {
    saveJson('album', { CZE: '2026-11-01' })
    saveJson('poznamka', 'žluťoučký kůň')
    const backup = createBackup('2026-11-16')
    const decoded = decodeBackup(encodeBackup(backup))
    expect(decoded).toEqual(backup)
  })

  it('kód zalomený na víc řádků pořád funguje', () => {
    saveJson('album', { CZE: '2026-11-01' })
    const code = encodeBackup(createBackup('2026-11-16'))
    const wrapped = code.replace(/(.{20})/g, '$1\n  ')
    expect(decodeBackup(wrapped)).not.toBeNull()
  })

  it('obsah staženého souboru se načte také', () => {
    saveJson('album', { CZE: '2026-11-01' })
    const backup = createBackup('2026-11-16')
    expect(decodeBackup(backupToJson(backup))).toEqual(backup)
  })

  it('cizí text, prázdný text a rozbitý kód vrátí null', () => {
    expect(decodeBackup('')).toBeNull()
    expect(decodeBackup('ahoj')).toBeNull()
    expect(decodeBackup('GEOHRY1:%%%')).toBeNull()
    expect(decodeBackup('{"app":"jina-appka","version":1,"data":{}}')).toBeNull()
  })

  it('zálohu s neplatným JSON v hodnotě nebo divným klíčem odmítne', () => {
    expect(validateBackup({ app: 'geohry', version: 1, data: { album: '{nejde' } })).toBeNull()
    expect(validateBackup({ app: 'geohry', version: 1, data: { 'a b/c': '1' } })).toBeNull()
    expect(validateBackup({ app: 'geohry', version: 2, data: {} })).toBeNull()
  })
})

describe('summarizeBackup', () => {
  it('spočítá země a odehrané hry', () => {
    const backup = validateBackup({
      app: 'geohry',
      version: 1,
      exportedAt: '2026-11-16T20:00:00.000Z',
      data: {
        album: JSON.stringify({ CZE: '2026-11-01', SVK: '2026-11-02', xx: '2026-11-02' }),
        'stats:mystery:daily': JSON.stringify({ played: 4 }),
        'stats:mystery:free': JSON.stringify({ played: 6 }),
      },
    })!
    expect(summarizeBackup(backup)).toEqual({ countries: 2, played: 10, exportedAt: '2026-11-16T20:00:00.000Z' })
  })
})

describe('mergeValue', () => {
  it('sbírka: sjednotí země a u společných vezme dřívější datum', () => {
    const merged = mergeValue('album', { CZE: '2026-11-05', SVK: '2026-11-01' }, { CZE: '2026-11-02', POL: '2026-11-03' })
    expect(merged).toEqual({ CZE: '2026-11-02', SVK: '2026-11-01', POL: '2026-11-03' })
  })

  it('sbírka: nepustí klíče, které nejsou kódy zemí (ochrana proti __proto__)', () => {
    const incoming = JSON.parse('{"__proto__":"2026-11-01","CZE":"2026-11-02"}')
    const merged = mergeValue('album', { SVK: '2026-11-01' }, incoming) as Record<string, string>
    expect(Object.keys(merged).sort()).toEqual(['CZE', 'SVK'])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('statistiky: platí ty, kde se hrálo víc', () => {
    expect(mergeValue('stats:mystery:daily', { played: 3, won: 1 }, { played: 5, won: 4 })).toEqual({ played: 5, won: 4 })
    expect(mergeValue('stats:mystery:daily', { played: 7 }, { played: 5 })).toEqual({ played: 7 })
  })

  it('perličky: sjednotí zobrazené země bez duplicit', () => {
    expect(mergeValue('trivia-seen', ['LIE', 'NPL'], ['NPL', 'VAT', 'neplatne'])).toEqual(['LIE', 'NPL', 'VAT'])
  })

  it('slabá místa: u každé země vezme vyšší hodnoty', () => {
    const merged = mergeValue(
      'weak',
      { CHE: { rounds: 3, lost: 2, fixed: 0, last: '2026-11-10' } },
      { CHE: { rounds: 2, lost: 3, fixed: 1, last: '2026-11-12' }, TCD: { rounds: 1, lost: 1, fixed: 0, last: '2026-11-11' } },
    )
    expect(merged).toEqual({
      CHE: { rounds: 3, lost: 3, fixed: 1, last: '2026-11-12' },
      TCD: { rounds: 1, lost: 1, fixed: 0, last: '2026-11-11' },
    })
  })

  it('příznaky: stačí, když byl jeden z nich pravdivý', () => {
    expect(mergeValue('help-seen:mystery', false, true)).toBe(true)
    expect(mergeValue('milestone:x', true, false)).toBe(true)
  })

  it('ostatní: platí místní hodnota; když tu nic není, vezme se záloha', () => {
    expect(mergeValue('theme', 'dark', 'light')).toBe('dark')
    expect(mergeValue('theme', undefined, 'light')).toBe('light')
  })
})

describe('applyBackup', () => {
  const incoming = () =>
    validateBackup({
      app: 'geohry',
      version: 1,
      exportedAt: '',
      data: { album: JSON.stringify({ POL: '2026-11-03' }), theme: JSON.stringify('light') },
    })!

  it('merge: spojí se stávajícím postupem', () => {
    saveJson('album', { CZE: '2026-11-01' })
    saveJson('theme', 'dark')
    applyBackup(incoming(), 'merge')
    expect(loadJson('album', {})).toEqual({ CZE: '2026-11-01', POL: '2026-11-03' })
    expect(loadJson('theme', '')).toBe('dark')
  })

  it('replace: smaže všechno místní a nahraje zálohu', () => {
    saveJson('album', { CZE: '2026-11-01' })
    saveJson('stats:mystery:daily', { played: 9 })
    applyBackup(incoming(), 'replace')
    expect(loadJson('album', {})).toEqual({ POL: '2026-11-03' })
    expect(loadJson('stats:mystery:daily', null)).toBeNull()
    expect(loadJson('theme', '')).toBe('light')
  })
})
