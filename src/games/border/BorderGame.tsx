import { memo, useMemo, useRef, useState } from 'react'
import { findGame } from '../registry'
import { Flag } from '../../shared/components/Flag'
import { GameShell } from '../../shared/components/GameShell'
import { ShareButton } from '../../shared/components/ShareButton'
import { getCountry } from '../../shared/data'
import { dateKey, formatDateKey } from '../../shared/random'
import { collectCountry, loadDaily, recordResult, saveDaily, type DailyStatus } from '../../shared/stats'
import type { GameMode } from '../../shared/types'
import { useWorld } from '../../shared/useWorld'
import type { World } from '../../shared/world'
import { BorderHelp } from './BorderHelp'
import {
  GAME_ID, MIN_POINTS, STAR_TEXT, WIN_STARS, buildShareText, pickTarget, scoreInPlace, scoreNormalized, starString, starsFor, thinPath, type Difficulty, type Point,
  type Ring,
} from './logic'
import { VIEW_FRAME, VIEW_HEIGHT, VIEW_WIDTH, buildScene, type Scene } from './scene'
import './border.css'

const game = findGame('nakresli-hranici')!

/** Stav jednoho kola. U denní výzvy se ukládá do localStorage (včetně odevzdaného tahu, aby šel znovu ukázat). */
interface RoundState {
  status: DailyStatus
  targetId: string
  difficulty: Difficulty
  /** Odevzdaný tah (souřadnice výřezu, zaokrouhlené). null = ještě neodevzdáno. */
  drawn: Ring | null
}

function startRound(mode: GameMode, today: string): RoundState {
  const targetId = pickTarget(mode, today)
  if (mode === 'daily') {
    const saved = loadDaily<RoundState>(GAME_ID, today)
    if (saved && saved.targetId === targetId) return saved
  }
  return { status: 'playing', targetId, difficulty: 'context', drawn: null }
}

export default function BorderGame() {
  const [mode, setMode] = useState<GameMode>('daily')
  const [roundNumber, setRoundNumber] = useState(0)
  const world = useWorld()
  return (
    <GameShell game={game} mode={mode} onModeChange={setMode} help={<BorderHelp />} attemptsLabel="Kolik hvězdiček" formatAttempts={(n) => `${n} ★`}>
      {world ? (
        <Round key={`${mode}-${roundNumber}`} world={world} mode={mode} onNextRound={() => setRoundNumber((n) => n + 1)} onPlayFree={() => setMode('free')} />
      ) : (
        <p className="loading">Načítám mapu…</p>
      )}
    </GameShell>
  )
}

const toPath = (ring: readonly Point[], close: boolean) => (ring.length ? 'M' + ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + (close ? 'Z' : '') : '')

function Round({ world, mode, onNextRound, onPlayFree }: { world: World; mode: GameMode; onNextRound: () => void; onPlayFree: () => void }) {
  const today = useMemo(() => dateKey(), [])
  const [state, setState] = useState<RoundState>(() => startRound(mode, today))
  /** Rozkreslený (neodevzdaný) tah. */
  const [points, setPoints] = useState<Point[]>([])
  const [drawing, setDrawing] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const target = getCountry(state.targetId)
  const scene = useMemo(() => buildScene(world, state.targetId), [world, state.targetId])
  const finished = state.status !== 'playing'
  const withContext = state.difficulty === 'context'

  // výsledek se počítá z odevzdaného tahu (i po znovunačtení uložené denní výzvy)
  const result = useMemo(() => {
    if (!state.drawn) return null
    if (state.difficulty === 'context') return { score: scoreInPlace(scene.targetRings, state.drawn, VIEW_FRAME), shown: state.drawn }
    const { score, fitted } = scoreNormalized(scene.targetRings, state.drawn)
    return { score, shown: fitted }
  }, [state.drawn, state.difficulty, scene])

  const toViewPoint = (event: React.PointerEvent): Point => {
    const svg = svgRef.current!
    const p = svg.createSVGPoint()
    p.x = event.clientX
    p.y = event.clientY
    const q = p.matrixTransform(svg.getScreenCTM()!.inverse())
    return [q.x, q.y]
  }

  const onPointerDown = (event: React.PointerEvent) => {
    if (finished) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setPoints([toViewPoint(event)])
    setDrawing(true)
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (!drawing) return
    const p = toViewPoint(event)
    setPoints((prev) => {
      const last = prev[prev.length - 1]
      return last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 2.5 ? prev : [...prev, p]
    })
  }
  const onPointerUp = () => setDrawing(false)

  const ready = !drawing && points.length >= MIN_POINTS

  const submit = () => {
    if (!ready || finished) return
    const drawn = thinPath(points, 3).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as Point)
    const score = state.difficulty === 'context' ? scoreInPlace(scene.targetRings, drawn, VIEW_FRAME) : scoreNormalized(scene.targetRings, drawn).score
    const stars = starsFor(score)
    const next: RoundState = { ...state, drawn, status: stars >= WIN_STARS ? 'won' : 'lost' }
    setState(next)
    if (mode === 'daily') saveDaily(GAME_ID, today, next)
    recordResult(GAME_ID, mode, { won: next.status === 'won', attempts: stars, date: mode === 'daily' ? today : undefined })
    if (next.status === 'won') collectCountry(state.targetId, today)
  }

  const setDifficulty = (difficulty: Difficulty) => {
    if (finished || difficulty === state.difficulty) return
    setState({ ...state, difficulty })
    setPoints([])
  }

  const stars = result ? starsFor(result.score) : 0
  const showMap = withContext || finished

  return (
    <div className="game border">
      <section className="game__map">
        <div className={'border__canvas' + (finished ? ' border__canvas--done' : '')}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            role="img"
            aria-label={`Kreslicí plocha: ${target.name}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {showMap ? <ContextLayer scene={scene} /> : <rect className="border__paper" width={VIEW_WIDTH} height={VIEW_HEIGHT} />}
            {withContext && !finished && <rect className="border__box" {...scene.box} rx="10" />}
            {finished && (
              <>
                {scene.otherPartsPath && <path className="border__other-parts" d={scene.otherPartsPath} />}
                <path className="border__target" d={scene.targetPath} />
              </>
            )}
            {finished && result ? (
              <path className="border__stroke border__stroke--final" d={toPath(result.shown, true)} />
            ) : (
              <path className={'border__stroke' + (drawing ? '' : ' border__stroke--closed')} d={toPath(points, !drawing)} />
            )}
          </svg>
        </div>
        {finished && (
          <ul className="route-legend" aria-hidden="true">
            <li>
              <span className="guess__chip" style={{ background: '#1E9E57' }} /> skutečný tvar
            </li>
            <li>
              <span className="guess__chip" style={{ background: '#FFCB05' }} /> tvůj tah{state.difficulty === 'memory' ? ' (posunutý a zvětšený na stejnou plochu)' : ''}
            </li>
          </ul>
        )}
      </section>

      <aside className="game__panel">
        <div className="border__task">
          <Flag country={target} className="flag--medium" />
          <div>
            <p className="muted">Nakresli obrys země</p>
            <h2 className="result__country">{target.name}</h2>
          </div>
        </div>

        {finished && result ? (
          <div className="result">
            <p className="border__score">{Math.round(result.score * 100)} %</p>
            <p className="border__stars" aria-label={`${stars} z 5 hvězdiček`}>
              {starString(stars)}
            </p>
            <p className={'result__headline' + (state.status === 'won' ? ' result__headline--won' : '')}>{STAR_TEXT[stars]}</p>
            <p className="muted">Číslo říká, jak velká část plochy se překrývá: společná plocha obou tvarů dělená plochou, kterou zabírají dohromady.</p>
            <ShareButton text={buildShareText(mode === 'daily' ? formatDateKey(today) : 'volná hra', result.score, state.difficulty)} />
            {mode === 'free' ? (
              <button type="button" className="button" data-shortcut="new" onClick={onNextRound}>
                Kreslit další zemi
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
            <div className="segmented border__mode" role="group" aria-label="Obtížnost">
              <button type="button" aria-pressed={withContext} onClick={() => setDifficulty('context')}>
                S mapou okolí
              </button>
              <button type="button" aria-pressed={!withContext} onClick={() => setDifficulty('memory')}>
                Z paměti
              </button>
            </div>
            <p>
              {withContext
                ? 'Země patří do bílého místa na mapě. Stiskni tlačítko myši a jedním tahem obkresli její hranice.'
                : 'Prázdný papír, žádná mapa. Nakresli tvar země jedním tahem. Na velikosti ani umístění nezáleží.'}
            </p>
            <p className="muted">Konec tahu se sám spojí se začátkem. Nový tah smaže ten předchozí.{scene.otherPartsPath ? ' Kreslí se jen hlavní souvislá část území, bez ostrovů.' : ''}</p>
            <div className="border__buttons">
              <button type="button" className="button button--primary" onClick={submit} disabled={!ready}>
                Vyhodnotit
              </button>
              <button type="button" className="button" onClick={() => setPoints([])} disabled={points.length === 0}>
                Smazat
              </button>
            </div>
            {!drawing && points.length > 0 && points.length < MIN_POINTS && <p className="muted">Tah je moc krátký. Zkus to znovu delším tahem.</p>}
          </>
        )}
      </aside>
    </div>
  )
}

/** Podkladová mapa. Je oddělená a zapamatovaná, aby se při kreslení nepřekreslovala. */
const ContextLayer = memo(function ContextLayer({ scene }: { scene: Scene }) {
  return (
    <>
      <rect className="border__sea" width={VIEW_WIDTH} height={VIEW_HEIGHT} />
      {scene.contextPaths.map((d, i) => (
        <path key={i} className="border__land" d={d} />
      ))}
    </>
  )
})
