// Načtení mapy světa a příprava tvarů pro vykreslení.
// Mapa je velká (~700 kB), proto se načítá až ve chvíli, kdy ji některá hra potřebuje.
import { geoNaturalEarth1, geoPath, geoGraticule10, type GeoProjection } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'

/** Rozměry kreslicí plochy mapy (jednotky SVG viewBoxu). */
export const MAP_WIDTH = 2000
export const MAP_HEIGHT = 1010

export interface WorldShape {
  id: string
  /** SVG cesta (atribut d). */
  d: string
  /** Ohraničení tvaru v jednotkách viewBoxu: [[x0, y0], [x1, y1]]. */
  bounds: [[number, number], [number, number]]
}

export interface World {
  /** Hratelné země. */
  countries: WorldShape[]
  /** Ostatní území (Grónsko, Západní Sahara, ...), mají navíc český název. */
  territories: (WorldShape & { name: string })[]
  countryById: Map<string, WorldShape>
  /** GeoJSON hratelných zemí (pro hry, které potřebují přímo geometrii). */
  features: Map<string, Feature<Geometry>>
  /** GeoJSON nehratelných území (pro hry, které si kreslí vlastní výřez mapy). */
  territoryFeatures: Feature<Geometry>[]
  /** Obrys celé zeměkoule a síť poledníků a rovnoběžek. */
  sphere: string
  graticule: string
  projection: GeoProjection
  /** Převod [lon, lat] na souřadnice viewBoxu. */
  project: (lonLat: [number, number]) => [number, number]
}

let worldPromise: Promise<World> | null = null

export function loadWorld(): Promise<World> {
  worldPromise ??= import('../data/world.topo.json?raw').then((mod) => buildWorld(JSON.parse(mod.default) as Topology))
  return worldPromise
}

function buildWorld(topo: Topology): World {
  const projection = geoNaturalEarth1().fitExtent(
    [
      [8, 8],
      [MAP_WIDTH - 8, MAP_HEIGHT - 8],
    ],
    { type: 'Sphere' },
  )
  const path = geoPath(projection).digits(1)

  const toShapes = (name: 'countries' | 'territories') => {
    const fc = feature(topo, topo.objects[name] as GeometryCollection) as FeatureCollection<Geometry, { name?: string }>
    return fc.features.map((f) => ({
      feature: f,
      shape: { id: String(f.id), d: path(f) ?? '', bounds: path.bounds(f) as WorldShape['bounds'] },
    }))
  }
  const countries = toShapes('countries')
  const territories = toShapes('territories')

  return {
    countries: countries.map((c) => c.shape),
    territories: territories.map((t) => ({ ...t.shape, name: t.feature.properties?.name ?? '' })),
    countryById: new Map(countries.map((c) => [c.shape.id, c.shape])),
    features: new Map(countries.map((c) => [c.shape.id, c.feature])),
    territoryFeatures: territories.map((t) => t.feature),
    sphere: path({ type: 'Sphere' }) ?? '',
    graticule: path(geoGraticule10()) ?? '',
    projection,
    project: (lonLat) => projection(lonLat) as [number, number],
  }
}
