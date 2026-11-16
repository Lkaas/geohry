import { describe, expect, it } from 'vitest'
import { COUNTRIES } from './data'
import { flagFacts, flagOfDay } from './flagOfDay'
import { dateKey } from './random'

describe('flagFacts', () => {
  it('věty jsou celé a bez chybějících hodnot', () => {
    let withFacts = 0
    for (const country of COUNTRIES) {
      const facts = flagFacts(country)
      if (facts.length > 0) withFacts++
      for (const fact of facts) {
        expect(fact, country.id).not.toMatch(/undefined|NaN|null|\{|\}/)
        expect(fact.endsWith('.'), fact).toBe(true)
      }
    }
    expect(withFacts).toBeGreaterThan(20)
  })

  it('největší a nejlidnatější země mají o tom větu', () => {
    expect(flagFacts(COUNTRIES.find((c) => c.id === 'RUS')!).join(' ')).toContain('Je 1. největší země')
    expect(flagFacts(COUNTRIES.find((c) => c.id === 'VAT')!).join(' ')).toContain('nejmenší země')
  })
})

describe('flagOfDay', () => {
  it('je stejná pro stejný den a nikdy nevybere vyloučenou zemi', () => {
    const start = new Date(Date.UTC(2026, 0, 1))
    for (let i = 0; i < 400; i++) {
      const key = dateKey(new Date(start.getTime() + i * 86_400_000))
      const a = flagOfDay(key)
      expect(flagOfDay(key).country.id).toBe(a.country.id)
      expect(a.fact.length).toBeGreaterThan(10)
      const b = flagOfDay(key, new Set([a.country.id]))
      expect(b.country.id).not.toBe(a.country.id)
    }
  })
})
