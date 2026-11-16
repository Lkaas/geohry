import { useMemo, useState } from 'react'
import { findGame } from '../registry'
import { CountryInput } from '../../shared/components/CountryInput'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { getCountry } from '../../shared/data'
import { compass, formatKm } from '../../shared/geo'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import { plural } from '../../shared/text'
import type { Country, GameMode } from '../../shared/types'
import { useWorld } from '../../shared/useWorld'
import { SilhouetteHelp } from './SilhouetteHelp'
import { GAME_ID, MAX_GUESSES, buildShareText, evaluateGuess, pickTarget, roundStatus } from './logic'
import { SHAPE_HEIGHT, SHAPE_WIDTH, silhouettePath } from './shape'
import './silhouette.css'

const game = findGame('silueta')!

interface RoundState {
  status: DailyStatus
  targetId: string
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

export default function SilhouetteGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<SilhouetteHelp />} attemptsLabel="Na kolikátý pokus">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const world = useWorld()
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  const target = getCountry(state.targetId)
  const finished = state.status !== 'playing'
  const results = useMemo(() => state.guesses.map((id) => evaluateGuess(state.targetId, id)), [state])
  const usedIds = useMemo(() => new Set(state.guesses), [state.guesses])
  const shape = useMemo(() => (world ? silhouettePath(world, state.targetId) : ''), [world, state.targetId])
  const left = MAX_GUESSES - state.guesses.length

  const guess = (country: Country) => {
    if (finished || usedIds.has(country.id)) return
    const guesses = [...state.guesses, country.id]
    const next: RoundState = { ...state, guesses, status: roundStatus(state.targetId, guesses) }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: guesses.length, date: mode === 'daily' ? today : undefined })
      if (next.status === 'won') collectCountry(state.targetId, today)
    }
  }

  return (
    <div className="game">
      <section className="game__map">
        <div className="silhouette__canvas">
          {world ? (
            <svg viewBox={`0 0 ${SHAPE_WIDTH} ${SHAPE_HEIGHT}`} role="img" aria-label={finished ? `Obrys: ${target.name}` : 'Obrys hledané země'}>
              <path className={'silhouette__shape' + (state.status === 'won' ? ' silhouette__shape--won' : '')} d={shape} />
            </svg>
          ) : (
            <p className="loading">Načítám obrys…</p>
          )}
        </div>
      </section>

      <aside className="game__panel">
        {finished ? (
          <div className="result">
            <Flag country={target} className="flag--large" decorative={false} />
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {state.status === 'won' ? `Správně na ${state.guesses.length}. pokus!` : 'Pokusy došly. Byla to'}
            </p>
            <h2 className="result__country">{target.name}</h2>
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', results, state.status === 'won')} />
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
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Která země to je?" autoFocus />
            <p>
              Zbývá <strong>{left}</strong> {plural(left, 'pokus', 'pokusy', 'pokusů')}.
              {state.guesses.length === 0 && ' Po špatném tipu se dozvíš, jak daleko a kterým směrem hledaná země leží.'}
            </p>
          </>
        )}

        {results.length > 0 && (
          <ol className="guess-list">
            {results.map((r, i) => (
              <li key={r.id} className="guess silhouette__guess">
                <Flag country={getCountry(r.id)} className="flag--small" />
                <span className="guess__name">{getCountry(r.id).name}</span>
                {r.correct ? (
                  <span className="guess__distance">správně</span>
                ) : (
                  <span className="guess__distance">
                    {formatKm(r.km)}{' '}
                    <span className="silhouette__arrow" style={{ transform: `rotate(${Math.round(r.bearing ?? 0)}deg)` }} title={`na ${compass(r.bearing ?? 0).label}`}>
                      ↑
                    </span>
                  </span>
                )}
                <span className="silhouette__proximity" title="Blízkost: 100 % je správná země">
                  {r.proximity} %
                </span>
                <span className="guess__order">{i + 1}.</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  )
}
