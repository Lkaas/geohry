/** Hash textu na 32bitové číslo (FNV-1a). Stejný text dá vždy stejné číslo. */
export function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Generátor náhodných čísel 0–1 se zadaným semínkem (mulberry32). Stejné semínko = stejná posloupnost. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Vrátí zamíchanou kopii pole (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function randomPick<T>(items: readonly T[], random: () => number = Math.random): T {
  return items[Math.floor(random() * items.length)]
}

/** Dnešní datum podle místního času jako "2026-11-16". Podle něj se určuje denní výzva. */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Pořadové číslo dne (počet dní od 1. 1. 2026). */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 86_400_000)
}

/** "2026-11-16" -> "2026-11-15" */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d - 1))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

/** "2026-11-16" -> "16. 11. 2026" */
export function formatDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return `${d}. ${m}. ${y}`
}

/**
 * Vybere položku pro denní výzvu. Všichni hráči dostanou ve stejný den stejnou položku.
 * Položky se berou postupně ze zamíchaného seznamu, takže se žádná nezopakuje,
 * dokud se nevystřídají všechny. Pak se seznam zamíchá znovu jinak.
 */
export function dailyPick<T>(gameId: string, key: string, items: readonly T[]): T {
  const day = dayNumber(key)
  const cycle = Math.floor(day / items.length)
  const position = ((day % items.length) + items.length) % items.length
  const order = shuffled(items, seededRandom(hashString(`${gameId}#${cycle}`)))
  return order[position]
}

/** Generátor náhodných čísel pro denní výzvu (pro hry, které potřebují víc než jeden výběr). */
export function dailyRandom(gameId: string, key: string): () => number {
  return seededRandom(hashString(`${gameId}@${key}`))
}
