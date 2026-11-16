import { useMemo, useState } from 'react'
import { continentProgress, rankOf } from '../collection'
import { COUNTRIES, getCountry } from '../data'
import { formatArea, formatPopulation } from '../format'
import { formatDateKey } from '../random'
import { collectedCountries } from '../stats'
import { Flag } from './Flag'
import { SignalFlags } from './SignalFlags'
import { ThemeToggle } from './ThemeToggle'
import { WorldMap } from './WorldMap'

const COLLECTED_FILL = 'var(--magenta-fill)'

/** Sbírka zemí: mapa s uhodnutými zeměmi a karta každé z nich. Neuhodnuté země zůstávají bez jména. */
export default function CollectionPage() {
  const album = useMemo(() => collectedCountries(), [])
  const have = useMemo(() => new Set(Object.keys(album)), [album])
  const [selected, setSelected] = useState<string | null>(null)
  const [hint, setHint] = useState(false)

  const fills = useMemo(() => Object.fromEntries([...have].map((id) => [id, COLLECTED_FILL])), [have])
  const labels = useMemo(() => Object.fromEntries([...have].map((id) => [id, getCountry(id).name])), [have])
  const outline = useMemo(() => new Set(selected ? [selected] : []), [selected])

  const onCountryClick = (id: string) => {
    if (have.has(id)) {
      setSelected(id)
      setHint(false)
    } else {
      setSelected(null)
      setHint(true)
    }
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <a className="shell__home" href="#" aria-label="Zpět na přehled her">
          <SignalFlags small />
        </a>
        <div className="shell__title">
          <h1>Sbírka zemí</h1>
        </div>
        <div className="shell__actions">
          <ThemeToggle />
        </div>
      </header>
      <div className="game collection">
        <section className="game__map">
          <WorldMap fills={fills} labels={labels} outlineIds={outline} onCountryClick={onCountryClick} />
        </section>
        <aside className="game__panel">
          {selected ? (
            <CountryCard id={selected} foundOn={album[selected]} have={have} onSelect={setSelected} />
          ) : (
            <Summary count={have.size} have={have} hint={hint} />
          )}
        </aside>
      </div>
    </div>
  )
}

function Summary({ count, have, hint }: { count: number; have: ReadonlySet<string>; hint: boolean }) {
  return (
    <>
      <h2 className="collection__count">
        {count} z {COUNTRIES.length} zemí
      </h2>
      {count === 0 ? (
        <p>Sbírka je zatím prázdná. Každá země, kterou uhodneš v některé hře, se sem zapíše a na mapě se obarví.</p>
      ) : (
        <p className="muted">Klikni na obarvenou zemi a otevře se její karta. Neuhodnuté země zůstávají bez jména.</p>
      )}
      {hint && <p className="collection__hint">Tuhle zemi ještě nemáš. Uhodni ji v některé hře a objeví se tu její karta.</p>}
      <h3 className="panel-heading">Podle kontinentů</h3>
      <ul className="collection__continents">
        {continentProgress(have).map((p) => (
          <li key={p.continent}>
            <span>{p.continent}</span>
            <span>
              {p.have} z {p.total}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

function CountryCard({ id, foundOn, have, onSelect }: { id: string; foundOn: string; have: ReadonlySet<string>; onSelect: (id: string) => void }) {
  const country = getCountry(id)
  const known = country.neighbors.filter((n) => have.has(n))
  return (
    <div className="collection__card">
      <Flag country={country} className="flag--large" decorative={false} />
      <h2 className="result__country">{country.name}</h2>
      <p className="muted">
        {country.continent}, hlavní město {country.capital}
      </p>
      <dl className="collection__facts">
        <div>
          <dt>Obyvatel</dt>
          <dd>
            {formatPopulation(country.population)}, {rankOf(id, 'population')}. nejlidnatější ze {COUNTRIES.length}
          </dd>
        </div>
        <div>
          <dt>Rozloha</dt>
          <dd>
            {formatArea(country.area)}, {rankOf(id, 'area')}. největší ze {COUNTRIES.length}
          </dd>
        </div>
        <div>
          <dt>Uhodnuto</dt>
          <dd>{formatDateKey(foundOn)}</dd>
        </div>
      </dl>
      <h3 className="panel-heading">Sousedé, které už máš</h3>
      {known.length === 0 ? (
        <p className="muted">Zatím žádný.</p>
      ) : (
        <ul className="collection__neighbors">
          {known.map((n) => (
            <li key={n}>
              <button type="button" className="chip" onClick={() => onSelect(n)}>
                {getCountry(n).name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
