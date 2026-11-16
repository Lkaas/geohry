import { lazy, Suspense, useEffect } from 'react'
import { Home } from './Home'
import { findGame } from './games/registry'
import { EasterEgg } from './shared/components/EasterEgg'
import { FlagRain } from './shared/components/FlagRain'
import { ShortcutsModal } from './shared/components/ShortcutsModal'
import { Toast } from './shared/components/Toast'
import { navigate, useRoute } from './shared/router'
import { findShortcutTarget, isTypingTarget, openShortcuts, resolveShortcut } from './shared/shortcuts'
import { getTheme, otherTheme, setTheme } from './shared/theme'

const CollectionPage = lazy(() => import('./shared/components/CollectionPage'))
const AtlasPage = lazy(() => import('./shared/components/AtlasPage'))
const WeakSpotsPage = lazy(() => import('./shared/components/WeakSpotsPage'))

export function App() {
  useAwayTitle()
  useShortcuts()
  return (
    <>
      <Screen />
      <ShortcutsModal />
      <EasterEgg />
      <FlagRain />
      <Toast />
    </>
  )
}

/** Obrazovka podle adresy: hra, nebo domovská stránka. */
function Screen() {
  const route = useRoute()
  const game = findGame(route)

  if (route === 'sbirka') {
    return (
      <Suspense fallback={<p className="loading">Načítám sbírku…</p>}>
        <CollectionPage />
      </Suspense>
    )
  }

  if (route === 'atlas' || route.startsWith('atlas-')) {
    return (
      <Suspense fallback={<p className="loading">Načítám atlas…</p>}>
        <AtlasPage />
      </Suspense>
    )
  }

  if (route === 'slaba-mista') {
    return (
      <Suspense fallback={<p className="loading">Načítám slabá místa…</p>}>
        <WeakSpotsPage />
      </Suspense>
    )
  }

  if (game?.component) {
    const Game = game.component
    return (
      <Suspense fallback={<p className="loading">Načítám hru…</p>}>
        <Game />
      </Suspense>
    )
  }
  return <Home />
}

/** Když hráč přepne na jinou kartu, titulek se změní. Po návratu se vrátí původní. */
function useAwayTitle() {
  useEffect(() => {
    const original = document.title
    const onChange = () => {
      document.title = document.hidden ? 'Mapa na tebe čeká…' : original
    }
    document.addEventListener('visibilitychange', onChange)
    return () => {
      document.removeEventListener('visibilitychange', onChange)
      document.title = original
    }
  }, [])
}

/** Klávesové zkratky (přehled je v src/shared/shortcuts.ts). Nespouštějí se při psaní ani nad otevřeným oknem. */
function useShortcuts() {
  const route = useRoute()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      if (document.querySelector('dialog[open]')) return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
      // do prázdného políčka se otazník nepíše, tak tam otevře přehled zkratek
      if (isTypingTarget(event.target) && !(key === '?' && (event.target as HTMLInputElement).value === '')) return
      const action = resolveShortcut(key, route)
      if (!action) return
      if (action.type === 'click') {
        const target = findShortcutTarget(action.target)
        if (!target) return
        event.preventDefault()
        target.click()
        return
      }
      event.preventDefault()
      if (action.type === 'navigate') navigate(action.route)
      else if (action.type === 'theme') setTheme(otherTheme(getTheme()))
      else openShortcuts()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [route])
}
