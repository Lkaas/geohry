import { useEffect, useMemo, useRef, useState } from 'react'
import { findGame } from '../registry'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { getCountry } from '../../shared/data'
import { dateKey, formatDateKey } from '../../shared/random'
import { loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'
import { HigherLowerHelp } from './HigherLowerHelp'
import { GAME_ID, PARAMS, WIN_STREAK, buildShareText, correctAnswer, dailyParam, finalStatus, pickSequence, valueOf, type Answer, type Param } from './logic'
import './higherlower.css'

const game = findGame('vic-nebo-min')!
/** Jak dlouho zůstane vidět správně zodpovězená dvojice, než přijde další (ms). */
const REVEAL_MS = 1300

/** Stav kola. U denní výzvy se ukládá do localStorage po každé správné odpovědi. */
interface RoundState {
  status: DailyStatus
  paramId: string
  /** Počet správných odpovědí v řadě. */
  streak: number
}

export default function HigherLowerGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  const [freeParam, setFreeParam] = useState<Param>(PARAMS[0])
  const today = useMemo(() => dateKey(), [])
  const param = mode === 'daily' ? dailyParam(today) : freeParam

  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<HigherLowerHelp />} attemptsLabel="Délka série" formatAttempts={(n) => String(n)}>
      <div className="hl">
        {mode === 'free' ? (
          <div className="hl__params" role="group" aria-label="Téma">
            {PARAMS.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={p.id === param.id} onClick={() => setFreeParam(p)}>
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="hl__daily-param">
            Dnešní téma: <strong>{param.label}</strong>. Ostatní témata si vyber ve volné hře.
          </p>
        )}
        <Round key={`${mode}-${param.id}-${roundNumber}`} mode={mode} param={param} today={today} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
      </div>
    </GameShell>
  )
}

interface RoundProps {
  mode: GameMode
  param: Param
  today: string
  onNextRound: () => void
  onPlayFree: () => void
}

function Round({ mode, param, today, onNextRound, onPlayFree }: RoundProps) {
  const sequence = useMemo(() => pickSequence(mode, param, today), [mode, param, today])
  const [state, setState] = useState<RoundState>(() => {
    const saved = mode === 'daily' ? loadDaily<RoundState>(GAME_ID, today) : null
    return saved && saved.paramId === param.id ? saved : { status: 'playing', paramId: param.id, streak: 0 }
  })
  /** Odpověď na aktuální dvojici, dokud je odkrytá. */
  const [reveal, setReveal] = useState<{ correct: boolean } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const lastIndex = sequence.length - 1
  const finished = state.status !== 'playing'
  const completed = state.streak >= lastIndex
  // po dohrání zůstává vidět poslední dvojice
  const index = Math.min(state.streak, lastIndex - 1)
  const first = getCountry(sequence[index])
  const second = getCountry(sequence[index + 1])
  const showSecondValue = reveal !== null || finished

  const persist = (next: RoundState) => {
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: next.streak, date: mode === 'daily' ? today : undefined })
  }

  const answer = (choice: Answer) => {
    if (finished || reveal) return
    const correct = choice === correctAnswer(param, first.id, second.id)
    setReveal({ correct })
    if (!correct) {
      persist({ ...state, status: finalStatus(state.streak) })
      return
    }
    const streak = state.streak + 1
    if (streak >= lastIndex) {
      persist({ ...state, streak, status: 'won' })
      return
    }
    // chvíli nechat vidět správnou hodnotu, pak další dvojice
    timer.current = window.setTimeout(() => {
      persist({ ...state, streak })
      setReveal(null)
    }, REVEAL_MS)
  }

  const secondState = !showSecondValue ? '' : completed || reveal?.correct ? ' hl__card--right' : finished ? ' hl__card--wrong' : ''

  return (
    <>
      <div className="hl__head">
        <h2>{param.question}</h2>
        <p className="hl__streak">
          Série: <strong>{state.streak}</strong>
        </p>
      </div>
      <div className="hl__cards">
        <div className="hl__card">
          <Flag country={first} className="hl__flag" />
          <h3>{first.name}</h3>
          <p className="hl__value">{param.format(valueOf(param, first.id))}</p>
        </div>
        <div className={'hl__card' + secondState}>
          <Flag country={second} className="hl__flag" />
          <h3>{second.name}</h3>
          {showSecondValue ? (
            <p className="hl__value" aria-live="polite">
              {param.format(valueOf(param, second.id))}
            </p>
          ) : (
            <div className="hl__buttons">
              <button type="button" className="button button--primary" onClick={() => answer('more')}>
                ▲ {param.more}
              </button>
              <button type="button" className="button" onClick={() => answer('less')}>
                ▼ {param.less}
              </button>
            </div>
          )}
        </div>
      </div>

      {finished && (
        <div className="hl__result">
          <div className="result">
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {completed ? 'Bez jediné chyby až do konce!' : state.status === 'won' ? 'Pěkná série!' : 'Konec série'}
            </p>
            <h2 className="result__country">Série {state.streak}</h2>
            {!completed && (
              <p className="muted">
                {second.name}: {param.format(valueOf(param, second.id))}, {first.name}: {param.format(valueOf(param, first.id))}.
                {mode === 'daily' && ` Denní výzva se počítá jako splněná od série ${WIN_STREAK}.`}
              </p>
            )}
          </div>
          <div className="hl__actions">
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', param, state.streak, completed)} />
            {mode === 'free' ? (
              <button type="button" className="button" data-shortcut="new" onClick={onNextRound}>
                Hrát znovu
              </button>
            ) : (
              <button type="button" className="button" data-shortcut="new" onClick={onPlayFree}>
                Hrát volnou hru
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
