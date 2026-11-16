// Formátování čísel pro zobrazení (česky, s desetinnou čárkou a mezerou mezi tisíci).
const decimal = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const twoDecimals = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const whole = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

/** 10 886 878 -> "10,9 mil.", 1 463 865 525 -> "1,46 mld.", 9 492 -> "9,5 tis.", 825 -> "825" */
export function formatPopulation(n: number): string {
  if (n >= 1e9) return `${twoDecimals.format(n / 1e9)} mld.`
  if (n >= 1e6) return `${decimal.format(n / 1e6)} mil.`
  if (n >= 1e3) return `${decimal.format(n / 1e3)} tis.`
  return whole.format(n)
}

export function formatArea(km2: number): string {
  return `${km2 < 100 ? decimal.format(km2) : whole.format(km2)} km²`
}

export function formatTemperature(celsius: number | null): string {
  return celsius === null ? 'údaj chybí' : `${decimal.format(celsius)} °C`
}

/** Částka v USD: 27,36 bil. USD (bilion = milion milionů), 330,9 mld. USD, 62,3 mil. USD */
export function formatUsd(amount: number): string {
  if (amount >= 1e12) return `${twoDecimals.format(amount / 1e12)} bil. USD`
  if (amount >= 1e9) return `${decimal.format(amount / 1e9)} mld. USD`
  if (amount >= 1e6) return `${decimal.format(amount / 1e6)} mil. USD`
  return `${whole.format(amount)} USD`
}

/** Celé číslo s jednotkou, zaokrouhlené na tři platné číslice: 30 386 -> "30 400 USD" */
export function formatRounded(value: number, unit: string): string {
  const digits = Math.max(0, Math.floor(Math.log10(Math.abs(value) || 1)) - 2)
  const step = 10 ** digits
  const rounded = Math.round(value / step) * step
  return `${rounded < 10 ? decimal.format(value) : whole.format(rounded)} ${unit}`
}
