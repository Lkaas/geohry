import type { Country } from './types'

const EARTH_RADIUS_KM = 6371
const rad = (deg: number) => (deg * Math.PI) / 180

/** Vzdálenost mezi středy dvou zemí v km (po povrchu Země). */
export function centerDistanceKm(a: Country, b: Country): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h))))
}

/** Počáteční směr (azimut) ze středu země `from` ke středu země `to`, ve stupních: 0 = sever, 90 = východ. */
export function bearingDeg(from: Country, to: Country): number {
  const lat1 = rad(from.lat)
  const lat2 = rad(to.lat)
  const dLon = rad(to.lon - from.lon)
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const COMPASS = [
  { arrow: '⬆️', label: 'sever' },
  { arrow: '↗️', label: 'severovýchod' },
  { arrow: '➡️', label: 'východ' },
  { arrow: '↘️', label: 'jihovýchod' },
  { arrow: '⬇️', label: 'jih' },
  { arrow: '↙️', label: 'jihozápad' },
  { arrow: '⬅️', label: 'západ' },
  { arrow: '↖️', label: 'severozápad' },
] as const

/** Převede azimut na jednu z osmi světových stran (šipka + český název). */
export function compass(bearing: number): { arrow: string; label: string } {
  return COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]
}

const numberFormat = new Intl.NumberFormat('cs-CZ')

/** 1234567 -> "1 234 567" */
export function formatNumber(n: number): string {
  return numberFormat.format(n)
}

export function formatKm(km: number): string {
  return `${formatNumber(km)} km`
}
