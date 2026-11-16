import { useMemo, useState } from 'react'
import { findGame } from '../registry'
import { CountryInput } from '../../shared/components/CountryInput'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { WorldMap } from '../../shared/components/WorldMap'
import { getCountry } from '../../shared/data'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import { plural } from '../../shared/text'
import type { Country, GameMode } from '../../shared/types'
import { NeighborsHelp } from './NeighborsHelp'
import { GAME_ID, MAX_MISTAKES, buildShareText, evaluate, isOverseasBorder, neighborsOf, pickTarget } from './logic'

const game = findGame('sousede')!
const COLORS = { target: '#FFCB05', found: '#1E9E57', mistake: '#E03A3E' }

/** Stav kola. U denní výzvy se ukládá do localStorage. */
interface RoundState {
  status: DailyStatus
  targetId: string
  /** Tipy v pořadí zadání (správné i špatné). */
  guesses: string[]
}

function startRound(mode: GameMode, today: string): RoundState {
  const targetId = pickTarget(mode, today)
  if (mode === 'daily') {
    const saved = loadDaily<RoundState>(GAME_ID, today)
    if (saved && saved.targetId === targetId) return saved
  }
  return { status: 'playing', targetId, guesses: [] }
}

export default function NeighborsGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<NeighborsHelp />} attemptsLabel="S kolika chybami" formatAttempts={(n) => `${n}×`}>
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  const target = getCountry(state.targetId)
  const progress = useMemo(() => evaluate(state.targetId, state.guesses), [state])
  const finished = state.status !== 'playing'
  const neighbors = useMemo(() => neighborsOf(state.targetId), [state.targetId])
  const total = neighbors.length
  const livesLeft = MAX_MISTAKES - progress.mistakes.length
  const usedIds = useMemo(() => new Set([state.targetId, ...state.guesses]), [state])
  const last = state.guesses[state.guesses.length - 1]

  const guess = (country: Country) => {
    if (finished || usedIds.has(country.id)) return
    const guesses = [...state.guesses, country.id]
    const result = evaluate(state.targetId, guesses)
    const next: RoundState = { ...state, guesses, status: result.status }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (result.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: result.status === 'won', attempts: result.mistakes.length, date: mode === 'daily' ? today : undefined })
      if (result.status === 'won') collectCountry(state.targetId, today)
    }
  }

  // na mapě: hledaná země, nalezení sousedé, špatné tipy; po prohře čárkovaně chybějící sousedé
  const { fills, labels, visible, ghosts } = useMemo(() => {
    const fills: Record<string, string> = { [state.targetId]: COLORS.target }
    const labels: Record<string, string> = { [state.targetId]: target.name }
    for (const id of progress.found) {
      fills[id] = COLORS.found
      labels[id] = `${getCountry(id).name}: soused${isOverseasBorder(state.targetId, id) ? ' (přes zámořské území)' : ''}`
    }
    for (const id of progress.mistakes) {
      fills[id] = COLORS.mistake
      labels[id] = `${getCountry(id).name}: nesousedí`
    }
    const ghosts = new Set<string>(finished ? progress.missing : [])
    for (const id of ghosts) labels[id] = `${getCountry(id).name}: chyběl`
    return { fills, labels, ghosts, visible: new Set([...Object.keys(fills), ...ghosts]) }
  }, [state.targetId, target.name, progress, finished])

  return (
    <div className="game">
      <section className="game__map">
        <WorldMap fills={fills} labels={labels} onlyIds={visible} ghostIds={ghosts} focusIds={[state.targetId, ...target.neighbors]} focusKey={state.targetId} focusFill={0.7} />
        <ul className="route-legend" aria-hidden="true">
          <li>
            <span className="guess__chip" style={{ background: COLORS.target }} /> zadaná země
          </li>
          <li>
            <span className="guess__chip" style={{ background: COLORS.found }} /> soused
          </li>
          <li>
            <span className="guess__chip" style={{ background: COLORS.mistake }} /> nesousedí
          </li>
        </ul>
      </section>

      <aside className="game__panel">
        <div className="border__task">
          <Flag country={target} className="flag--medium" />
          <div>
            <p className="muted">Vyjmenuj sousedy země</p>
            <h2 className="result__country">{target.name}</h2>
          </div>
        </div>
        <p>
          Nalezeno <strong>{progress.found.length}</strong> z {total} {plural(total, 'souseda', 'sousedů', 'sousedů')}.
          {!finished && ` Zbývá ${livesLeft} ${plural(livesLeft, 'chyba', 'chyby', 'chyb')}.`}
        </p>

        {finished ? (
          <div className="result">
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {state.status === 'won' ? (progress.mistakes.length === 0 ? 'Všichni sousedé bez chyby!' : 'Všichni sousedé nalezeni!') : 'Tři chyby, konec'}
            </p>
            {state.status === 'lost' && (
              <>
                <p>Chyběli:</p>
                <ul className="plain-list">
                  {progress.missing.map((id) => (
                    <li key={id}>
                      <Flag country={getCountry(id)} className="flag--small" /> {getCountry(id).name}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', state.targetId, state.guesses)} />
            {mode === 'free' ? (
              <button type="button" className="button" onClick={onNextRound}>
                Hrát další zemi
              </button>
            ) : (
              <>
                <p className="muted">Další denní výzva bude zítra.</p>
                <button type="button" className="button" onClick={onPlayFree}>
                  Hrát volnou hru
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Se kterou zemí sousedí?" autoFocus />
            {last && (
              <p className={`geogrid__feedback geogrid__feedback--${neighbors.includes(last) ? 'hit' : 'miss'}`} aria-live="polite">
                {!neighbors.includes(last)
                  ? `${getCountry(last).name} se zemí ${target.name} nesousedí.`
                  : isOverseasBorder(state.targetId, last)
                    ? `${getCountry(last).name}: ano, soused přes zámořské území.`
                    : `${getCountry(last).name}: ano, soused.`}
              </p>
            )}
          </>
        )}

        {state.guesses.length > 0 && (
          <ol className="guess-list">
            {state.guesses.map((id, i) => {
              const hit = neighbors.includes(id)
              return (
                <li key={id} className="guess">
                  <span className="guess__chip" style={{ background: hit ? COLORS.found : COLORS.mistake }} />
                  <Flag country={getCountry(id)} className="flag--small" />
                  <span className="guess__name">{getCountry(id).name}</span>
                  <span className="guess__distance muted">{!hit ? 'nesousedí' : isOverseasBorder(state.targetId, id) ? 'soused v zámoří' : 'soused'}</span>
                  <span className="guess__order">{i + 1}.</span>
                </li>
              )
            })}
          </ol>
        )}
      </aside>
    </div>
  )
}
