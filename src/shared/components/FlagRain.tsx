import { useEffect, useState } from 'react'
import { advanceKonami, KONAMI } from '../secrets'
import { showToast } from '../toast'
import { signalFlagSvgs } from './SignalFlags'

const RAIN_MS = 6000
const COUNT = 36

/** Pseudonáhodné, ale stabilní hodnoty pro jeden déšť (aby se při překreslení vlajky neposouvaly). */
function makeDrops() {
  const flags = signalFlagSvgs('#0b3d91', '#d62828', '#ffd23f')
  return Array.from({ length: COUNT }, (_, i) => ({
    flag: flags[i % flags.length],
    left: Math.random() * 96,
    delay: Math.random() * 2.2,
    duration: 2.6 + Math.random() * 2,
    size: 28 + Math.random() * 28,
    spin: (Math.random() - 0.5) * 120,
  }))
}

/** Konami kód (↑ ↑ ↓ ↓ ← → ← → B A) kdekoli na stránce pustí déšť signálních vlajek. */
export function FlagRain() {
  const [drops, setDrops] = useState<ReturnType<typeof makeDrops> | null>(null)

  useEffect(() => {
    let progress = 0
    let timer: number | undefined
    const onKey = (event: KeyboardEvent) => {
      // do textových políček se píše normálně, ale kód se sleduje všude
      progress = advanceKonami(progress, event.key)
      if (progress < KONAMI.length) return
      progress = 0
      showToast({ title: 'Vlajky nahoru!', lines: ['Našel jsi tajný kód. Takhle se na lodi zdraví celý přístav.'] })
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      setDrops(makeDrops())
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setDrops(null), RAIN_MS)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer)
    }
  }, [])

  if (!drops) return null
  return (
    <div className="flag-rain" aria-hidden="true">
      {drops.map((drop, i) => (
        <span
          key={i}
          className="flag-rain__drop"
          style={
            {
              left: `${drop.left}%`,
              width: drop.size,
              height: drop.size,
              animationDelay: `${drop.delay}s`,
              animationDuration: `${drop.duration}s`,
              '--spin': `${drop.spin}deg`,
            } as React.CSSProperties
          }
        >
          {drop.flag}
        </span>
      ))}
    </div>
  )
}
