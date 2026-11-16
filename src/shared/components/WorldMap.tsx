import { memo, useEffect, useMemo, useRef } from 'react'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import { COUNTRIES } from '../data'
import { MAP_HEIGHT, MAP_WIDTH, type World } from '../world'
import { useWorld } from '../useWorld'

export interface WorldMapProps {
  /** Barvy výplně zemí: { CZE: '#ff0000' }. Země bez barvy mají neutrální barvu pevniny. */
  fills?: Readonly<Record<string, string>>
  /** Texty, které se ukážou po najetí myší: { CZE: 'Česko, 234 km' }. Země bez textu se nepopisují (aby mapa nenapovídala). */
  labels?: Readonly<Record<string, string>>
  /** Když je zadáno, vykreslí se jen tyto země (ostatní pevnina zmizí). */
  onlyIds?: ReadonlySet<string>
  /** Země se zvýrazněným obrysem. */
  outlineIds?: ReadonlySet<string>
  /** Země nakreslené jen čárkovaným obrysem bez výplně (nápověda tvaru). */
  ghostIds?: ReadonlySet<string>
  /** Kreslit i nehratelná území (Grónsko, Západní Sahara, ...). Výchozí: ano. */
  showTerritories?: boolean
  /** Kliknutí na zemi. */
  onCountryClick?: (countryId: string) => void
  /** Země, na které se má mapa přiblížit. Přiblížení proběhne při každé změně `focusKey`. */
  focusIds?: readonly string[]
  focusKey?: string | number
  /** Jak velkou část výřezu mají vybrané země zabrat (0–1). Výchozí 0.3 nechává vidět široké okolí. */
  focusFill?: number
}

const MAX_ZOOM = 40
const MARKER_RADIUS = 11 // v jednotkách viewBoxu při zoomu 1

/**
 * Mapa světa se zoomem a posunem (kolečko myši, tažení, tlačítka).
 * Malé země (Vatikán, Malta, ostrovní státy) mají navíc kroužek, aby byly vidět.
 */
export function WorldMap(props: WorldMapProps) {
  const world = useWorld()
  if (!world) return <div className="map map--loading">Načítám mapu…</div>
  return <LoadedMap world={world} {...props} />
}

const markerCountries = COUNTRIES.filter((c) => c.marker)

const LoadedMap = memo(function LoadedMap({
  world,
  fills = {},
  labels = {},
  onlyIds,
  outlineIds,
  ghostIds,
  showTerritories = true,
  onCountryClick,
  focusIds,
  focusKey,
  focusFill = 0.3,
}: WorldMapProps & { world: World }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const layerRef = useRef<SVGGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const labelsRef = useRef(labels)
  labelsRef.current = labels

  // zoom a posun řeší d3-zoom přímo nad DOM (bez překreslování Reactu, aby byl pohyb plynulý)
  useEffect(() => {
    const svg = svgRef.current!
    const applyTransform = (t: ZoomTransform) => {
      layerRef.current?.setAttribute('transform', t.toString())
      // kroužky malých zemí drží stálou velikost na obrazovce
      const r = String(MARKER_RADIUS / t.k)
      layerRef.current?.querySelectorAll<SVGCircleElement>('circle.map__marker').forEach((c) => c.setAttribute('r', r))
    }
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [MAP_WIDTH, MAP_HEIGHT],
      ])
      .on('zoom', (event) => applyTransform(event.transform))
    zoomRef.current = behavior
    select(svg).call(behavior)
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [])

  // přiblížení na vybrané země
  const focusSignature = focusIds?.join(',') ?? ''
  useEffect(() => {
    const svg = svgRef.current
    const behavior = zoomRef.current
    if (!svg || !behavior || focusKey === undefined) return
    const shapes = (focusIds ?? []).map((id) => world.countryById.get(id)).filter((s) => s !== undefined)
    if (shapes.length === 0) {
      select(svg).call(behavior.transform, zoomIdentity)
      return
    }
    const x0 = Math.min(...shapes.map((s) => s.bounds[0][0]))
    const y0 = Math.min(...shapes.map((s) => s.bounds[0][1]))
    const x1 = Math.max(...shapes.map((s) => s.bounds[1][0]))
    const y1 = Math.max(...shapes.map((s) => s.bounds[1][1]))
    // focusFill 0.3 = vybrané země zaberou asi třetinu výřezu, aby bylo vidět i okolí; strop 9× kvůli malým ostrovům
    const k = Math.max(1, Math.min(9, focusFill / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT)))
    const t = zoomIdentity
      .translate(MAP_WIDTH / 2, MAP_HEIGHT / 2)
      .scale(k)
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    select(svg).call(behavior.transform, t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, focusSignature, world])

  const zoomBy = (factor: number) => {
    if (svgRef.current && zoomRef.current) select(svgRef.current).call(zoomRef.current.scaleBy, factor)
  }
  const resetZoom = () => {
    if (svgRef.current && zoomRef.current) select(svgRef.current).call(zoomRef.current.transform, zoomIdentity)
  }

  // popisek u kurzoru (jen pro země, které mají text v `labels`)
  const handleMove = (event: React.MouseEvent) => {
    const tip = tooltipRef.current
    if (!tip) return
    const id = (event.target as Element).getAttribute?.('data-id')
    const text = id ? labelsRef.current[id] : undefined
    if (!text) {
      tip.hidden = true
      return
    }
    const box = event.currentTarget.getBoundingClientRect()
    tip.textContent = text
    tip.hidden = false
    tip.style.left = `${event.clientX - box.left}px`
    tip.style.top = `${event.clientY - box.top}px`
  }
  const handleClick = (event: React.MouseEvent) => {
    const id = (event.target as Element).getAttribute?.('data-id')
    if (id && onCountryClick) onCountryClick(id)
  }

  const territoryPaths = useMemo(
    () => world.territories.map((t) => <path key={t.id} className="map__territory" d={t.d} />),
    [world],
  )

  return (
    <div className="map" onMouseMove={handleMove} onMouseLeave={() => tooltipRef.current && (tooltipRef.current.hidden = true)}>
      <svg
        ref={svgRef}
        className="map__svg"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="Mapa světa"
        onClick={handleClick}
      >
        <g ref={layerRef}>
          <path className="map__sphere" d={world.sphere} />
          <path className="map__graticule" d={world.graticule} />
          {showTerritories && !onlyIds && territoryPaths}
          {world.countries.map((c) => {
            if (onlyIds && !onlyIds.has(c.id)) return null
            const fill = fills[c.id]
            return (
              <path
                key={c.id}
                data-id={c.id}
                className={
                  'map__country' +
                  (fill ? ' map__country--filled' : '') +
                  (outlineIds?.has(c.id) ? ' map__country--outlined' : '') +
                  (ghostIds?.has(c.id) ? ' map__country--ghost' : '') +
                  (onCountryClick ? ' map__country--clickable' : '')
                }
                d={c.d}
                style={fill ? { fill } : undefined}
              />
            )
          })}
          {markerCountries.map((c) => {
            if (onlyIds && !onlyIds.has(c.id)) return null
            const [x, y] = world.project(c.centroid)
            const fill = fills[c.id]
            return (
              <circle
                key={c.id}
                data-id={c.id}
                className={
                  'map__marker' +
                  (fill ? ' map__marker--filled' : '') +
                  (outlineIds?.has(c.id) ? ' map__marker--outlined' : '') +
                  (ghostIds?.has(c.id) ? ' map__country--ghost' : '') +
                  (onCountryClick ? ' map__country--clickable' : '')
                }
                cx={x}
                cy={y}
                r={MARKER_RADIUS}
                style={fill ? { fill } : undefined}
              />
            )
          })}
        </g>
      </svg>
      <div className="map__controls">
        <button type="button" onClick={() => zoomBy(1.8)} aria-label="Přiblížit" title="Přiblížit">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.8)} aria-label="Oddálit" title="Oddálit">
          −
        </button>
        <button type="button" onClick={resetZoom} aria-label="Celý svět" title="Celý svět">
          ⤢
        </button>
      </div>
      <div ref={tooltipRef} className="map__tooltip" hidden />
    </div>
  )
})
