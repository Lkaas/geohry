import { describe, expect, it } from 'vitest'
import { BEAT_SECONDS, MELODY, isCzechoslovakia, noteToHz } from './easterEgg'
import { searchCountries } from './normalize'

describe('easter egg Československo', () => {
  it('spustí se jen na celé slovo, bez ohledu na diakritiku a velikost písmen', () => {
    expect(isCzechoslovakia('Československo')).toBe(true)
    expect(isCzechoslovakia('  ceskoslovensko ')).toBe(true)
    expect(isCzechoslovakia('ČESKOSLOVENSKO')).toBe(true)
    expect(isCzechoslovakia('Československ')).toBe(false)
    expect(isCzechoslovakia('Česko')).toBe(false)
    expect(isCzechoslovakia('Česko Slovensko')).toBe(false)
  })
  it('našeptávač ho nikdy nenabídne', () => {
    for (const typed of ['ceskos', 'ceskoslov', 'ceskoslovensko']) {
      expect(searchCountries(typed).map((h) => h.country.name)).not.toContain('Československo')
      expect(searchCountries(typed)).toHaveLength(0)
    }
  })
  it('noty se převádí na správné frekvence', () => {
    expect(noteToHz('A4')).toBeCloseTo(440, 5)
    expect(noteToHz('A5')).toBeCloseTo(880, 5)
    expect(noteToHz('C4')).toBeCloseTo(261.63, 1)
    expect(noteToHz('F#4')).toBeCloseTo(369.99, 1)
    expect(noteToHz('r')).toBe(0)
    expect(() => noteToHz('H4')).toThrow()
  })
  it('melodie má platné noty a přesně 17 taktů po 4 dobách', () => {
    expect(MELODY.length).toBeGreaterThan(8)
    for (const [name, beats] of MELODY) {
      expect(noteToHz(name)).toBeGreaterThanOrEqual(0)
      expect(beats).toBeGreaterThan(0)
    }
    expect(MELODY.reduce((sum, [, beats]) => sum + beats, 0)).toBe(68)
  })
  it('první a poslední nota odpovídají zápisu (B4 po předtaktí, závěr na E4)', () => {
    const sounding = MELODY.filter(([name]) => name !== 'r')
    expect(sounding[0][0]).toBe('B4')
    expect(sounding[sounding.length - 1][0]).toBe('E4')
    expect(BEAT_SECONDS).toBeGreaterThan(0.5)
  })
})
