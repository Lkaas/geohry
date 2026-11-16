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
import { CountryleHelp } from './CountryleHelp'
import {
  GAME_ID, MAX_GUESSES, buildShareText, compare, formatArea, formatPopulation, formatTemperature, pickTarget, roundStatus, type Closeness, type Comparison,
  type NumberHint,
} from './logic'
import './countryle.css'

const game = findGame('countryle')!

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

export default function CountryleGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<CountryleHelp />} attemptsLabel="Na kolikátý pokus">
      <Round key={`${mode}-${roundNumber}`} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
    </GameShell>
  )
}

function Round({ mode, onNextRound, onPlayFree }: { mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))

  const target = getCountry(state.targetId)
  const finished = state.status !== 'playing'
  const comparisons = useMemo(() => state.guesses.map((id) => compare(state.targetId, id)), [state])
  const usedIds = useMemo(() => new Set(state.guesses), [state.guesses])
  const left = MAX_GUESSES - state.guesses.length

  const guess = (country: Country) => {
    if (finished || usedIds.has(country.id)) return
    const guesses = [...state.guesses, country.id]
    const next: RoundState = { ...state, guesses, status: roundStatus(state.targetId, guesses) }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    if (next.status !== 'playing') {
      recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: guesses.length, date: mode === 'daily' ? today : undefined })
      if (next.status === 'won') collectCountry(next.targetId, today)
    }
  }

  return (
    <div className="countryle">
      <section className="countryle__top">
        {finished ? (
          <div className="countryle__result">
            <Flag country={target} className="flag--large" decorative={false} />
            <div className="result">
              <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>
                {state.status === 'won' ? `Správně na ${state.guesses.length}. pokus!` : 'Pokusy došly. Hledaná země byla'}
              </p>
              <h2 className="result__country">{target.name}</h2>
              <p className="muted">
                {target.continent}, {formatPopulation(target.population)} obyvatel, {formatArea(target.area)}, průměrná teplota {formatTemperature(target.avgTemp)}
              </p>
              <div className="countryle__actions">
                <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', comparisons, state.status === 'won')} />
                {mode === 'free' ? (
                  <button type="button" className="button" onClick={onNextRound}>
                    Hrát další zemi
                  </button>
                ) : (
                  <button type="button" className="button" onClick={onPlayFree}>
                    Hrát volnou hru
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <CountryInput onSelect={guess} exclude={usedIds} placeholder="Napiš zemi a potvrď Enterem" autoFocus />
            <p className="countryle__left">
              {state.guesses.length === 0
                ? `Máš ${MAX_GUESSES} pokusů. Začni libovolnou zemí a podle nápověd se dostaň k té hledané.`
                : `Zbývá ${left} ${plural(left, 'pokus', 'pokusy', 'pokusů')}.`}
            </p>
          </>
        )}
      </section>

      {comparisons.length > 0 && (
        <div className="countryle__scroll">
          <table className="countryle__table">
            <thead>
              <tr>
                <th scope="col">Země</th>
                <th scope="col">Kontinent</th>
                <th scope="col">Polokoule</th>
                <th scope="col">Obyvatel</th>
                <th scope="col">Rozloha</th>
                <th scope="col">Průměrná teplota</th>
                <th scope="col">Kde hledat</th>
              </tr>
            </thead>
            <tbody>
              {[...comparisons].reverse().map((c) => (
                <Row key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="countryle__legend" aria-hidden="true">
        <li>
          <span className="cell-chip cell--hit" /> shoda nebo velmi blízko
        </li>
        <li>
          <span className="cell-chip cell--medium" /> středně blízko
        </li>
        <li>
          <span className="cell-chip cell--miss" /> daleko
        </li>
        <li>▲ hledaná země má víc, ▼ má míň</li>
      </ul>
    </div>
  )
}

const CLOSENESS_CLASS: Record<Closeness, string> = { exact: 'cell--hit', close: 'cell--hit', medium: 'cell--medium', far: 'cell--miss', unknown: 'cell--unknown' }

function NumberCell({ hint, text }: { hint: NumberHint; text: string }) {
  const arrow = hint.direction === 'higher' ? '▲' : hint.direction === 'lower' ? '▼' : ''
  const title = hint.direction === 'higher' ? 'Hledaná země má víc' : hint.direction === 'lower' ? 'Hledaná země má míň' : undefined
  return (
    <td className={'cell ' + CLOSENESS_CLASS[hint.closeness]} title={title}>
      {text}
      {arrow && <span className="cell__arrow"> {arrow}</span>}
    </td>
  )
}

function Row({ c }: { c: Comparison }) {
  const country = getCountry(c.id)
  const direction = c.bearing === null ? null : compass(c.bearing)
  return (
    <tr className={c.correct ? 'countryle__row--correct' : undefined}>
      <th scope="row" className="cell cell--name">
        <Flag country={country} className="flag--small" /> {country.name}
      </th>
      <td className={'cell ' + (c.continent.match ? 'cell--hit' : 'cell--miss')}>{c.continent.value}</td>
      <td className="cell cell--split">
        <span className={c.hemisphere.nsMatch ? 'cell--hit' : 'cell--miss'}>{c.hemisphere.ns === 'S' ? 'severní' : 'jižní'}</span>
        <span className={c.hemisphere.ewMatch ? 'cell--hit' : 'cell--miss'}>{c.hemisphere.ew === 'V' ? 'východní' : 'západní'}</span>
      </td>
      <NumberCell hint={c.population} text={formatPopulation(country.population)} />
      <NumberCell hint={c.area} text={formatArea(country.area)} />
      <NumberCell hint={c.temperature} text={formatTemperature(country.avgTemp)} />
      <td className={'cell ' + (c.correct ? 'cell--hit' : 'cell--direction')}>
        {direction ? (
          <>
            {/* šipka natočená přesně podle azimutu (0° = sever) */}
            <span className="cell__compass" style={{ transform: `rotate(${Math.round(c.bearing ?? 0)}deg)` }} aria-hidden="true">
              ↑
            </span>{' '}
            {formatKm(c.distanceKm)} na {direction.label}
          </>
        ) : (
          'To je ona!'
        )}
      </td>
    </tr>
  )
}
