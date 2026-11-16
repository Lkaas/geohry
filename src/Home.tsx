import { useEffect, useState } from 'react'
import { GAMES, type GameInfo } from './games/registry'
import { CompassButton } from './shared/components/CompassButton'
import { Emblem } from './shared/components/Emblem'
import { FlagOfDay } from './shared/components/FlagOfDay'
import { SignalFlags } from './shared/components/SignalFlags'
import { ThemeToggle } from './shared/components/ThemeToggle'
import { dateKey, formatDateKey } from './shared/random'
import { reachedOnce, totalPlayed } from './shared/milestones'
import { isAprilFools, specialDayNote } from './shared/secrets'
import { showToast } from './shared/toast'
import { collectedCountries, dailyStatus, loadStats } from './shared/stats'
import { COUNTRIES } from './shared/data'

const STATUS_TEXT = {
  none: 'Dnešní výzva čeká',
  playing: 'Dnešní výzva rozehraná',
  won: 'Dnešní výzva splněna',
  lost: 'Dnes to nevyšlo',
} as const

/** Domovská obrazovka: rozcestník her. */
export function Home() {
  const today = dateKey()
  // dlaždice: hlavní hry a všechny už naprogramované; ostatní jsou jen v seznamu "v plánu"
  const mainGames = GAMES.filter((g) => !g.extra || g.component)
  const extraGames = GAMES.filter((g) => g.extra && !g.component)
  const now = new Date()
  const dayNote = specialDayNote(now)
  const april = isAprilFools(now)
  const [planClicks, setPlanClicks] = useState(0)

  // easter egg: 197. odehraná hra (jedna za každou zemi)
  useEffect(() => {
    const played = totalPlayed(GAMES.map((g) => g.id))
    if (reachedOnce('played-all-countries', played, COUNTRIES.length)) {
      showToast({ title: `${COUNTRIES.length} odehraných her`, lines: [`Jedna za každou zemi na mapě.`] })
    }
  }, [])
  const collected = Object.keys(collectedCountries()).length

  return (
    <div className={'home' + (april ? ' home--april' : '')}>
      <div className="home__toolbar">
        <ThemeToggle />
      </div>
      <header className="home__header">
        <div>
          <SignalFlags interactive />
          <h1 className="wordmark">GeoHry</h1>
          <p className="home__lead">Hry o mapách a vlajkách. Každý den čeká u každé hry nová výzva, stejná pro všechny.</p>
          <p className="home__meta">
            Dnes je {formatDateKey(today)}. Ve <a href="#sbirka">sbírce</a> máš {collected} z {COUNTRIES.length} zemí.
          </p>
          {dayNote && <p className="home__day">{dayNote}</p>}
        </div>
        <CompassButton />
      </header>

      <FlagOfDay />

      <ul className="tiles">
        {mainGames.map((game, index) => (
          <li key={game.id}>
            <GameTile game={game} today={today} number={index + 1} />
          </li>
        ))}
      </ul>

      <section className="home__extra">
        {/* easter egg: pět kliknutí na nadpis přidá do seznamu přeškrtnutou položku */}
        <h2 onClick={() => setPlanClicks((n) => n + 1)}>Další hry v plánu</h2>
        <ul>
          {extraGames.map((g) => (
            <li key={g.id}>
              <strong>{g.title}</strong>
              <span>{g.description}</span>
            </li>
          ))}
          {planClicks >= 5 && (
            <li className="home__extra-secret">
              <strong>Ušít vlajku Nepálu</strong>
              <span>Postup je přímo v nepálské ústavě. Dokončení: nikdy.</span>
            </li>
          )}
        </ul>
      </section>

      <footer className="home__sources">
        <h2>Zdroje dat</h2>
        <p>
          Hranice zemí: Natural Earth (volné dílo). Údaje o zemích a české názvy: mledoze/countries (ODbL). Populace a HDP: Světová banka (CC BY 4.0).
          Průměrné teploty: Světová banka / CRU podle Wikipedie (CC BY-SA 4.0). Vlajky: flag-icons (MIT). Písmo: Bricolage Grotesque (OFL).
        </p>
      </footer>
    </div>
  )
}

function GameTile({ game, today, number }: { game: GameInfo; today: string; number: number }) {
  if (!game.component) {
    return (
      <div className="tile tile--soon">
        <Emblem kind={game.emblem} />
        <h2>{game.title}</h2>
        <p>{game.description}</p>
        <span className="tile__status">Připravuje se</span>
      </div>
    )
  }
  const status = dailyStatus(game.id, today)
  const streak = loadStats(game.id, 'daily').currentStreak
  return (
    <a className="tile" href={`#${game.route}`}>
      <Emblem kind={game.emblem} />
      <span className="tile__no">list {number}</span>
      <h2>{game.title}</h2>
      <p>{game.description}</p>
      <span className={`tile__status tile__status--${status}`}>
        {STATUS_TEXT[status]}
        {streak > 1 ? `, série ${streak} dní` : ''}
      </span>
    </a>
  )
}
