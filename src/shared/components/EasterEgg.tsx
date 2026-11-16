import { useEffect, useState } from 'react'
import { EASTER_EGG_EVENT, playMelody } from '../easterEgg'

/**
 * Pamětní obrazovka Československa. Je připojená jednou v App.tsx a čeká na událost,
 * kterou vyšle políčko pro zadání země (viz CountryInput a src/shared/easterEgg.ts).
 * Vlajka sjede na půl žerdi (znamení smutku) a hraje česká část československé hymny.
 * Zavře se klávesou Esc, tlačítkem nebo kliknutím kamkoli.
 */
export function EasterEgg() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(EASTER_EGG_EVENT, show)
    return () => window.removeEventListener(EASTER_EGG_EVENT, show)
  }, [])

  useEffect(() => {
    if (!open) return
    const stopMusic = playMelody()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stopMusic()
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null
  return (
    <div className="easter-egg" role="dialog" aria-modal="true" aria-label="Československo" onClick={() => setOpen(false)}>
      <div className="easter-egg__stage">
        {/* vlajka Československa je shodná s dnešní českou; sjede z vrcholu žerdi na půl žerdi */}
        <div className="easter-egg__mast" aria-hidden="true">
          <span className="easter-egg__ball" />
          <img className="easter-egg__flag" src={`${import.meta.env.BASE_URL}flags/cz.svg`} alt="" />
        </div>
        <div className="easter-egg__text">
          <h2>Československo</h2>
          <dl className="easter-egg__dates">
            <div>
              <dt>Vznik</dt>
              <dd>28. 10. 1918</dd>
            </div>
            <div>
              <dt>Zánik</dt>
              <dd>31. 12. 1992</dd>
            </div>
          </dl>
          <p className="easter-egg__note">Hraje Kde domov můj, česká část československé hymny.</p>
          <button type="button" className="easter-egg__close" autoFocus onClick={() => setOpen(false)}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}
