import { useEffect, useState } from 'react'
import { SHORTCUTS_EVENT, SHORTCUT_SECTIONS } from '../shortcuts'
import { Modal } from './Modal'

/** Okno s přehledem klávesových zkratek. Otevře se klávesou ? nebo odkazem na úvodní stránce. */
export function ShortcutsModal() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(SHORTCUTS_EVENT, onOpen)
    return () => window.removeEventListener(SHORTCUTS_EVENT, onOpen)
  }, [])
  if (!open) return null
  return (
    <Modal title="Klávesové zkratky" onClose={() => setOpen(false)}>
      <div className="shortcuts">
        {SHORTCUT_SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="panel-heading">{section.title}</h3>
            <dl>
              {section.rows.map((row) => (
                <div key={row.text}>
                  <dt>
                    {row.keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </dt>
                  <dd>{row.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="muted">Zkratky se nespouštějí, když píšeš do políčka.</p>
      </div>
    </Modal>
  )
}
