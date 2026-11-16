import { useMemo, useState } from 'react'
import { findGame } from '../registry'
import { CountryInput } from '../../shared/components/CountryInput'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { getCountry } from '../../shared/data'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import { plural } from '../../shared/text'
import type { Country, GameMode } from '../../shared/types'
import { getCategory } from './categories'
import { GeoGridHelp } from './GeoGridHelp'
import {
  GAME_ID, MAX_GUESSES, SIZE, buildShareText, colOf, failedCategories, filledCount, gridStatus, isPlayableGrid, isValidAnswer, pickGrid, rarity, rowOf, totalRarity,
  validAnswers, type Grid,
} from './logic'
import './geogrid.css'

const game = findGame('geogrid')!
const CELLS = Array.from({ length: SIZE * SIZE }, (_, i) => i)
const collator = new Intl.Collator('cs')

/** Stav jednoho kola. U denní výzvy se ukládá do localStorage (včetně kategorií, aby rozehraná hra přežila úpravy generátoru). */
interface RoundState extends Grid {
  status: DailyStatus
  /** Vyplněná políčka: kód země nebo null. Pořadí po řádcích. */
  cells: (string | null)[]
  /** Počet použitých tipů (správných i špatných). */
  guessesUsed: number
  /** Špatné tipy, aby šly u políčka připomenout a nenabízely se znovu. */
  misses: { cell: number; id: string }[]
}

function startRound(mode: GameMode, today: string): RoundState {
  if (mode === 'daily') {
    const saved = loadDaily<RoundState>(GAME_ID, today)
    if (saved && isPlayableGrid(saved)) return saved
  }
  return { ...pickGrid(mode, today), status: 'playing', cells: Array<string | null>(SIZE * SIZE).fill(null), guessesUsed: 0, misses: [] }
}

export default function GeoGridGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<GeoGridHelp />} attemptsLabel="Na kolik tipů vyplněno vše">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

type Feedback = { kind: 'hit' | 'miss'; text: string } | null

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  const [selected, setSelected] = useState<number | null>(() => {
    const first = state.cells.findIndex((c) => c === null)
    return state.status === 'playing' && first >= 0 ? first : null
  })
  const [feedback, setFeedback] = useState<Feedback>(null)

  const finished = state.status !== 'playing'
  const guessesLeft = MAX_GUESSES - state.guessesUsed
  const rowLabel = (cell: number) => getCategory(state.rows[rowOf(cell)]).label
  const colLabel = (cell: number) => getCategory(state.cols[colOf(cell)]).label

  // nenabízet země, které už jsou v mřížce, ani ty, které hráč do vybraného políčka už zkusil
  const exclude = useMemo(() => {
    const ids = new Set(state.cells.filter((c): c is string => c !== null))
    for (const miss of state.misses) if (miss.cell === selected) ids.add(miss.id)
    return ids
  }, [state.cells, state.misses, selected])

  const guess = (country: Country) => {
    if (finished || selected === null || state.cells[selected] !== null || exclude.has(country.id)) return
    const hit = isValidAnswer(state, selected, country.id)
    const cells = hit ? state.cells.map((c, i) => (i === selected ? country.id : c)) : state.cells
    const guessesUsed = state.guessesUsed + 1
    const next: RoundState = {
      ...state,
      cells,
      guessesUsed,
      misses: hit ? state.misses : [...state.misses, { cell: selected, id: country.id }],
      status: gridStatus(cells, guessesUsed),
    }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (hit) {
      collectCountry(country.id, today)
      setFeedback({ kind: 'hit', text: `${country.name} sedí. Vzácnost odpovědi ${rarity(state, selected, country.id)} ze 100.` })
    } else {
      const failed = failedCategories(state, selected, country.id).map((c) => `„${c.label}“`)
      setFeedback({ kind: 'miss', text: `${country.name} sem nepatří. Nesplňuje ${failed.join(' ani ')}.` })
    }
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: guessesUsed, date: mode === 'daily' ? today : undefined })
      setSelected(null)
    } else if (hit) {
      // po správné odpovědi přeskočit na další volné políčko
      const order = [...CELLS.slice(selected + 1), ...CELLS.slice(0, selected)]
      setSelected(order.find((i) => cells[i] === null) ?? null)
    }
  }

  const filled = filledCount(state.cells)
  const selectedAnswers = useMemo(
    () => (finished && selected !== null ? validAnswers(state, selected).map(getCountry).sort((a, b) => collator.compare(a.name, b.name)) : []),
    [finished, selected, state],
  )

  return (
    <div className="game geogrid">
      <section className="geogrid__board" aria-label="Mřížka">
        <div className="geogrid__corner" />
        {state.cols.map((id) => (
          <div key={id} className="geogrid__head geogrid__head--col">
            {getCategory(id).label}
          </div>
        ))}
        {state.rows.map((rowId, r) => (
          <Row key={rowId} label={getCategory(rowId).label}>
            {[0, 1, 2].map((c) => {
              const cell = r * SIZE + c
              const id = state.cells[cell]
              const country = id ? getCountry(id) : null
              const missCount = state.misses.filter((m) => m.cell === cell).length
              return (
                <button
                  key={cell}
                  type="button"
                  className={'geogrid__cell' + (country ? ' geogrid__cell--filled' : '') + (selected === cell ? ' geogrid__cell--selected' : '')}
                  onClick={() => setSelected(cell)}
                  disabled={!finished && country !== null}
                  aria-label={`${rowLabel(cell)} a ${colLabel(cell)}: ${country ? country.name : 'prázdné'}`}
                  aria-pressed={selected === cell}
                >
                  {country ? (
                    <>
                      <Flag country={country} className="geogrid__flag" />
                      <span className="geogrid__name">{country.name}</span>
                      <span className="geogrid__rarity" title="Vzácnost odpovědi">
                        {rarity(state, cell, country.id)}
                      </span>
                    </>
                  ) : finished ? (
                    <span className="geogrid__empty">
                      {validAnswers(state, cell).length} {plural(validAnswers(state, cell).length, 'možnost', 'možnosti', 'možností')}
                    </span>
                  ) : (
                    <span className="geogrid__empty">{missCount > 0 ? `${missCount}× vedle` : '?'}</span>
                  )}
                </button>
              )
            })}
          </Row>
        ))}
      </section>

      <aside className="game__panel">
        {finished ? (
          <div className="result">
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
              {state.status === 'won' ? 'Celá mřížka vyplněná!' : 'Tipy došly'}
            </p>
            <h2 className="result__country">{filled} z 9</h2>
            <p>
              Použito {state.guessesUsed} z {MAX_GUESSES} tipů. Vzácnost odpovědí {totalRarity(state, state.cells)} ze 100.
            </p>
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', state, state.cells, state.guessesUsed)} />
            {mode === 'free' ? (
              <button type="button" className="button" data-shortcut="new" onClick={onNextRound}>
                Hrát další mřížku
              </button>
            ) : (
              <>
                <p className="muted">Další denní výzva bude zítra.</p>
                <button type="button" className="button" data-shortcut="new" onClick={onPlayFree}>
                  Hrát volnou hru
                </button>
              </>
            )}
            {selected === null ? (
              <p className="muted">Klikni na políčko a uvidíš všechny země, které do něj patřily.</p>
            ) : (
              <>
                <h3 className="panel-heading">
                  {rowLabel(selected)} + {colLabel(selected)} ({selectedAnswers.length})
                </h3>
                <ul className="geogrid__answers">
                  {selectedAnswers.map((c) => (
                    <li key={c.id} className={state.cells[selected] === c.id ? 'geogrid__answers--mine' : undefined}>
                      <Flag country={c} className="flag--small" /> {c.name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="geogrid__task">
              {selected === null ? (
                'Vyber prázdné políčko v mřížce.'
              ) : (
                <>
                  Hledáš zemi, pro kterou platí obojí:
                  <strong>{rowLabel(selected)}</strong>
                  <strong>{colLabel(selected)}</strong>
                </>
              )}
            </p>
            <CountryInput onSelect={guess} exclude={exclude} disabled={selected === null} placeholder="Napiš zemi a potvrď Enterem" showFlags={false} autoFocus />
            <p>
              Zbývá <strong>{guessesLeft}</strong> {plural(guessesLeft, 'tip', 'tipy', 'tipů')}, vyplněno {filled} z 9.
            </p>
            {feedback && (
              <p className={`geogrid__feedback geogrid__feedback--${feedback.kind}`} aria-live="polite">
                {feedback.text}
              </p>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="geogrid__head geogrid__head--row">{label}</div>
      {children}
    </>
  )
}
