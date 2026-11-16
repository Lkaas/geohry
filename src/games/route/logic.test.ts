import { describe, expect, it } from 'vitest'
import { areNeighbors, getCountry } from '../../shared/data'
import { seededRandom } from '../../shared/random'
import {
  EXTRA_GUESSES, MAX_BETWEEN, MIN_BETWEEN, allPuzzlePairs, buildShareText, classifyGuess, isConnected, makePuzzle, nextHint, oneShortestPath, pickPuzzle,
  roundStatus, stepsFrom,
} from './logic'

describe('stepsFrom', () => {
  it('počítá kroky přes hranice', () => {
    const steps = stepsFrom('CZE')
    expect(steps.get('CZE')).toBe(0)
    expect(steps.get('DEU')).toBe(1)
    expect(steps.get('FRA')).toBe(2)
    expect(steps.get('ESP')).toBe(3)
    expect(steps.get('PRT')).toBe(4)
  })
  it('ostrovní státy a jiné kontinenty jsou nedosažitelné', () => {
    const steps = stepsFrom('CZE')
    expect(steps.has('JPN')).toBe(false)
    expect(steps.has('BRA')).toBe(false)
    expect(steps.has('AUS')).toBe(false)
  })
  it('respektuje omezení na povolené země', () => {
    const steps = stepsFrom('CZE', new Set(['CZE', 'DEU', 'FRA']))
    expect(steps.get('FRA')).toBe(2)
    expect(steps.has('POL')).toBe(false)
  })
  it('Maroko nesousedí s Mauritánií (Západní Sahara není hratelná), cesta vede přes Alžírsko', () => {
    expect(areNeighbors('MAR', 'MRT')).toBe(false)
    expect(stepsFrom('MAR').get('MRT')).toBe(2)
  })
})

describe('makePuzzle', () => {
  it('spočítá délku a limit tipů', () => {
    expect(makePuzzle('CZE', 'PRT')).toEqual({ a: 'CZE', b: 'PRT', between: 3, maxGuesses: 3 + EXTRA_GUESSES })
  })
  it('odmítne sousedy a nespojené země', () => {
    expect(() => makePuzzle('CZE', 'DEU')).toThrow()
    expect(() => makePuzzle('CZE', 'JPN')).toThrow()
  })
})

describe('allPuzzlePairs', () => {
  const pairs = allPuzzlePairs()
  it('obsahuje jen dvojice s 2–6 zeměmi mezi', () => {
    expect(pairs.length).toBeGreaterThan(1000)
    for (const [a, b] of pairs.filter((_, i) => i % 97 === 0)) {
      const between = stepsFrom(a).get(b)! - 1
      expect(between).toBeGreaterThanOrEqual(MIN_BETWEEN)
      expect(between).toBeLessThanOrEqual(MAX_BETWEEN)
    }
  })
  it('neobsahuje ostrovní státy', () => {
    const used = new Set(pairs.flat())
    for (const id of used) expect(getCountry(id).neighbors.length).toBeGreaterThan(0)
    expect(used.has('JPN')).toBe(false)
  })
})

describe('classifyGuess', () => {
  const puzzle = makePuzzle('CZE', 'PRT') // nejkratší: CZE–DEU–FRA–ESP–PRT
  it('země na nejkratší cestě je zelená', () => {
    expect(classifyGuess(puzzle, 'DEU')).toBe('shortest')
    expect(classifyGuess(puzzle, 'FRA')).toBe('shortest')
    expect(classifyGuess(puzzle, 'ESP')).toBe('shortest')
  })
  it('zacházka o jednu zemi je oranžová', () => {
    // CZE–AUT–CHE–FRA–ESP–PRT je o jednu zemi delší
    expect(classifyGuess(puzzle, 'CHE')).toBe('near')
    expect(classifyGuess(puzzle, 'AUT')).toBe('near')
  })
  it('vzdálená nebo nespojená země je červená', () => {
    expect(classifyGuess(puzzle, 'GRC')).toBe('off')
    expect(classifyGuess(puzzle, 'JPN')).toBe('off')
  })
})

describe('isConnected a roundStatus', () => {
  const puzzle = makePuzzle('CZE', 'PRT')
  it('výhra až po propojení celé cesty', () => {
    expect(isConnected(puzzle, ['DEU', 'ESP'])).toBe(false)
    expect(isConnected(puzzle, ['DEU', 'ESP', 'FRA'])).toBe(true)
    expect(roundStatus(puzzle, ['DEU', 'ESP', 'FRA'])).toBe('won')
  })
  it('počítá se i delší cesta', () => {
    expect(isConnected(puzzle, ['AUT', 'CHE', 'FRA', 'ESP'])).toBe(true)
  })
  it('po vyčerpání tipů bez propojení je prohra', () => {
    const wrong = ['GRC', 'ITA', 'POL', 'SVK', 'HUN', 'DNK', 'BEL']
    expect(wrong).toHaveLength(puzzle.maxGuesses)
    expect(roundStatus(puzzle, wrong.slice(0, 6))).toBe('playing')
    expect(roundStatus(puzzle, wrong)).toBe('lost')
  })
  it('poslední tip, který cestu dokončí, je výhra', () => {
    expect(roundStatus(puzzle, ['GRC', 'ITA', 'POL', 'SVK', 'DEU', 'ESP', 'FRA'])).toBe('won')
  })
})

describe('oneShortestPath', () => {
  it('vrací souvislou nejkratší cestu včetně konců', () => {
    const path = oneShortestPath('CZE', 'PRT')
    expect(path[0]).toBe('CZE')
    expect(path[path.length - 1]).toBe('PRT')
    expect(path).toHaveLength(5)
    for (let i = 1; i < path.length; i++) expect(areNeighbors(path[i - 1], path[i])).toBe(true)
  })
})

describe('nextHint', () => {
  const puzzle = makePuzzle('CZE', 'PRT')
  it('napoví zemi z nejkratší cesty nejblíž startu', () => {
    expect(nextHint(puzzle, [], [])).toBe('DEU')
    expect(nextHint(puzzle, ['DEU'], [])).toBe('FRA')
    expect(nextHint(puzzle, ['DEU'], ['FRA'])).toBe('ESP')
  })
  it('když není co napovědět, vrací undefined', () => {
    expect(nextHint(puzzle, ['DEU', 'FRA', 'ESP'], [])).toBeUndefined()
  })
})

describe('pickPuzzle', () => {
  it('denní výzva je deterministická a platná', () => {
    const p = pickPuzzle('daily', '2026-11-16')
    expect(p).toEqual(pickPuzzle('daily', '2026-11-16'))
    expect(p.between).toBeGreaterThanOrEqual(MIN_BETWEEN)
    expect(p.between).toBeLessThanOrEqual(MAX_BETWEEN)
  })
  it('volná hra dává platné hádanky', () => {
    const random = seededRandom(3)
    for (let i = 0; i < 50; i++) {
      const p = pickPuzzle('free', '2026-11-16', random)
      expect(p.maxGuesses).toBe(p.between + EXTRA_GUESSES)
      expect(oneShortestPath(p.a, p.b)).toHaveLength(p.between + 2)
    }
  })
})

describe('buildShareText', () => {
  const puzzle = makePuzzle('CZE', 'PRT')
  it('výhra', () => {
    expect(buildShareText({ label: '16. 11. 2026', puzzle, guesses: ['DEU', 'CHE', 'GRC', 'FRA', 'ESP'], hintCount: 1, won: true })).toBe(
      'GeoHry: Cesta mezi zeměmi (16. 11. 2026)\nČesko → Portugalsko, 5/7 tipů, nejkratší cesta 3\n🟩🟧🟥🟩🟩 💡×1',
    )
  })
  it('prohra', () => {
    const text = buildShareText({ label: 'volná hra', puzzle, guesses: ['GRC'], hintCount: 0, won: false })
    expect(text.split('\n')[1]).toBe('Česko → Portugalsko, nedokončeno (1/7), nejkratší cesta 3')
  })
})
