import { useEffect, useRef, type ReactNode } from 'react'

/** Modální okno nad stránkou. Zavře se křížkem, klávesou Esc nebo kliknutím mimo. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal__body">
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Zavřít">
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
