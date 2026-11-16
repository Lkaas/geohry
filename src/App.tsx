import { Suspense } from 'react'
import { Home } from './Home'
import { findGame } from './games/registry'
import { EasterEgg } from './shared/components/EasterEgg'
import { useRoute } from './shared/router'

export function App() {
  return (
    <>
      <Screen />
      <EasterEgg />
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
