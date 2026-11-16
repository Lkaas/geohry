import { Suspense, useEffect } from 'react'
import { Home } from './Home'
import { findGame } from './games/registry'
import { EasterEgg } from './shared/components/EasterEgg'
import { FlagRain } from './shared/components/FlagRain'
import { Toast } from './shared/components/Toast'
import { useRoute } from './shared/router'

export function App() {
  useAwayTitle()
  return (
    <>
      <Screen />
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
