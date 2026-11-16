import { flagUrl } from '../data'
import type { Country } from '../types'

/** Obrázek vlajky. `decorative` = vlajka jen doplňuje text vedle sebe, čtečka ji přeskočí. */
export function Flag({ country, className = '', decorative = true }: { country: Country; className?: string; decorative?: boolean }) {
  return <img className={'flag ' + className} src={flagUrl(country)} alt={decorative ? '' : `Vlajka: ${country.name}`} loading="lazy" draggable={false} />
}
