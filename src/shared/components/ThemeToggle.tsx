import { useTheme } from '../theme'

/** Tlačítko pro přepnutí mezi světlým a tmavým režimem (noční mapa). */
export function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const dark = theme === 'dark'
  return (
    <button type="button" className="button button--ghost" aria-pressed={dark} onClick={toggle}>
      {dark ? 'Světlý režim' : 'Tmavý režim'}
    </button>
  )
}
