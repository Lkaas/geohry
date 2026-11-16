import { useMemo, useState } from 'react'
import { findGame } from '../registry'
import { CountryInput } from '../../shared/components/CountryInput'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { WorldMap } from '../../shared/components/WorldMap'
import { getCountry } from '../../shared/data'
import { formatKm, formatNumber } from '../../shared/geo'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import type { Country, GameMode } from '../../shared/types'
import { MysteryHelp } from './MysteryHelp'
import { CORRECT_COLOR, GAME_ID, buildShareText, evaluateAll, guessColor, pickTarget, plural, sortByDistance, type RankedGuess } from './logic'
import './mystery.css'

const game = findGame('tajemna-zeme')!

/** Stav jednoho kola. U denní výzvy se ukládá do localStorage, takže přežije zavření stránky. */
interface RoundState {
  status: DailyStatus
  targetId: string
  /** Kódy tipovaných zemí v pořadí zadání. */
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

export default function MysteryGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  // číslo kola: změna vynutí nové kolo volné hry
  const [roundNumber, setRoundNumber] = useState(0)

  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<MysteryHelp />} attemptsLabel="Na kolikátý tip">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  const [confirmGiveUp, setConfirmGiveUp] = useState(false)

  const target = getCountry(state.targetId)
  const finished = state.status !== 'playing'
  const guesses = useMemo(() => evaluateAll(state.targetId, state.guesses), [state])
  const sorted = useMemo(() => sortByDistance(guesses), [guesses])
  const last = guesses[guesses.length - 1]
  const usedIds = useMemo(() => new Set(state.guesses), [state.guesses])

  const update = (next: RoundState) => {
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: next.guesses.length, date: mode === 'daily' ? today : undefined })
      if (next.status === 'won') collectCountry(next.targetId, today)
    }
  }

  const guess = (country: Country) => {
    if (finished || usedIds.has(country.id)) return
    const nextGuesses = [...state.guesses, country.id]
    update({ ...state, guesses: nextGuesses, status: country.id === state.targetId ? 'won' : 'playing' })
    setConfirmGiveUp(false)
  }

  const giveUp = () => update({ ...state, status: 'lost' })

  // barvy a popisky na mapě
  const { fills, labels } = useMemo(() => {
    const fills: Record<string, string> = {}
    const labels: Record<string, string> = {}
    for (const g of guesses) {
      fills[g.id] = guessColor(g)
      labels[g.id] = `${getCountry(g.id).name}: ${distanceText(g)}`
    }
    if (finished) {
      fills[state.targetId] = CORRECT_COLOR
      labels[state.targetId] = `${target.name}: hledaná země`
    }
    return { fills, labels }
  }, [guesses, finished, state.targetId, target.name])

  const outline = useMemo(() => (finished ? new Set([state.targetId]) : undefined), [finished, state.targetId])
  const shareLabel = mode === 'daily' ? formatDateKey(today) : 'volná hra'

  return (
    <div className="game mystery">
      <section className="game__map">
        <WorldMap fills={fills} labels={labels} outlineIds={outline} focusIds={finished ? [state.targetId] : undefined} focusKey={finished ? 'done' : undefined} />
        <div className="heat-legend" aria-hidden="true">
          <span>daleko</span>
          <div className="heat-legend__bar" />
          <span>blízko</span>
        </div>
      </section>

      <aside className="game__panel">
        {finished ? (
          <div className="result">
            <Flag country={target} className="flag--large" decorative={false} />
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>{state.status === 'won' ? 'Správně!' : 'Hledaná země byla'}</p>
            <h2 className="result__country">{target.name}</h2>
            <p className="muted">
              {target.continent}, hlavní město {target.capital}, {formatNumber(target.population)} obyvatel
            </p>
            <p>
              {state.status === 'won'
                ? `Uhodnuto na ${guesses.length}. tip.`
                : `Vzdáno po ${guesses.length} ${plural(guesses.length, 'tipu', 'tipech', 'tipech')}.`}
            </p>
            <ShareButton text={buildShareText({ label: shareLabel, guesses, gaveUp: state.status === 'lost' })} />
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
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Napiš zemi a potvrď Enterem" autoFocus />
            <Feedback last={last} count={guesses.length} />
          </>
        )}

        {sorted.length > 0 && (
          <>
            <h3 className="panel-heading">
              {guesses.length} {plural(guesses.length, 'tip', 'tipy', 'tipů')}, od nejbližšího
            </h3>
            <ol className="guess-list">
              {sorted.map((g) => (
                <GuessRow key={g.id} guess={g} newest={g.order === guesses.length && !finished} />
              ))}
            </ol>
          </>
        )}

        {!finished && guesses.length > 0 && (
          <div className="give-up">
            {confirmGiveUp ? (
              <>
                <span>Opravdu to chceš vzdát?</span>
                <button type="button" className="button button--danger" onClick={giveUp}>
                  Vzdát a ukázat zemi
                </button>
                <button type="button" className="button button--ghost-dark" onClick={() => setConfirmGiveUp(false)}>
                  Hrát dál
                </button>
              </>
            ) : (
              <button type="button" className="button button--ghost-dark" onClick={() => setConfirmGiveUp(true)}>
                Vzdát to
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

function distanceText(g: RankedGuess): string {
  if (g.correct) return 'hledaná země'
  if (g.neighbor) return 'sousedí'
  return formatKm(g.km)
}

/** Velká zpráva o posledním tipu: vzdálenost, sousedství a jestli přihořívá. */
function Feedback({ last, count }: { last: RankedGuess | undefined; count: number }) {
  if (!last) {
    return <p className="feedback feedback--empty">Začni libovolnou zemí. Barva na mapě ukáže, jak daleko jsi od té tajemné.</p>
  }
  const name = getCountry(last.id).name
  const trend =
    last.trend === 'hotter' ? 'Přihořívá.' : last.trend === 'colder' ? 'Chladne.' : last.trend === 'same' ? 'Stejně daleko jako minule.' : ''
  return (
    <div className="feedback" style={{ borderColor: guessColor(last) }} aria-live="polite">
      <p className="feedback__main">
        {last.neighbor ? (
          <>
            <strong>{name}</strong> s hledanou zemí <strong>sousedí!</strong>
          </>
        ) : (
          <>
            <strong>{name}</strong> je od hranic hledané země <strong>{formatKm(last.km)}</strong>.
          </>
        )}
      </p>
      {count > 1 && (
        <p className={`feedback__trend feedback__trend--${last.trend}`}>
          {trend}
          {last.best && last.trend === 'hotter' ? ' Zatím nejblíž.' : ''}
        </p>
      )}
    </div>
  )
}

function GuessRow({ guess, newest }: { guess: RankedGuess; newest: boolean }) {
  const country = getCountry(guess.id)
  return (
    <li className={'guess' + (newest ? ' guess--newest' : '')}>
      <span className="guess__chip" style={{ background: guessColor(guess) }} />
      <Flag country={country} className="flag--small" />
      <span className="guess__name">{country.name}</span>
      <span className="guess__distance">{distanceText(guess)}</span>
      <span className="guess__order" title={`${guess.order}. tip`}>
        {guess.order}.
      </span>
    </li>
  )
}
