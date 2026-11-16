import { useEffect, useRef, useState } from 'react'
import { TOAST_EVENT, type ToastMessage } from '../toast'

const VISIBLE_MS = 5500

/** Krátká zpráva dole na obrazovce. Zobrazuje zprávy z `showToast` (easter eggy). Zmizí sama nebo klikem. */
export function Toast() {
  const [message, setMessage] = useState<ToastMessage | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onToast = (event: Event) => {
      setMessage((event as CustomEvent<ToastMessage>).detail)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setMessage(null), VISIBLE_MS)
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      window.clearTimeout(timer.current)
    }
  }, [])

  if (!message) return null
  return (
    <div className="toast" role="status" onClick={() => setMessage(null)}>
      {message.title && <strong className="toast__title">{message.title}</strong>}
      {message.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
