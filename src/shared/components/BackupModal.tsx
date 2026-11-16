import { useMemo, useState } from 'react'
import { applyBackup, backupToJson, createBackup, decodeBackup, encodeBackup, summarizeBackup, type BackupFile } from '../backup'
import { dateKey, formatDateKey } from '../random'
import { Modal } from './Modal'

/** Záloha a přenos postupu: uložit do kódu nebo souboru, načíst na jiném zařízení. */
export function BackupModal({ onClose, onApplied = () => window.location.reload() }: { onClose: () => void; onApplied?: () => void }) {
  const today = dateKey()
  // záloha se vytvoří při otevření okna: odpovídá stavu v tu chvíli
  const backup = useMemo(() => createBackup(today), [today])
  const code = useMemo(() => encodeBackup(backup), [backup])
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [done, setDone] = useState(false)

  const incoming: BackupFile | null = useMemo(() => (pasted.trim() ? decodeBackup(pasted) : null), [pasted])
  const summary = incoming ? summarizeBackup(incoming) : null
  const mine = useMemo(() => summarizeBackup(backup), [backup])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // schránka není dostupná: kód je ve vedlejším poli, jde označit ručně
      document.querySelector<HTMLTextAreaElement>('.backup__code')?.select()
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([backupToJson(backup)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `geohry-postup-${today}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const readFile = async (file: File | undefined) => {
    if (file) setPasted(await file.text())
  }

  const apply = (mode: 'merge' | 'replace') => {
    if (!incoming) return
    if (mode === 'replace' && !window.confirm('Opravdu nahradit postup na tomto zařízení? Co tu teď je, se smaže.')) return
    applyBackup(incoming, mode)
    setDone(true)
    window.setTimeout(onApplied, 900)
  }

  return (
    <Modal title="Záloha postupu" onClose={onClose}>
      <div className="backup">
        <section>
          <h3 className="panel-heading">Uložit</h3>
          <p>
            Tady je tvůj postup: {mine.countries} zemí ve sbírce, {mine.played} odehraných her. Pošli si kód do zprávy, nebo si stáhni soubor. Na
            jiném zařízení ho načteš níž.
          </p>
          <textarea className="backup__code" readOnly rows={3} value={code} aria-label="Kód zálohy" onFocus={(e) => e.currentTarget.select()} />
          <div className="backup__buttons">
            <button type="button" className="button button--primary" onClick={copy}>
              {copied ? 'Zkopírováno' : 'Zkopírovat kód'}
            </button>
            <button type="button" className="button" onClick={download}>
              Stáhnout soubor
            </button>
          </div>
        </section>

        <section>
          <h3 className="panel-heading">Načíst</h3>
          <p>Vlož kód ze zálohy nebo vyber stažený soubor.</p>
          <textarea
            className="backup__code"
            rows={3}
            value={pasted}
            placeholder="GEOHRY1:…"
            aria-label="Vložený kód zálohy"
            onChange={(e) => setPasted(e.target.value)}
          />
          <label className="backup__file">
            <span className="muted">Nebo soubor:</span>
            <input type="file" accept=".json,application/json,text/plain" onChange={(e) => void readFile(e.target.files?.[0])} />
          </label>
          {pasted.trim() && !incoming && <p className="backup__error">Tohle není záloha GeoHer. Zkontroluj, že je kód celý.</p>}
          {summary && !done && (
            <>
              <p className="backup__preview">
                Nalezeno: {summary.countries} zemí a {summary.played} odehraných her
                {summary.exportedAt ? `, uloženo ${formatDateKey(summary.exportedAt.slice(0, 10))}` : ''}.
              </p>
              <div className="backup__buttons">
                <button type="button" className="button button--primary" onClick={() => apply('merge')}>
                  Sloučit s tímto zařízením
                </button>
                <button type="button" className="button button--danger" onClick={() => apply('replace')}>
                  Nahradit postup
                </button>
              </div>
              <p className="muted">Sloučení nic nesmaže: spojí sbírky a nechá statistiky z toho, kde se hrálo víc. Nahrazení smaže místní postup.</p>
            </>
          )}
          {done && <p className="backup__preview">Hotovo. Stránka se načte znovu.</p>}
        </section>
      </div>
    </Modal>
  )
}
