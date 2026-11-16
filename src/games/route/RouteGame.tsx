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
import { RouteHelp } from './RouteHelp'
import { GAME_ID, buildShareText, classifyGuess, nextHint, oneShortestPath, pickPuzzle, roundStatus, type GuessKind, type Puzzle } from './logic'
import './route.css'

const game = findGame('cesta')!

export const KIND_COLOR: Record<GuessKind, string> = { shortest: '#1E9E57', near: '#F28C28', off: '#E03A3E' }
const KIND_TEXT: Record<GuessKind, string> = { shortest: 'na nejkratší cestě', near: 'malá zacházka', off: 'mimo cestu' }
const ENDPOINT_COLOR = '#FFCB05'

/** Stav jednoho kola. U denní výzvy se ukládá do localStorage. */
interface RoundState {
  status: DailyStatus
  a: string
  b: string
  /** Tipy v pořadí zadání. */
  guesses: string[]
  /** Země, jejichž obrys si hráč nechal napovědět. */
  hints: string[]
}

function startRound(mode: GameMode, today: string): { puzzle: Puzzle; state: RoundState } {
  const puzzle = pickPuzzle(mode, today)
  if (mode === 'daily') {
    const saved = loadDaily<RoundState>(GAME_ID, today)
    if (saved && saved.a === puzzle.a && saved.b === puzzle.b) return { puzzle, state: saved }
  }
  return { puzzle, state: { status: 'playing', a: puzzle.a, b: puzzle.b, guesses: [], hints: [] } }
}

export default function RouteGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<RouteHelp />} attemptsLabel="Na kolik tipů">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [{ puzzle, state: initial }] = useState(() => startRound(mode, today))
  const [state, setState] = useState<RoundState>(initial)

  const start = getCountry(puzzle.a)
  const goal = getCountry(puzzle.b)
  const finished = state.status !== 'playing'
  const guessesLeft = puzzle.maxGuesses - state.guesses.length
  const usedIds = useMemo(() => new Set([puzzle.a, puzzle.b, ...state.guesses]), [puzzle, state.guesses])
  const kinds = useMemo(() => state.guesses.map((id) => ({ id, kind: classifyGuess(puzzle, id) })), [puzzle, state.guesses])
  // po prohře se ukáže jedna z nejkratších cest
  const solution = useMemo(() => (state.status === 'lost' ? oneShortestPath(puzzle.a, puzzle.b).slice(1, -1) : []), [state.status, puzzle])
  const hintAvailable = !finished && nextHint(puzzle, state.guesses, state.hints) !== undefined

  const update = (next: RoundState) => {
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: next.guesses.length, date: mode === 'daily' ? today : undefined })
      if (next.status === 'won') for (const id of [puzzle.a, puzzle.b]) collectCountry(id, today)
    }
  }

  const guess = (country: Country) => {
    if (finished || usedIds.has(country.id)) return
    const guesses = [...state.guesses, country.id]
    update({ ...state, guesses, status: roundStatus(puzzle, guesses) })
  }

  const showHint = () => {
    const id = nextHint(puzzle, state.guesses, state.hints)
    if (id) update({ ...state, hints: [...state.hints, id] })
  }

  // co je vidět na mapě: start, cíl, tipy, napovězené obrysy a po prohře řešení
  const { fills, labels, visible, ghosts } = useMemo(() => {
    const fills: Record<string, string> = { [puzzle.a]: ENDPOINT_COLOR, [puzzle.b]: ENDPOINT_COLOR }
    const labels: Record<string, string> = { [puzzle.a]: `${start.name} (start)`, [puzzle.b]: `${goal.name} (cíl)` }
    const ghosts = new Set<string>()
    for (const { id, kind } of kinds) {
      fills[id] = KIND_COLOR[kind]
      labels[id] = `${getCountry(id).name}: ${KIND_TEXT[kind]}`
    }
    for (const id of state.hints) if (!fills[id]) ghosts.add(id)
    for (const id of solution) {
      if (fills[id]) continue
      ghosts.add(id)
      labels[id] = `${getCountry(id).name}: nejkratší cesta`
    }
    return { fills, labels, ghosts, visible: new Set([...Object.keys(fills), ...ghosts]) }
  }, [puzzle, start.name, goal.name, kinds, state.hints, solution])

  const shareLabel = mode === 'daily' ? formatDateKey(today) : 'volná hra'
  const perfect = state.status === 'won' && state.guesses.length === puzzle.between && state.hints.length === 0

  return (
    <div className="game route">
      <section className="game__map">
        <WorldMap fills={fills} labels={labels} onlyIds={visible} ghostIds={ghosts} focusIds={[puzzle.a, puzzle.b]} focusKey={`${puzzle.a}-${puzzle.b}`} focusFill={0.6} />
        <ul className="route-legend" aria-hidden="true">
          <li>
            <span className="guess__chip" style={{ background: ENDPOINT_COLOR }} /> start a cíl
          </li>
          {(Object.keys(KIND_COLOR) as GuessKind[]).map((kind) => (
            <li key={kind}>
              <span className="guess__chip" style={{ background: KIND_COLOR[kind] }} /> {KIND_TEXT[kind]}
            </li>
          ))}
        </ul>
      </section>

      <aside className="game__panel">
        <div className="route-task">
          <div className="route-task__end">
            <Flag country={start} className="flag--medium" />
            <strong>{start.name}</strong>
          </div>
          <span className="route-task__arrow" aria-label="do">
            ⟶
          </span>
          <div className="route-task__end">
            <Flag country={goal} className="flag--medium" />
            <strong>{goal.name}</strong>
          </div>
        </div>
        <p className="muted">
          Nejkratší cesta vede přes {puzzle.between} {plural(puzzle.between, 'zemi', 'země', 'zemí')}.
        </p>

        {finished ? (
          <div className="result">
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {state.status === 'won' ? (perfect ? 'Perfektní! Kratší cesta neexistuje.' : 'Cesta je propojená!') : 'Tipy došly'}
            </p>
            <p>
              {state.status === 'won'
                ? `Stačilo ti ${state.guesses.length} ${plural(state.guesses.length, 'tip', 'tipy', 'tipů')} z ${puzzle.maxGuesses}.`
                : 'Jedna z nejkratších cest vede přes:'}
            </p>
            {state.status === 'lost' && (
              <ol className="route-solution">
                {solution.map((id) => (
                  <li key={id}>
                    <Flag country={getCountry(id)} className="flag--small" /> {getCountry(id).name}
                  </li>
                ))}
              </ol>
            )}
            <ShareButton text={buildShareText({ label: shareLabel, puzzle, guesses: state.guesses, hintCount: state.hints.length, won: state.status === 'won' })} />
            {mode === 'free' ? (
              <button type="button" className="button" onClick={onNextRound}>
                Hrát další cestu
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
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Přes kterou zemi cesta vede?" autoFocus />
            <p className="route-left">
              Zbývá <strong>{guessesLeft}</strong> {plural(guessesLeft, 'tip', 'tipy', 'tipů')}.
            </p>
          </>
        )}

        {kinds.length > 0 && (
          <ol className="guess-list">
            {kinds.map(({ id, kind }, i) => (
              <li key={id} className="guess route-guess">
                <span className="guess__chip" style={{ background: KIND_COLOR[kind] }} />
                <Flag country={getCountry(id)} className="flag--small" />
                <span className="guess__name">{getCountry(id).name}</span>
                <span className="guess__distance">{KIND_TEXT[kind]}</span>
                <span className="guess__order">{i + 1}.</span>
              </li>
            ))}
          </ol>
        )}

        {!finished && (
          <div className="give-up">
            <button type="button" className="button button--ghost-dark" onClick={showHint} disabled={!hintAvailable}>
              Napovědět obrys země
            </button>
            {state.hints.length > 0 && <span className="muted">Použité nápovědy: {state.hints.length}</span>}
          </div>
        )}
      </aside>
    </div>
  )
}
