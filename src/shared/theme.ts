// Světlý / tmavý režim. Volba se pamatuje v prohlížeči a zapíná se tlačítkem (ThemeToggle).
// Režim je atribut data-theme na <html>, barvy podle něj přepíná CSS (viz :root v base.css).
import { useSyncExternalStore } from 'react'
import { loadJson, saveJson } from './storage'

export type Theme = 'light' | 'dark'

const KEY = 'theme'
const listeners = new Set<() => void>()

/** Platná hodnota z úložiště, jinak světlý režim. */
export function parseTheme(value: unknown): Theme {
  return value === 'dark' ? 'dark' : 'light'
}

export function getTheme(): Theme {
  return parseTheme(loadJson<unknown>(KEY, 'light'))
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

function apply(theme: Theme): void {
  if (theme === 'dark') document.documentElement.dataset.theme = 'dark'
  else delete document.documentElement.dataset.theme
}

export function setTheme(theme: Theme): void {
  saveJson(KEY, theme)
  apply(theme)
  listeners.forEach((listener) => listener())
}

/** Zavolá se jednou při startu: nastaví režim uložený z minula. */
export function initTheme(): void {
  apply(getTheme())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** [aktuální režim, přepnutí na druhý]. */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light' as Theme)
  return [theme, () => setTheme(otherTheme(theme))]
}
