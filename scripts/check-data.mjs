// Kontrola vygenerovaných dat. Spouští se automaticky po `npm run data`.
// Když něco nesedí, vypíše chyby a skončí s chybovým kódem.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const countries = readJson('src/data/countries.json')
const distances = readJson('src/data/distances.json')
const topo = readJson('src/data/world.topo.json')

const errors = []
const check = (ok, msg) => { if (!ok) errors.push(msg) }

// stejná normalizace jako v aplikaci (src/shared/normalize.ts)
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

check(countries.length === 197, `Počet zemí je ${countries.length}, má být 197`)
check(countries.filter((c) => c.unMember).length === 193, 'Členů OSN má být 193')

const byId = new Map(countries.map((c) => [c.id, c]))
check(byId.size === countries.length, 'Duplicitní kódy zemí')

const CONTINENTS = ['Evropa', 'Asie', 'Afrika', 'Severní Amerika', 'Jižní Amerika', 'Austrálie a Oceánie']
const seenNames = new Map()
for (const c of countries) {
  check(c.name && c.name.trim().length > 0, `${c.id}: chybí český název`)
  check(c.capital && c.capital.length > 0, `${c.id}: chybí hlavní město`)
  check(CONTINENTS.includes(c.continent), `${c.id}: neznámý kontinent ${c.continent}`)
  check(c.population > 0, `${c.id}: chybí populace`)
  check(c.area > 0, `${c.id}: chybí rozloha`)
  check(c.avgTemp === null ? c.id === 'TWN' : c.avgTemp > -10 && c.avgTemp < 32, `${c.id}: chybí nebo je podezřelá průměrná teplota (${c.avgTemp})`)
  check(Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180, `${c.id}: špatné souřadnice`)
  check(fs.existsSync(path.join(ROOT, 'public/flags', c.iso2 + '.svg')), `${c.id}: chybí vlajka`)
  check(c.flag && c.flag.colors.length >= 2 && c.flag.colors.length <= 6, `${c.id}: podezřelý počet barev vlajky (${c.flag?.colors})`)
  // každý název i alias smí patřit jen jedné zemi
  for (const n of [c.name, ...c.aliases]) {
    const key = normalize(n)
    check(key.length > 0, `${c.id}: prázdný název/alias`)
    if (seenNames.has(key) && seenNames.get(key) !== c.id) errors.push(`Název "${n}" mají dvě země: ${seenNames.get(key)} a ${c.id}`)
    seenNames.set(key, c.id)
  }
  // sousedé: existují a jsou symetričtí
  for (const n of c.neighbors) {
    check(byId.has(n), `${c.id}: soused ${n} není v seznamu zemí`)
    check(byId.get(n)?.neighbors.includes(c.id), `Nesymetrické sousedství ${c.id} -> ${n}`)
  }
  check(!c.neighbors.includes(c.id), `${c.id} sousedí sama se sebou`)
  for (const n of c.overseasNeighbors) {
    check(byId.get(n)?.overseasNeighbors.includes(c.id), `Nesymetrické zámořské sousedství ${c.id} -> ${n}`)
    check(!c.neighbors.includes(n), `${c.id}: ${n} je v běžných i zámořských sousedech`)
  }
}

// geometrie
const geo = feature(topo, topo.objects.countries).features
const geoIds = new Set(geo.map((f) => f.id))
for (const c of countries) check(geoIds.has(c.id), `${c.id}: chybí geometrie na mapě`)
check(geo.length === countries.length, 'Počet geometrií nesedí s počtem zemí')

// matice vzdáleností
check(distances.ids.length === countries.length, 'Matice vzdáleností má jiný počet zemí')
check(distances.ids.every((id, i) => id === countries[i].id), 'Pořadí zemí v matici neodpovídá countries.json')
for (let i = 0; i < distances.ids.length; i++) {
  check(distances.km[i][i] === 0, `Vzdálenost ${distances.ids[i]} k sobě není 0`)
  for (let j = i + 1; j < distances.ids.length; j++) {
    const d = distances.km[i][j]
    check(d === distances.km[j][i], `Matice není symetrická: ${distances.ids[i]}-${distances.ids[j]}`)
    check(Number.isInteger(d) && d >= 0 && d < 20100, `Podezřelá vzdálenost ${distances.ids[i]}-${distances.ids[j]}: ${d}`)
    const neighbors = countries[i].neighbors.includes(countries[j].id)
    check((d === 0) === neighbors, `Vzdálenost 0 musí znamenat sousedství: ${distances.ids[i]}-${distances.ids[j]} (${d} km)`)
  }
}

if (errors.length) {
  console.error(`KONTROLA DAT SELHALA (${errors.length} chyb):`)
  for (const e of errors.slice(0, 50)) console.error('  - ' + e)
  process.exit(1)
}
const islands = countries.filter((c) => c.neighbors.length === 0).length
console.log(`Kontrola dat OK: ${countries.length} zemí, ${islands} bez pozemního souseda, ${seenNames.size} názvů a aliasů.`)
