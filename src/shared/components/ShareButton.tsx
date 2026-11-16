import { useState } from 'react'

/**
 * Tlačítko, které zkopíruje text výsledku do schránky.
 * Když prohlížeč kopírování nepovolí, ukáže text v poli, odkud jde zkopírovat ručně.
 */
export function ShareButton({ text, label = 'Zkopírovat výsledek' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('manual')
    }
  }

  return (
    <div className="share">
      <button type="button" className="button button--primary" onClick={copy}>
        {state === 'copied' ? 'Zkopírováno' : label}
      </button>
      {state === 'manual' && (
        <>
          <p className="muted">Kopírování se nepovedlo. Označ text a zkopíruj ho ručně (Ctrl+C).</p>
          <textarea className="share__text" readOnly value={text} rows={5} onFocus={(e) => e.target.select()} />
        </>
      )}
    </div>
  )
}
