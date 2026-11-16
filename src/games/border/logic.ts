// Herní logika hry Nakresli hranici: výběr země, hodnocení překryvu nakresleného a skutečného tvaru.
// Čisté funkce bez závislosti na UI a bez canvasu (tvary se rastrují vlastní funkcí, takže jdou testovat v Node).
import { COUNTRIES } from '../../shared/data'
import { dailyPick, randomPick } from '../../shared/random'
import type { GameMode } from '../../shared/types'

export const GAME_ID = 'border'

export type Point = [number, number]
/** Uzavřený obrys: seznam bodů, poslední se spojí s prvním. */
export type Ring = Point[]
/** Obdélník, ve kterém se tvary porovnávají. */
export interface Frame {
  x0: number
  y0: number
  x1: number
  y1: number
}

/** Obtížnost: context = je vidět okolí a bílé místo, kam země patří; memory = prázdný papír. */
export type Difficulty = 'context' | 'memory'

/** Rozlišení mřížky pro porovnání tvarů (GRID × GRID bodů). */
export const GRID = 240
/** Nejmenší počet bodů tahu, aby šel vyhodnotit. */
export const MIN_POINTS = 8

export const DRAWABLE_IDS = COUNTRIES.filter((c) => c.drawable).map((c) => c.id)

export function pickTarget(mode: GameMode, dateKey: string, random: () => number = Math.random): string {
  return mode === 'daily' ? dailyPick(GAME_ID, dateKey, DRAWABLE_IDS) : randomPick(DRAWABLE_IDS, random)
}

/**
 * Převede obrysy na mřížku GRID × GRID: 1 = bod leží uvnitř tvaru.
 * rule 'evenodd' se hodí pro skutečné hranice (díry v území, např. Lesotho v JAR),
 * 'nonzero' pro tah rukou (smyčky a překřížení se vyplní celé).
 */
export function rasterize(rings: readonly Ring[], frame: Frame, rule: 'evenodd' | 'nonzero' = 'evenodd', size = GRID): Uint8Array {
  const mask = new Uint8Array(size * size)
  const sx = size / (frame.x1 - frame.x0)
  const sy = size / (frame.y1 - frame.y0)
  // hrany všech obrysů v souřadnicích mřížky
  const edges: { x0: number; y0: number; x1: number; y1: number; dir: number }[] = []
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const ay = (a[1] - frame.y0) * sy
      const by = (b[1] - frame.y0) * sy
      if (ay === by) continue
      edges.push({ x0: (a[0] - frame.x0) * sx, y0: ay, x1: (b[0] - frame.x0) * sx, y1: by, dir: by > ay ? 1 : -1 })
    }
  }
  for (let row = 0; row < size; row++) {
    const y = row + 0.5
    // průsečíky řádku s hranami, zleva doprava
    const crossings: { x: number; dir: number }[] = []
    for (const e of edges) {
      const lo = Math.min(e.y0, e.y1)
      const hi = Math.max(e.y0, e.y1)
      if (y < lo || y >= hi) continue
      crossings.push({ x: e.x0 + ((y - e.y0) / (e.y1 - e.y0)) * (e.x1 - e.x0), dir: e.dir })
    }
    crossings.sort((p, q) => p.x - q.x)
    let winding = 0
    for (let i = 0; i < crossings.length - 1; i++) {
      winding += crossings[i].dir
      const inside = rule === 'evenodd' ? (i + 1) % 2 === 1 : winding !== 0
      if (!inside) continue
      const from = Math.max(0, Math.ceil(crossings[i].x - 0.5))
      const to = Math.min(size - 1, Math.floor(crossings[i + 1].x - 0.5))
      for (let col = from; col <= to; col++) mask[row * size + col] = 1
    }
  }
  return mask
}

/** Počet vyplněných bodů a jejich těžiště (v souřadnicích mřížky). */
export function maskStats(mask: Uint8Array, size = GRID): { count: number; cx: number; cy: number } {
  let count = 0, sumX = 0, sumY = 0
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue
    count++
    sumX += i % size
    sumY += Math.floor(i / size)
  }
  return { count, cx: count ? sumX / count : 0, cy: count ? sumY / count : 0 }
}

/** Překryv dvou tvarů: plocha průniku dělená plochou sjednocení (0 = nic společného, 1 = totožné). */
export function iou(a: Uint8Array, b: Uint8Array): number {
  let both = 0, either = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] && b[i]) both++
    if (a[i] || b[i]) either++
  }
  return either === 0 ? 0 : both / either
}

/** Hodnocení na místě: tah se porovná se skutečným tvarem přesně tam, kde byl nakreslen. */
export function scoreInPlace(target: readonly Ring[], drawn: Ring, frame: Frame): number {
  return iou(rasterize(target, frame, 'evenodd'), rasterize([drawn], frame, 'nonzero'))
}

const boundsOf = (rings: readonly Ring[]): Frame => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const ring of rings) for (const [x, y] of ring) {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  return { x0, y0, x1, y1 }
}

const squareAround = (b: Frame, margin = 0.02): Frame => {
  const side = Math.max(b.x1 - b.x0, b.y1 - b.y0) * (1 + 2 * margin) || 1
  const cx = (b.x0 + b.x1) / 2
  const cy = (b.y0 + b.y1) / 2
  return { x0: cx - side / 2, y0: cy - side / 2, x1: cx + side / 2, y1: cy + side / 2 }
}

/**
 * Hodnocení z paměti: nezáleží na tom, kde a jak velký tvar hráč nakreslil.
 * Tah se nejdřív posune a zvětší tak, aby měl stejné těžiště a stejnou plochu jako skutečný tvar
 * (bez otáčení), a teprve potom se spočítá překryv. Vrací i přepočítaný tah pro zobrazení.
 */
export function scoreNormalized(target: readonly Ring[], drawn: Ring): { score: number; fitted: Ring } {
  // každý tvar zvlášť ve vlastním čtverci, abychom zjistili plochu a těžiště ve skutečných souřadnicích
  const measure = (rings: readonly Ring[], rule: 'evenodd' | 'nonzero') => {
    const frame = squareAround(boundsOf(rings))
    const stats = maskStats(rasterize(rings, frame, rule))
    const cell = (frame.x1 - frame.x0) / GRID
    return { area: stats.count * cell * cell, cx: frame.x0 + (stats.cx + 0.5) * cell, cy: frame.y0 + (stats.cy + 0.5) * cell }
  }
  const t = measure(target, 'evenodd')
  const d = measure([drawn], 'nonzero')
  if (d.area === 0 || t.area === 0) return { score: 0, fitted: drawn }
  const scale = Math.sqrt(t.area / d.area)
  const fitted: Ring = drawn.map(([x, y]) => [t.cx + (x - d.cx) * scale, t.cy + (y - d.cy) * scale])
  const frame = squareAround(boundsOf([...target, fitted]))
  return { score: iou(rasterize(target, frame, 'evenodd'), rasterize([fitted], frame, 'nonzero')), fitted }
}

/** Hranice hvězdiček: překryv aspoň 35 % = 2 hvězdičky, 50 % = 3, 65 % = 4, 80 % = 5. */
export const STAR_THRESHOLDS = [0.35, 0.5, 0.65, 0.8]
/** Od tří hvězdiček se kolo počítá jako úspěch (kvůli statistikám a sérii). */
export const WIN_STARS = 3

export function starsFor(score: number): number {
  return 1 + STAR_THRESHOLDS.filter((t) => score >= t).length
}

export const STAR_TEXT = ['', 'To chce ještě trénink', 'Základní tvar tam je', 'Slušná práce', 'Velmi dobře', 'Skoro jako kartograf'] as const

export const starString = (stars: number) => '★'.repeat(stars) + '☆'.repeat(5 - stars)

/** Zjednoduší tah: vynechá body, které jsou blíž než `minDistance` od předchozího ponechaného bodu. */
export function thinPath(points: readonly Point[], minDistance: number): Ring {
  const out: Ring = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= minDistance) out.push(p)
  }
  return out
}

/** Text ke sdílení. Zemi neprozrazuje (denní výzva je pro všechny stejná). */
export function buildShareText(label: string, score: number, difficulty: Difficulty): string {
  const stars = starsFor(score)
  return [`GeoHry: Nakresli hranici (${label})`, `${Math.round(score * 100)} % ${starString(stars)}`, difficulty === 'memory' ? 'z paměti, bez mapy' : 's mapou okolí'].join('\n')
}
