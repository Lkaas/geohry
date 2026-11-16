import { useState, type ReactNode } from 'react'
import type { GameInfo } from '../../games/registry'
import { loadJson, saveJson } from '../storage'
import { loadStats } from '../stats'
import type { GameMode } from '../types'
import { Emblem } from './Emblem'
import { Modal } from './Modal'
import { SignalFlags } from './SignalFlags'
import { StatsView } from './StatsView'
import { ThemeToggle } from './ThemeToggle'

interface GameShellProps {
  game: GameInfo
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  /** Obsah nápovědy (pravidla s příkladem). Ukáže se sám při prvním spuštění hry. */
  help: ReactNode
  /** Popisek nad rozložením ve statistikách. */
  attemptsLabel?: string
  /** Jak vypsat klíč rozložení ve statistikách (výchozí "3."). */
  formatAttempts?: (attempts: number) => string
  children: ReactNode
}

/** Společný rám každé hry: hlavička s názvem, přepínač Denní výzva / Volná hra, nápověda a statistiky. */
export function GameShell({ game, mode, onModeChange, help, attemptsLabel, formatAttempts, children }: GameShellProps) {
  const helpKey = `help-seen:${game.id}`
  const [showHelp, setShowHelp] = useState(() => !loadJson(helpKey, false))
  const [showStats, setShowStats] = useState(false)

  const closeHelp = () => {
    saveJson(helpKey, true)
    setShowHelp(false)
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <a className="shell__home" href="#" aria-label="Zpět na přehled her">
          <SignalFlags small />
        </a>
        <div className="shell__title">
          <Emblem kind={game.emblem} className="emblem--small" />
          <h1>{game.title}</h1>
        </div>
        <div className="segmented" role="group" aria-label="Režim hry">
          <button type="button" aria-pressed={mode === 'daily'} onClick={() => onModeChange('daily')}>
            Denní výzva
          </button>
          <button type="button" aria-pressed={mode === 'free'} onClick={() => onModeChange('free')}>
            Volná hra
          </button>
        </div>
        <div className="shell__actions">
          <ThemeToggle />
          <button type="button" className="button button--ghost" onClick={() => setShowStats(true)}>
            Statistiky
          </button>
          <button type="button" className="button button--ghost" onClick={() => setShowHelp(true)}>
            Jak hrát
          </button>
        </div>
      </header>
      <main className="shell__main">{children}</main>

      {showHelp && (
        <Modal title={`Jak hrát: ${game.title}`} onClose={closeHelp}>
          <div className="prose">{help}</div>
          <button type="button" className="button button--primary" onClick={closeHelp}>
            Jdu hrát
          </button>
        </Modal>
      )}
      {showStats && (
        <Modal title={`Statistiky: ${game.title}`} onClose={() => setShowStats(false)}>
          <h3 className="stats__mode">Denní výzvy</h3>
          <StatsView stats={loadStats(game.id, 'daily')} attemptsLabel={attemptsLabel} formatAttempts={formatAttempts} />
          <h3 className="stats__mode">Volná hra</h3>
          <StatsView stats={loadStats(game.id, 'free')} attemptsLabel={attemptsLabel} formatAttempts={formatAttempts} />
        </Modal>
      )}
    </div>
  )
}
