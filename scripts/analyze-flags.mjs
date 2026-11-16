// Automatický rozbor vlajek: vykreslí každé SVG z public/flags/ a spočítá,
// jaký podíl plochy zabírají jednotlivé barvy a jestli je vlajka složená jen z pruhů.
// Výsledek: scripts/sources/flag-colors.json (je v gitu; build-data.mjs ho jen čte).
// Spuštění: npm run flags   (potřeba jen při změně souborů vlajek)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FLAGS = path.join(ROOT, 'public/flags')
const WIDTH = 480 // vlajky jsou 4:3, tedy 480×360 bodů

/** Zařadí barvu bodu do pojmenované skupiny. null = nezařazeno (šedá, hnědá, fialová, růžová...). */
export function classify(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const v = max / 255
  const s = max === 0 ? 0 : (max - min) / max
  let h = 0
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) * 60
    else if (max === g) h = ((b - r) / (max - min)) * 60 + 120
    else h = ((r - g) / (max - min)) * 60 + 240
    if (h < 0) h += 360
  }
  if (v < 0.22) return 'black'
  if (s < 0.16) return v > 0.8 ? 'white' : v < 0.35 ? 'black' : null
  if (h < 14 || h >= 330) return 'red'
  if (h < 40) return v < 0.62 ? null /* hnědá */ : 'orange'
  if (h < 70) return 'yellow'
  if (h < 170) return 'green'
  if (h < 262) return 'blue'
  return null // fialová
}

const out = {}
for (const file of fs.readdirSync(FLAGS).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = fs.readFileSync(path.join(FLAGS, file))
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH }, background: '#ffffff', shapeRendering: 1 /* ostré hrany: vyhlazování by na hranách míchalo neexistující barvy */ }).render()
  const { width, height, pixels } = img
  const counts = {}
  const rowUniform = [] // je řádek jednobarevný?
  const colKeys = Array.from({ length: width }, () => new Map())
  for (let y = 0; y < height; y++) {
    const rowKeys = new Map()
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const c = classify(pixels[i], pixels[i + 1], pixels[i + 2]) ?? 'other'
      counts[c] = (counts[c] ?? 0) + 1
      rowKeys.set(c, (rowKeys.get(c) ?? 0) + 1)
      colKeys[x].set(c, (colKeys[x].get(c) ?? 0) + 1)
    }
    rowUniform.push(Math.max(...rowKeys.values()) / width)
  }
  const colUniform = colKeys.map((m) => Math.max(...m.values()) / height)
  // "jen pruhy" = skoro každý řádek (sloupec) je jednobarevný; tolerance kvůli vyhlazeným hranám
  const share = (arr) => arr.filter((u) => u > 0.985).length / arr.length
  const total = width * height
  const shares = Object.fromEntries(
    Object.entries(counts).map(([k, n]) => [k, Number(((n / total) * 100).toFixed(1))]).filter(([, p]) => p >= 0.3).sort((a, b) => b[1] - a[1]),
  )
  const distinct = Object.keys(shares).filter((k) => k !== 'other' && shares[k] >= 3).length
  out[file.replace('.svg', '')] = {
    shares,
    onlyHorizontal: distinct >= 2 && share(rowUniform) > 0.93,
    onlyVertical: distinct >= 2 && share(colUniform) > 0.93,
  }
}
fs.writeFileSync(path.join(ROOT, 'scripts/sources/flag-colors.json'), JSON.stringify(out, null, 1) + '\n')
console.log('Rozebráno', Object.keys(out).length, 'vlajek -> scripts/sources/flag-colors.json')
