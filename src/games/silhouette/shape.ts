// Obrys země pro hru Silueta: vlastní projekce vystředěná na zemi, aby tvar nebyl zkreslený.
import { geoAzimuthalEqualArea, geoCentroid, geoPath } from 'd3-geo'
import type { World } from '../../shared/world'

export const SHAPE_WIDTH = 900
export const SHAPE_HEIGHT = 640

/** SVG cesta celé země (včetně ostrovů) roztažená do plochy SHAPE_WIDTH × SHAPE_HEIGHT. */
export function silhouettePath(world: World, countryId: string): string {
  const feature = world.features.get(countryId)
  if (!feature) throw new Error('Chybí geometrie země ' + countryId)
  const [lon, lat] = geoCentroid(feature)
  const projection = geoAzimuthalEqualArea()
    .rotate([-lon, -lat])
    .fitExtent(
      [
        [50, 50],
        [SHAPE_WIDTH - 50, SHAPE_HEIGHT - 50],
      ],
      feature,
    )
  return geoPath(projection).digits(1)(feature) ?? ''
}
