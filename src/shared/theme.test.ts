// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { getTheme, initTheme, otherTheme, parseTheme, setTheme } from './theme'

describe('světlý / tmavý režim', () => {
  beforeEach(() => {
    setTheme('light')
  })
  it('neplatná hodnota znamená světlý režim', () => {
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('cokoli')).toBe('light')
    expect(parseTheme(null)).toBe('light')
    expect(parseTheme(42)).toBe('light')
  })
  it('přepíná na druhý režim', () => {
    expect(otherTheme('light')).toBe('dark')
    expect(otherTheme('dark')).toBe('light')
  })
  it('volba se uloží a promítne do atributu na <html>', () => {
    setTheme('dark')
    expect(getTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    document.documentElement.removeAttribute('data-theme')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
