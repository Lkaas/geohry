// Příprava výřezu mapy pro hru Nakresli hranici: vlastní projekce vystředěná na hledanou zemi.
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoPath } from 'd3-geo'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import type { World } from '../../shared/world'
import type { Frame, Ring } from './logic'

/** Rozměry kreslicí plochy (jednotky SVG viewBoxu). */
export const VIEW_WIDTH = 900
export const VIEW_HEIGHT = 640
export const VIEW_FRAME: Frame = { x0: 0, y0: 0, x1: VIEW_WIDTH, y1: VIEW_HEIGHT }

export interface Scene {
  /** Obrysy hlavní části hledané země v souřadnicích výřezu (vnější obrys + případné díry). */
  targetRings: Ring[]
  /** Totéž jako SVG cesta. */
  targetPath: string
  /** Ostatní pevnina ve výřezu (sousedé, další země a území). */
  contextPaths: string[]
  /** Další části hledané země (ostrovy, oddělená území), které se nekreslí. Prázdný řetězec, když žádné nejsou. */
  otherPartsPath: string
  /** "Bílé místo": obdélník, který v lehčí obtížnosti zakrývá hledanou zemi a její nejbližší okolí. */
  box: { x: number; y: number; width: number; height: number }
}

/** Rozdělí zemi na největší souvislý kus (ten se kreslí) a zbytek. */
function splitMainPart(feature: Feature): { main: Feature<Polygon>; rest: Feature<MultiPolygon> | null } {
  const geometry = feature.geometry as Polygon | MultiPolygon
  const polygons: Position[][][] = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let best = 0
  let bestArea = -1
  polygons.forEach((coordinates, i) => {
    const area = geoArea({ type: 'Polygon', coordinates })
    if (area > bestArea) {
      bestArea = area
      best = i
    }
  })
  const others = polygons.filter((_, i) => i !== best)
  return {
    main: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: polygons[best] } },
    rest: others.length ? { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: others } } : null,
  }
}

export function buildScene(world: World, targetId: string): Scene {
  const feature = world.features.get(targetId)
  if (!feature) throw new Error('Chybí geometrie země ' + targetId)
  const { main, rest } = splitMainPart(feature)

  // Plochojevná azimutální projekce se středem v zemi: tvar vypadá přirozeně i u zemí daleko od rovníku.
  const [lon, lat] = geoCentroid(main)
  const projection = geoAzimuthalEqualArea()
    .rotate([-lon, -lat])
    .clipAngle(80)
    // země zabere zhruba prostřední polovinu výřezu, aby bylo vidět okolí
    .fitExtent(
      [
        [VIEW_WIDTH * 0.24, VIEW_HEIGHT * 0.24],
        [VIEW_WIDTH * 0.76, VIEW_HEIGHT * 0.76],
      ],
      main,
    )
    .clipExtent([
      [0, 0],
      [VIEW_WIDTH, VIEW_HEIGHT],
    ])
  const path = geoPath(projection).digits(1)

  const contextPaths: string[] = []
  for (const [id, f] of world.features) {
    if (id === targetId) continue
    const d = path(f)
    if (d) contextPaths.push(d)
  }
  for (const f of world.territoryFeatures) {
    const d = path(f)
    if (d) contextPaths.push(d)
  }

  const [[x0, y0], [x1, y1]] = path.bounds(main)
  const pad = Math.max(18, Math.max(x1 - x0, y1 - y0) * 0.09)

  return {
    targetRings: main.geometry.coordinates.map((ring) => ring.slice(0, -1).map((p) => projection(p as [number, number]) as [number, number])),
    targetPath: path(main) ?? '',
    contextPaths,
    otherPartsPath: rest ? (path(rest) ?? '') : '',
    box: { x: x0 - pad, y: y0 - pad, width: x1 - x0 + 2 * pad, height: y1 - y0 + 2 * pad },
  }
}
