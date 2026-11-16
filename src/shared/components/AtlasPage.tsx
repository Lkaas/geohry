import { useMemo, useRef, useState } from 'react'
import {
  CONTINENTS,
  COLOR_LABELS,
  EMPTY_FILTER,
  SORT_LABELS,
  SYMBOL_LABELS,
  density,
  filterCountries,
  isFiltered,
  sortCountries,
  type AtlasFilter,
  type SortKey,
  type SymbolKey,
} from '../atlas'
import { rankOf } from '../collection'
import { COUNTRIES, getCountry } from '../data'
import { formatArea, formatDensity, formatPopulation, formatTemperature, formatUsd } from '../format'
import { formatDateKey } from '../random'
import { useRoute } from '../router'
import { collectedCountries } from '../stats'
import type { Country, FlagColor } from '../types'
import { loadWeak, troubleOf } from '../weak'
import { Flag } from './Flag'
import { SignalFlags } from './SignalFlags'
import { ThemeToggle } from './ThemeToggle'
import { WorldMap } from './WorldMap'

const COLORS = Object.keys(COLOR_LABELS) as FlagColor[]
const SYMBOLS = Object.keys(SYMBOL_LABELS) as SymbolKey[]
const SWATCH: Record<FlagColor, string> = {
  red: '#ce1126',
  white: '#ffffff',
  blue: '#0038a8',
  green: '#009a44',
  yellow: '#fcd116',
  black: '#111111',
  orange: '#ff8200',
}

/** Z adresy #atlas-CZE vezme kód země, pokud existuje. */
function countryFromRoute(route: string): string | null {
  const id = route.startsWith('atlas-') ? route.slice(6).toUpperCase() : ''
  return COUNTRIES.some((c) => c.id === id) ? id : null
}

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function metric(country: Country, sort: SortKey): string {
  if (sort === 'population') return formatPopulation(country.population)
  if (sort === 'area') return formatArea(country.area)
  if (sort === 'density') return formatDensity(density(country))
  return country.capital
}

/** Atlas zemí: všechny země s hledáním, filtry (kontinent, barvy a symboly vlajky) a řazením. */
export default function AtlasPage() {
  const route = useRoute()
  const [filter, setFilter] = useState<AtlasFilter>(EMPTY_FILTER)
  const [sort, setSort] = useState<SortKey>('name')
  const [reverse, setReverse] = useState(false)
  const [selected, setSelectedState] = useState<string | null>(() => countryFromRoute(route))
  const detailRef = useRef<HTMLElement>(null)
  const album = useMemo(() => collectedCountries(), [])
  const weak = useMemo(() => loadWeak(), [])

  const list = useMemo(() => sortCountries(filterCountries(filter), sort, reverse), [filter, sort, reverse])

  // adresa se při výběru jen přepíše (bez nového záznamu v historii), ať jde odkaz poslat dál
  const select = (id: string | null) => {
    setSelectedState(id)
    window.history.replaceState(null, '', id ? `#atlas-${id}` : '#atlas')
    // na úzké obrazovce je karta až pod seznamem, tak se k ní přescrolluje
    if (id && window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'start' }))
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <a className="shell__home" href="#" aria-label="Zpět na přehled her">
          <SignalFlags small />
        </a>
        <div className="shell__title">
          <h1>Atlas zemí</h1>
        </div>
        <div className="shell__actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="shell__main">
        <div className="atlas">
          <section className="atlas__main" aria-label="Seznam zemí">
            <div className="atlas__filters">
              <input
                type="search"
                className="atlas__search"
                value={filter.text}
                placeholder="Hledat zemi…"
                aria-label="Hledat zemi"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setFilter({ ...filter, text: e.target.value })}
              />

              <div className="atlas__group" role="group" aria-label="Kontinent">
                <span className="atlas__label">Kontinent</span>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={filter.continent === null}
                  onClick={() => setFilter({ ...filter, continent: null })}
                >
                  Všechny
                </button>
                {CONTINENTS.map((continent) => (
                  <button
                    key={continent}
                    type="button"
                    className="chip"
                    aria-pressed={filter.continent === continent}
                    onClick={() => setFilter({ ...filter, continent: filter.continent === continent ? null : continent })}
                  >
                    {continent}
                  </button>
                ))}
              </div>

              <div className="atlas__group" role="group" aria-label="Barvy vlajky">
                <span className="atlas__label">Barvy vlajky</span>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="chip"
                    aria-pressed={filter.colors.includes(color)}
                    onClick={() => setFilter({ ...filter, colors: toggle(filter.colors, color) })}
                  >
                    <span className="atlas__swatch" style={{ background: SWATCH[color] }} aria-hidden="true" />
                    {COLOR_LABELS[color]}
                  </button>
                ))}
              </div>

              <div className="atlas__group" role="group" aria-label="Symboly na vlajce">
                <span className="atlas__label">Na vlajce je</span>
                {SYMBOLS.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    className="chip"
                    aria-pressed={filter.symbols.includes(symbol)}
                    onClick={() => setFilter({ ...filter, symbols: toggle(filter.symbols, symbol) })}
                  >
                    {SYMBOL_LABELS[symbol]}
                  </button>
                ))}
              </div>

              <div className="atlas__bar">
                <label className="atlas__sort">
                  <span>Řadit podle</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <option key={key} value={key}>
                        {SORT_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="button button--ghost" aria-pressed={reverse} onClick={() => setReverse(!reverse)}>
                  {reverse ? (sort === 'name' ? 'Od Z' : 'Od nejmenšího') : sort === 'name' ? 'Od A' : 'Od největšího'}
                </button>
                <span className="atlas__count" aria-live="polite">
                  {list.length === COUNTRIES.length ? `Všech ${COUNTRIES.length} zemí` : `${list.length} z ${COUNTRIES.length} zemí`}
                </span>
                {isFiltered(filter) && (
                  <button type="button" className="button button--ghost" onClick={() => setFilter(EMPTY_FILTER)}>
                    Zrušit filtry
                  </button>
                )}
              </div>
              {filter.symbols.length > 0 && <p className="muted">Symboly na vlajkách jsou psané ručně a mohou mít chyby.</p>}
            </div>

            {list.length === 0 ? (
              <p className="atlas__empty">Žádná země nesplňuje všechny filtry. Zkus jeden zrušit.</p>
            ) : (
              <ul className="atlas__list">
                {list.map((country) => (
                  <li key={country.id}>
                    <button type="button" className="atlas__item" aria-pressed={selected === country.id} onClick={() => select(country.id)}>
                      <Flag country={country} className="flag--small" />
                      <span className="atlas__name">
                        {country.name}
                        {album[country.id] && <span className="atlas__have" title="Máš ve sbírce" aria-label="máš ve sbírce" />}
                      </span>
                      <span className="atlas__metric">{metric(country, sort)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside ref={detailRef} className="game__panel atlas__detail" aria-label="Karta země">
            {selected ? (
              <CountryDetail id={selected} foundOn={album[selected]} trouble={troubleOf(weak[selected])} onSelect={select} />
            ) : (
              <>
                <h2 className="collection__count">Vyber zemi</h2>
                <p className="muted">
                  Klikni na zemi v seznamu a tady se ukáže její karta s vlajkou, čísly a sousedy. Filtry si můžeš kombinovat: třeba všechny země v
                  Africe se zelenou a žlutou na vlajce.
                </p>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

function CountryDetail({
  id,
  foundOn,
  trouble,
  onSelect,
}: {
  id: string
  foundOn: string | undefined
  trouble: number
  onSelect: (id: string | null) => void
}) {
  const country = getCountry(id)
  const shares = (Object.entries(country.flag.shares) as [FlagColor, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const symbols = SYMBOLS.filter((s) => country.flag[s])
  const fills = useMemo(() => ({ [id]: 'var(--magenta-fill)' }), [id])
  const outline = useMemo(() => new Set([id]), [id])
  const focus = useMemo(() => [id], [id])
  return (
    <div className="collection__card">
      <Flag country={country} className="flag--large" decorative={false} />
      <h2 className="result__country">{country.name}</h2>
      <p className="muted">
        {country.continent}, hlavní město {country.capital}
      </p>
      <div className="atlas__minimap">
        <WorldMap fills={fills} outlineIds={outline} focusIds={focus} focusKey={id} focusFill={0.25} />
      </div>
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
          <dt>Hustota zalidnění</dt>
          <dd>{formatDensity(density(country))}</dd>
        </div>
        <div>
          <dt>Průměrná teplota</dt>
          <dd>{formatTemperature(country.avgTemp)}</dd>
        </div>
        <div>
          <dt>HDP</dt>
          <dd>{country.gdp === null ? 'údaj chybí' : `${formatUsd(country.gdp)}${country.gdpYear ? ` (${country.gdpYear})` : ''}`}</dd>
        </div>
        <div>
          <dt>Poloha</dt>
          <dd>{country.landlocked ? 'Vnitrozemský stát, bez přístupu k moři' : 'Má přístup k moři nebo je ostrovem'}</dd>
        </div>
        <div>
          <dt>Ve sbírce</dt>
          <dd>{foundOn ? `uhodnuto ${formatDateKey(foundOn)}` : 'zatím neuhodnuto'}</dd>
        </div>
      </dl>
      {trouble > 0 && (
        <p className="collection__hint">
          Slabé místo: tuhle zemi se ti nepodařilo vyřešit {trouble}×. <a href="#slaba-mista">Procvičit</a>
        </p>
      )}

      <h3 className="panel-heading">Vlajka</h3>
      <ul className="atlas__shares">
        {shares.map(([color, share]) => (
          <li key={color}>
            <span className="atlas__swatch" style={{ background: SWATCH[color] }} aria-hidden="true" />
            <span>{COLOR_LABELS[color]}</span>
            <span className="atlas__bar-track" aria-hidden="true">
              <span className="atlas__bar-fill" style={{ width: `${Math.min(100, share)}%`, background: SWATCH[color] }} />
            </span>
            <span className="atlas__share">{Math.round(share)} %</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        {symbols.length > 0 ? `Na vlajce je: ${symbols.map((s) => SYMBOL_LABELS[s]).join(', ')}.` : 'Na vlajce není žádný z hlídaných symbolů.'}
      </p>

      <h3 className="panel-heading">Sousedé</h3>
      {country.neighbors.length === 0 ? (
        <p className="muted">Nemá pozemní hranici s žádnou zemí.</p>
      ) : (
        <ul className="collection__neighbors">
          {country.neighbors.map((n) => (
            <li key={n}>
              <button type="button" className="chip" onClick={() => onSelect(n)}>
                {getCountry(n).name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="button button--ghost-dark" onClick={() => onSelect(null)}>
        Zavřít kartu
      </button>
    </div>
  )
}
