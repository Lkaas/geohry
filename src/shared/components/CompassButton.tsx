import { useState } from 'react'
import { showToast } from '../toast'
import { CompassRose } from './CompassRose'

const JOKE_AT = 7

/** Kompasová růžice na domovské stránce. Klik ji roztočí, sedmý klik v řadě přidá hlášku. */
export function CompassButton() {
  const [spins, setSpins] = useState(0)
  const [clicks, setClicks] = useState(0)

  const onClick = () => {
    setSpins((n) => n + 1)
    const next = clicks + 1
    if (next >= JOKE_AT) {
      setClicks(0)
      showToast({ title: 'Kompas', lines: ['Sever je pořád nahoře, kde je písmeno S. Zkoušel jsem to sedmkrát.'] })
    } else {
      setClicks(next)
    }
  }

  return (
    <button type="button" className="rose-button" aria-label="Kompas, klikni a roztočí se" onClick={onClick}>
      {/* key se mění s každým klikem, takže se animace spustí znovu */}
      <CompassRose key={spins} className={spins > 0 ? 'rose--spin' : ''} />
    </button>
  )
}
