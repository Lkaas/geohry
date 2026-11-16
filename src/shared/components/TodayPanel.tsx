import { useMemo } from 'react'
import { GAMES } from '../../games/registry'
import { dateKey } from '../random'
import { summarizeToday } from '../today'

const STATUS_LABEL = { none: 'čeká', playing: 'rozehráno', won: 'splněno', lost: 'nevyšlo' } as const

function plural(n: number, one: string, few: string, many: string): string {
  return n === 1 ? one : n >= 2 && n <= 4 ? few : many
}

/** Přehled dnešních denních výzev: kolik je hotových, kterou hrát dál a jak dlouho trvá série. */
export function TodayPanel() {
  const today = dateKey()
  const { items, done, total, next, bestStreak } = useMemo(() => summarizeToday(GAMES, today), [today])
  const all = done === total

  return (
    <section className="today" aria-label="Dnešní výzvy">
      <div className="today__text">
        <h2>
          Dnes {done} z {total} výzev
        </h2>
        <p className="muted">
          {all ? 'Všechno hotovo. Nové výzvy přijdou o půlnoci.' : 'Denní výzva je u každé hry stejná pro všechny.'}
          {bestStreak > 1 ? ` Série výher: ${bestStreak} ${plural(bestStreak, 'den', 'dny', 'dní')}.` : ''}
        </p>
      </div>
      <ol className="today__bar">
        {items.map(({ game, status }) => (
          <li key={game.id}>
            <a
              className={`today__seg today__seg--${status}`}
              href={`#${game.route}`}
              aria-label={`${game.title}: ${STATUS_LABEL[status]}`}
              title={`${game.title}: ${STATUS_LABEL[status]}`}
            />
          </li>
        ))}
      </ol>
      {next && (
        <a className="button button--primary today__next" href={`#${next.route}`}>
          {done === 0 ? 'Začít dnešní výzvy' : `Další: ${next.title}`}
        </a>
      )}
    </section>
  )
}
