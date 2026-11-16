import { useMemo, useState } from 'react'
import { findGame } from '../registry'
import { CountryInput } from '../../shared/components/CountryInput'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { getCountry } from '../../shared/data'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import { recordRound } from '../../shared/weak'
import { plural } from '../../shared/text'
import type { Country, GameMode } from '../../shared/types'
import { FlagCluesHelp } from './FlagCluesHelp'
import { GAME_ID, buildShareText, matchingCountries, pickTarget, roundStatus, selectClues, visibleClueCount, type Guess } from './logic'
import './flagclues.css'

const game = findGame('tajemna-vlajka')!

/** Stav kola. U denní výzvy se ukládá do localStorage. */
interface RoundState {
  status: DailyStatus
  targetId: string
  /** Tipy v pořadí: kód země, nebo null = další nápověda bez tipu. */
  guesses: Guess[]
}

function startRound(mode: GameMode, today: string): RoundState {
  const targetId = pickTarget(mode, today)
  if (mode === 'daily') {
    const saved = loadDaily<RoundState>(GAME_ID, today)
    if (saved && saved.targetId === targetId) return saved
  }
  return { status: 'playing', targetId, guesses: [] }
}

export default function FlagCluesGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<FlagCluesHelp />} attemptsLabel="Na kolikátou nápovědu">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  const target = getCountry(state.targetId)
  const clues = useMemo(() => selectClues(state.targetId), [state.targetId])
  const finished = state.status !== 'playing'
  const visible = finished ? clues.length : visibleClueCount(state.guesses, clues.length)
  const shown = clues.slice(0, visible)
  const candidates = useMemo(() => matchingCountries(shown).length, [shown])
  const usedIds = useMemo(() => new Set(state.guesses.filter((g): g is string => g !== null)), [state.guesses])
  const onLastClue = visible >= clues.length

  const push = (guess: Guess) => {
    if (finished) return
    const guesses = [...state.guesses, guess]
    const next: RoundState = { ...state, guesses, status: roundStatus(state.targetId, guesses, clues.length) }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: guesses.length, date: mode === 'daily' ? today : undefined })
      if (next.status === 'won') collectCountry(state.targetId, today)
      recordRound(state.targetId, next.status !== 'won', today)
    }
  }
  const guess = (country: Country) => {
    if (!usedIds.has(country.id)) push(country.id)
  }

  return (
    <div className="game flagclues">
      <section className="flagclues__main">
        <div className="flagclues__flag">
          {finished ? <Flag country={target} className="flagclues__image" decorative={false} /> : <span aria-label="Neznámá vlajka">?</span>}
        </div>
        <ol className="flagclues__clues">
          {clues.map((clue, i) => (
            <li key={clue.id} className={i < visible ? (i === visible - 1 && !finished ? 'flagclues__clue flagclues__clue--new' : 'flagclues__clue') : 'flagclues__clue flagclues__clue--hidden'}>
              {i < visible ? clue.text : 'Další nápověda se odkryje po tipu.'}
            </li>
          ))}
        </ol>
      </section>

      <aside className="game__panel">
        {finished ? (
          <div className="result">
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {state.status === 'won' ? `Správně na ${state.guesses.length}. nápovědu!` : 'Nápovědy došly. Byla to vlajka země'}
            </p>
            <h2 className="result__country">{target.name}</h2>
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', state.targetId, state.guesses, clues.length)} />
            {mode === 'free' ? (
              <button type="button" className="button" data-shortcut="new" onClick={onNextRound}>
                Hrát další vlajku
              </button>
            ) : (
              <>
                <p className="muted">Další denní výzva bude zítra.</p>
                <button type="button" className="button" data-shortcut="new" onClick={onPlayFree}>
                  Hrát volnou hru
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p>
              Nápověda <strong>{visible}</strong> z {clues.length}. Všem zatím odpovídá{' '}
              <strong>
                {candidates} {plural(candidates, 'vlajka', 'vlajky', 'vlajek')}
              </strong>
              .
            </p>
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Čí je to vlajka?" autoFocus />
            <button type="button" className="button button--ghost-dark" onClick={() => push(null)}>
              {onLastClue ? 'Vzdát to a ukázat vlajku' : 'Další nápověda bez tipu'}
            </button>
          </>
        )}

        {state.guesses.length > 0 && (
          <ol className="guess-list">
            {state.guesses.map((g, i) => {
              if (g === null) {
                return (
                  <li key={i} className="guess flagclues__guess">
                    <span />
                    <span className="guess__name muted">bez tipu</span>
                    <span />
                    <span className="guess__order">{i + 1}.</span>
                  </li>
                )
              }
              const country = getCountry(g)
              // kolik z nápověd, které byly vidět v okamžiku tipu, tipovaná vlajka splňuje
              const seen = clues.slice(0, Math.min(clues.length, i + 1))
              const fits = seen.filter((clue) => clue.test(country)).length
              return (
                <li key={i} className="guess flagclues__guess">
                  <Flag country={country} className="flag--small" />
                  <span className="guess__name">{country.name}</span>
                  <span className="guess__distance muted">{g === state.targetId ? 'správně' : `sedí na ${fits} z ${seen.length}`}</span>
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
