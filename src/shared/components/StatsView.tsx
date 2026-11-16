import type { GameStats } from '../stats'

/** Přehled statistik jedné hry: čísla nahoře, pod nimi sloupce s rozložením počtu pokusů. */
interface StatsViewProps {
  stats: GameStats
  /** Nadpis nad sloupci rozložení. */
  attemptsLabel?: string
  /** Jak vypsat klíč rozložení (výchozí "3."). Hra s hvězdičkami si dá třeba "3 ★". */
  formatAttempts?: (attempts: number) => string
}

export function StatsView({ stats, attemptsLabel = 'Na kolikátý pokus', formatAttempts = (n) => `${n}.` }: StatsViewProps) {
  const successRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0
  const rows = Object.entries(stats.distribution)
    .map(([attempts, count]) => ({ attempts: Number(attempts), count }))
    .sort((a, b) => a.attempts - b.attempts)
  const max = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="stats">
      <dl className="stats__numbers">
        <div>
          <dd>{stats.played}</dd>
          <dt>odehráno</dt>
        </div>
        <div>
          <dd>{successRate} %</dd>
          <dt>úspěšnost</dt>
        </div>
        <div>
          <dd>{stats.currentStreak}</dd>
          <dt>aktuální série</dt>
        </div>
        <div>
          <dd>{stats.maxStreak}</dd>
          <dt>nejdelší série</dt>
        </div>
      </dl>
      <h3>{attemptsLabel}</h3>
      {rows.length === 0 ? (
        <p className="muted">Zatím žádná výhra. Rozložení se ukáže po první uhodnuté zemi.</p>
      ) : (
        <ol className="stats__bars">
          {rows.map((r) => (
            <li key={r.attempts}>
              <span className="stats__attempts">{formatAttempts(r.attempts)}</span>
              <span className="stats__bar" style={{ width: `${Math.max(8, (r.count / max) * 100)}%` }}>
                {r.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
