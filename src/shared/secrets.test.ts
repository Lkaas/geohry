import { describe, expect, it } from 'vitest'
import { findCountryExact, normalize, searchCountries } from './normalize'
import { FLAG_MEANINGS, KONAMI, SECRET_WORDS, advanceKonami, findSecretWord, specialDayNote } from './secrets'

describe('tajná slova', () => {
  it('poznají se bez ohledu na diakritiku a velikost písmen', () => {
    expect(findSecretWord('wakanda')?.title).toBe('Wakanda')
    expect(findSecretWord('  ATLANTIDA ')?.title).toBe('Atlantida')
    expect(findSecretWord('mesic')?.title).toBe('Měsíc')
    expect(findSecretWord('sssr')?.title).toBe('Sovětský svaz')
    expect(findSecretWord('Rakousko-Uhersko')?.title).toBe('Rakousko-Uhersko')
    expect(findSecretWord('Rakousko')).toBeUndefined()
    expect(findSecretWord('Německo')).toBeUndefined()
  })
  it('žádné tajné slovo nepatří skutečné zemi ani se nenabízí v našeptávači', () => {
    for (const secret of SECRET_WORDS) {
      for (const name of secret.names) {
        expect(findCountryExact(name), name).toBeUndefined()
        expect(searchCountries(normalize(name)).some((hit) => normalize(hit.matched) === normalize(name)), name).toBe(false)
      }
    }
  })
  it('každé má název a aspoň jednu větu', () => {
    for (const secret of SECRET_WORDS) {
      expect(secret.title.length).toBeGreaterThan(0)
      expect(secret.lines.length).toBeGreaterThan(0)
    }
  })
  it('signální vlajky mají výklad pro G, E, O, H, R, Y v tomto pořadí', () => {
    expect(FLAG_MEANINGS.map(([letter]) => letter).join('')).toBe('GEOHRY')
  })
})

describe('státní svátky', () => {
  it('ukáže větu jen ve vybrané dny', () => {
    expect(specialDayNote(new Date(2026, 9, 28))).toContain('1918')
    expect(specialDayNote(new Date(2026, 10, 17))).toContain('svobodu')
    expect(specialDayNote(new Date(2027, 0, 1))).toContain('Nový rok')
    expect(specialDayNote(new Date(2026, 3, 22))).toContain('Den Země')
    expect(specialDayNote(new Date(2026, 10, 16))).toBeNull()
  })
})

describe('Konami kód', () => {
  const run = (keys: string[]) => keys.reduce(advanceKonami, 0)
  it('celá sekvence dojde na konec', () => {
    expect(run(KONAMI)).toBe(KONAMI.length)
    expect(run([...KONAMI.slice(0, 8), 'B', 'A'])).toBe(KONAMI.length)
  })
  it('chyba začne od začátku, ale nová šipka nahoru se počítá', () => {
    expect(run(['ArrowUp', 'ArrowUp', 'x'])).toBe(0)
    expect(run(['ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'])).toBe(0 + 4)
    expect(run(['a', 'b'])).toBe(0)
  })
})
