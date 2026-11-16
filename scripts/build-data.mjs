// Sestaví všechna data pro hry do src/data/ a zkopíruje vlajky do public/flags/.
// Spuštění: npm run data   (internet není potřeba, vše se bere z node_modules a scripts/sources)
//
// Výstupy:
//   src/data/countries.json   seznam 197 zemí (názvy, aliasy, hlavní město, kontinent, populace, teplota, rozloha, střed, sousedé)
//   src/data/world.topo.json  mapa světa (TopoJSON): objekt "countries" = hratelné země, "territories" = ostatní území
//   src/data/distances.json   matice nejkratších vzdáleností mezi hranicemi zemí v km
//   public/flags/<iso2>.svg   vlajky
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { feature, merge } from 'topojson-client'
import { topology } from 'topojson-server'
import { geoCentroid, geoDistance, geoInterpolate, geoArea } from 'd3-geo'
import { NAME_OVERRIDES, ALIASES, TERRITORY_NAMES } from './sources/names-cs.mjs'
import { CAPITALS } from './sources/capitals-cs.mjs'
import { REMOVE_BORDERS, ADD_BORDERS, OVERSEAS_BORDERS } from './sources/borders-fix.mjs'
import * as FLAGS from './sources/flags-manual.mjs'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const EARTH_RADIUS_KM = 6371

// ---------------------------------------------------------------------------
// 1) Seznam zemí: 193 členů OSN + Vatikán, Kosovo, Tchaj-wan, Palestina = 197
// ---------------------------------------------------------------------------
const allCountries = require('world-countries') // dataset mledoze/countries
const EXTRA = ['UNK', 'TWN', 'PSE', 'VAT']
// Pozn.: world-countries má u Vatikánu unMember=true (je jen pozorovatel), proto ho řešíme ručně.
const gameSource = allCountries
  .filter((c) => (c.unMember && c.cca3 !== 'VAT') || EXTRA.includes(c.cca3))
  .sort((a, b) => a.cca3.localeCompare(b.cca3))
const gameIds = new Set(gameSource.map((c) => c.cca3))
const byNumeric = new Map(allCountries.filter((c) => c.ccn3).map((c) => [c.ccn3, c]))

const population = readJson(path.join(ROOT, 'scripts/sources/population.json'))
const temperature = readJson(path.join(ROOT, 'scripts/sources/temperature.json'))
const gdp = readJson(path.join(ROOT, 'scripts/sources/gdp.json'))
const flagColors = readJson(path.join(ROOT, 'scripts/sources/flag-colors.json'))

const FLAG_COLOR_ORDER = ['red', 'white', 'blue', 'green', 'yellow', 'black', 'orange']
const FLAG_COLOR_MIN_SHARE = 1 // barva musí zabírat aspoň 1 % plochy vlajky

/** Údaje o vlajce: barvy (automaticky + ruční opravy), jen pruhy (automaticky), symboly (ručně). */
function flagInfo(id, iso2) {
  const auto = flagColors[iso2]
  if (!auto) throw new Error('Chybí rozbor vlajky: ' + id + ' (spusť npm run flags)')
  const colors = new Set(Object.entries(auto.shares).filter(([c, share]) => FLAG_COLOR_ORDER.includes(c) && share >= FLAG_COLOR_MIN_SHARE).map(([c]) => c))
  for (const c of FLAGS.COLOR_REMOVE[id] ?? []) colors.delete(c)
  for (const c of FLAGS.COLOR_ADD[id] ?? []) colors.add(c)
  // podíl plochy každé barvy v procentech, přepočtený tak, aby barvy vlajky dávaly dohromady 100
  // (drobné detaily znaků a nezařazené odstíny se rozpustí)
  const list = FLAG_COLOR_ORDER.filter((c) => colors.has(c))
  const raw = list.map((c) => auto.shares[c] ?? 0.5)
  const total = raw.reduce((a, b) => a + b, 0)
  const shares = Object.fromEntries(list.map((c, i) => [c, Math.max(1, Math.round((raw[i] / total) * 100))]))
  return {
    colors: list,
    shares,
    // vlajka složená jen z vodorovných / jen ze svislých pruhů
    stripes: auto.onlyHorizontal ? 'horizontal' : auto.onlyVertical ? 'vertical' : null,
    star: FLAGS.STAR.includes(id),
    sun: FLAGS.SUN.includes(id),
    crescent: FLAGS.CRESCENT.includes(id),
    cross: FLAGS.CROSS.includes(id),
    animal: FLAGS.ANIMAL.includes(id),
    text: FLAGS.TEXT.includes(id),
    hoistTriangle: FLAGS.HOIST_TRIANGLE.includes(id),
  }
}
for (const list of [FLAGS.STAR, FLAGS.SUN, FLAGS.CRESCENT, FLAGS.CROSS, FLAGS.ANIMAL, FLAGS.TEXT, FLAGS.HOIST_TRIANGLE, Object.keys(FLAGS.COLOR_REMOVE), Object.keys(FLAGS.COLOR_ADD)]) {
  for (const id of list) if (!gameIds.has(id)) throw new Error('flags-manual.mjs: neznámý kód země ' + id)
  if (new Set(list).size !== list.length) throw new Error('flags-manual.mjs: některý kód je v seznamu dvakrát')
}

function continentOf(c) {
  if (c.region === 'Europe') return 'Evropa'
  if (c.region === 'Asia') return 'Asie'
  if (c.region === 'Africa') return 'Afrika'
  if (c.region === 'Oceania') return 'Austrálie a Oceánie'
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'Jižní Amerika' : 'Severní Amerika'
  throw new Error('Neznámý region: ' + c.cca3 + ' ' + c.region)
}

// ---------------------------------------------------------------------------
// 2) Geometrie: Natural Earth 1:50m (balíček world-atlas) + úpravy
// ---------------------------------------------------------------------------
const topo50 = readJson(require.resolve('world-atlas/countries-50m.json'))
const topo10 = readJson(require.resolve('world-atlas/countries-10m.json'))

// Území bez ISO kódu v Natural Earth: kam patří
const NO_ID_TARGET = { Kosovo: 'UNK', Somaliland: 'SOM', 'N. Cyprus': 'CYP' }

/** Jednotka = výsledný útvar na mapě. polys = pole polygonů ve formátu TopoJSON (pole prstenců z oblouků). */
const units = new Map()
function unit(id, name) {
  if (!units.has(id)) units.set(id, { id, name, polys: [] })
  return units.get(id)
}

const polyCentroid = (polyArcs) => geoCentroid(feature(topo50, { type: 'Polygon', arcs: polyArcs }))

/** Pravidla pro přesun jednotlivých polygonů jinam, než kam je řadí Natural Earth. */
function reassign(ownerId, polyArcs) {
  if (ownerId === 'RUS') {
    // Krym: Natural Earth ho ve výchozí verzi kreslí k Rusku, mezinárodně uznané hranice ho řadí k Ukrajině.
    const [lon, lat] = polyCentroid(polyArcs)
    if (lon > 32 && lon < 37 && lat > 44 && lat < 46.3) return 'UKR'
  }
  if (ownerId === 'FRA') {
    // Zámořské departementy odpojíme, jinak by Francie "sousedila" s Brazílií a měla nulovou vzdálenost k Jižní Americe.
    const [lon, lat] = polyCentroid(polyArcs)
    if (lon > -10 && lon < 12 && lat > 40 && lat < 52) return 'FRA'
    if (lon < -50 && lat < 8) return 'X_GUF'
    if (lon > 50) return 'X_REU'
    if (lon > 40) return 'X_MYT'
    if (lat < 15.3) return 'X_MTQ'
    return 'X_GLP'
  }
  if (ownerId === 'NLD') {
    const [lon] = polyCentroid(polyArcs)
    if (lon < -30) return 'X_BES'
  }
  if (ownerId === 'NZL') {
    const [, lat] = polyCentroid(polyArcs)
    if (lat > -25) return 'X_TKL'
  }
  return ownerId
}

for (const g of topo50.objects.countries.geometries) {
  let ownerId
  let name
  if (g.id && byNumeric.has(g.id)) {
    const c = byNumeric.get(g.id)
    ownerId = c.cca3
    name = c.translations.ces?.common ?? c.name.common
  } else if (NO_ID_TARGET[g.properties.name]) {
    ownerId = NO_ID_TARGET[g.properties.name]
  } else {
    ownerId = 'X_' + g.properties.name.replace(/[^A-Za-z]/g, '').toUpperCase()
    name = TERRITORY_NAMES[g.properties.name] ?? g.properties.name
  }
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs
  for (const p of polys) {
    const target = reassign(ownerId, p)
    const u = unit(target, target === ownerId ? name : TERRITORY_NAMES[target])
    if (target === ownerId && name && !u.name) u.name = name
    u.polys.push(p)
  }
}

const features = []
for (const u of units.values()) {
  // merge() slije polygony a rozpustí vnitřní hranice (Krym + Ukrajina, Somaliland + Somálsko, ...)
  const geometry = merge(topo50, [{ type: 'MultiPolygon', arcs: u.polys }])
  const game = gameIds.has(u.id)
  features.push({ type: 'Feature', id: u.id, properties: game ? {} : { name: u.name ?? u.id }, geometry })
}

// Tuvalu v rozlišení 50m chybí, bereme ho z 10m
const tuvalu = feature(topo10, topo10.objects.countries.geometries.find((g) => g.id === '798'))
features.push({ type: 'Feature', id: 'TUV', properties: {}, geometry: tuvalu.geometry })

const gameFeatures = features.filter((f) => gameIds.has(f.id)).sort((a, b) => a.id.localeCompare(b.id))
const territoryFeatures = features.filter((f) => !gameIds.has(f.id)).sort((a, b) => a.id.localeCompare(b.id))
const missingGeometry = [...gameIds].filter((id) => !gameFeatures.some((f) => f.id === id))
if (missingGeometry.length) throw new Error('Země bez geometrie: ' + missingGeometry.join(', '))

const worldTopo = topology(
  {
    countries: { type: 'FeatureCollection', features: gameFeatures },
    territories: { type: 'FeatureCollection', features: territoryFeatures },
  },
  1e5,
)
fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'src/data/world.topo.json'), JSON.stringify(worldTopo))

// Dál pracujeme s geometrií přesně tak, jak ji uvidí aplikace (po kvantizaci)
const finalGame = feature(worldTopo, worldTopo.objects.countries).features
const geomById = new Map(finalGame.map((f) => [f.id, f.geometry]))

// ---------------------------------------------------------------------------
// 3) Sousedé (pozemní hranice) podle world-countries, jen mezi hratelnými zeměmi
// ---------------------------------------------------------------------------
const neighborSets = new Map(gameSource.map((c) => [c.cca3, new Set(c.borders.filter((b) => gameIds.has(b)))]))
for (const [a, b] of REMOVE_BORDERS) { neighborSets.get(a).delete(b); neighborSets.get(b).delete(a) }
for (const [a, b] of ADD_BORDERS) { neighborSets.get(a).add(b); neighborSets.get(b).add(a) }
const neighbors = new Map([...neighborSets].map(([id, set]) => [id, [...set].sort()]))
for (const [a, list] of neighbors) {
  for (const b of list) {
    if (!neighbors.get(b).includes(a)) throw new Error(`Nesymetrické sousedství: ${a} -> ${b} (oprav v scripts/sources/borders-fix.mjs)`)
  }
}

// Hranice jen přes zámořská území (viz borders-fix.mjs). Vedou se zvlášť, vzdálenosti ani cesty je nepoužívají.
const overseas = new Map(gameSource.map((c) => [c.cca3, []]))
for (const [a, b] of OVERSEAS_BORDERS) {
  if (!gameIds.has(a) || !gameIds.has(b)) throw new Error(`OVERSEAS_BORDERS: neznámý kód ${a} / ${b}`)
  if (neighbors.get(a).includes(b)) throw new Error(`OVERSEAS_BORDERS: ${a} a ${b} už jsou běžní sousedé`)
  overseas.get(a).push(b)
  overseas.get(b).push(a)
}

// ---------------------------------------------------------------------------
// 4) Matice vzdáleností mezi hranicemi
// ---------------------------------------------------------------------------
// Postup: obrysy zemí zahustíme (bod nejvýš každých ~8 km), převedeme na jednotkové vektory
// a pro každou dvojici zemí hledáme nejbližší dvojici bodů. Kvůli rychlosti nejdřív hrubý odhad
// na řídkém vzorku a potom přesný výpočet jen na bodech, které připadají v úvahu.
const DENSIFY_KM = 8

function toVectors(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const pts = []
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = ring[i]
        const b = ring[i + 1]
        pts.push(a)
        const d = geoDistance(a, b) * EARTH_RADIUS_KM
        if (d > DENSIFY_KM) {
          const n = Math.ceil(d / DENSIFY_KM)
          const interp = geoInterpolate(a, b)
          for (let k = 1; k < n; k++) pts.push(interp(k / n))
        }
      }
    }
  }
  const v = new Float64Array(pts.length * 3)
  for (let i = 0; i < pts.length; i++) {
    const lon = (pts[i][0] * Math.PI) / 180
    const lat = (pts[i][1] * Math.PI) / 180
    v[i * 3] = Math.cos(lat) * Math.cos(lon)
    v[i * 3 + 1] = Math.cos(lat) * Math.sin(lon)
    v[i * 3 + 2] = Math.sin(lat)
  }
  return v
}

function capOf(v) {
  let x = 0, y = 0, z = 0
  const n = v.length / 3
  for (let i = 0; i < n; i++) { x += v[i * 3]; y += v[i * 3 + 1]; z += v[i * 3 + 2] }
  const len = Math.hypot(x, y, z) || 1
  x /= len; y /= len; z /= len
  let minDot = 1
  for (let i = 0; i < n; i++) {
    const d = v[i * 3] * x + v[i * 3 + 1] * y + v[i * 3 + 2] * z
    if (d < minDot) minDot = d
  }
  return { x, y, z, radius: Math.acos(Math.max(-1, Math.min(1, minDot))) }
}

function subsample(v, step) {
  const n = v.length / 3
  const m = Math.ceil(n / step)
  const out = new Float64Array(m * 3)
  for (let i = 0; i < m; i++) {
    out[i * 3] = v[i * step * 3]; out[i * 3 + 1] = v[i * step * 3 + 1]; out[i * 3 + 2] = v[i * step * 3 + 2]
  }
  return out
}

function maxDot(a, b) {
  let best = -1
  const na = a.length, nb = b.length
  for (let i = 0; i < na; i += 3) {
    const ax = a[i], ay = a[i + 1], az = a[i + 2]
    for (let j = 0; j < nb; j += 3) {
      const d = ax * b[j] + ay * b[j + 1] + az * b[j + 2]
      if (d > best) best = d
    }
  }
  return best
}

function withinCap(v, cap, angle) {
  const cosLimit = Math.cos(Math.min(Math.PI, angle))
  const out = []
  for (let i = 0; i < v.length; i += 3) {
    if (v[i] * cap.x + v[i + 1] * cap.y + v[i + 2] * cap.z >= cosLimit) out.push(v[i], v[i + 1], v[i + 2])
  }
  return Float64Array.from(out)
}

const ids = gameSource.map((c) => c.cca3)
const vecs = ids.map((id) => toVectors(geomById.get(id)))
const coarse = vecs.map((v) => subsample(v, 16))
const caps = vecs.map(capOf)
const totalPoints = vecs.reduce((s, v) => s + v.length / 3, 0)
console.log(`Vzdálenosti: ${ids.length} zemí, ${totalPoints} bodů obrysů`)

const t0 = Date.now()
const km = ids.map(() => new Array(ids.length).fill(0))
const angleOf = (dot) => Math.acos(Math.max(-1, Math.min(1, dot)))
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const upper = angleOf(maxDot(coarse[i], coarse[j])) + 1e-6
    const a = withinCap(vecs[i], caps[j], caps[j].radius + upper)
    const b = withinCap(vecs[j], caps[i], caps[i].radius + upper)
    const exact = a.length && b.length ? angleOf(maxDot(a, b)) : upper
    let d = Math.round(Math.min(exact, upper) * EARTH_RADIUS_KM)
    km[i][j] = km[j][i] = d
  }
}
console.log(`Vzdálenosti spočítány za ${((Date.now() - t0) / 1000).toFixed(1)} s`)

// Porovnání: sousedé podle seznamu vs. dotyk geometrií. Vypíše rozdíly ke kontrole.
const idx = new Map(ids.map((id, i) => [id, i]))
const mismatches = []
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const listed = neighbors.get(ids[i]).includes(ids[j])
    if (listed && km[i][j] > 0) mismatches.push(`  sousedé podle seznamu, ale geometrie ${km[i][j]} km: ${ids[i]}-${ids[j]}`)
    if (!listed && km[i][j] === 0) mismatches.push(`  geometrie se dotýká, ale nejsou v seznamu sousedů: ${ids[i]}-${ids[j]}`)
  }
}
if (mismatches.length) console.log('Rozdíly sousedství vs. geometrie:\n' + mismatches.join('\n'))

// Sousedé mají vzdálenost vždy 0 (i když se geometrie kvůli zjednodušení těsně nedotkne).
// Naopak země, které sousedy nejsou, mají vzdálenost aspoň 1 km, aby "0 km" vždy znamenalo "sousedí".
for (let i = 0; i < ids.length; i++) {
  for (let j = 0; j < ids.length; j++) {
    if (i === j) continue
    if (neighbors.get(ids[i]).includes(ids[j])) km[i][j] = 0
    else if (km[i][j] === 0) km[i][j] = 1
  }
}
fs.writeFileSync(path.join(ROOT, 'src/data/distances.json'), JSON.stringify({ ids, km }))

// ---------------------------------------------------------------------------
// 5) countries.json
// ---------------------------------------------------------------------------
const MARKER_AREA_KM2 = 6500 // menší země dostanou na mapě navíc kroužek, aby šly vidět a trefit
const DRAWABLE_MAIN_SHARE = 0.75 // hra Nakresli hranici: největší souvislý kus území musí tvořit aspoň tolik rozlohy

/** Podíl největšího polygonu na celkové ploše země (1 = země z jednoho kusu). */
function mainPolygonShare(geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const areas = polys.map((coordinates) => geoArea({ type: 'Polygon', coordinates }))
  return Math.max(...areas) / areas.reduce((a, b) => a + b, 0)
}

const countries = gameSource.map((c) => {
  const id = c.cca3
  const ces = c.translations.ces
  const name = NAME_OVERRIDES[id] ?? ces.common
  const aliasSet = new Set([ces.common, ces.official, ...(ALIASES[id] ?? [])])
  aliasSet.delete(name)
  const cap = CAPITALS[id]
  if (!cap) throw new Error('Chybí hlavní město: ' + id)
  const [capital, ...capitalAlt] = Array.isArray(cap) ? cap : [cap]
  const pop = population[id]
  if (!pop) throw new Error('Chybí populace: ' + id)
  const centroid = geoCentroid(geomById.get(id))
  return {
    id,
    iso2: c.cca2.toLowerCase(),
    name,
    aliases: [...aliasSet],
    capital,
    capitalAlt,
    continent: continentOf(c),
    subregion: c.subregion,
    population: pop.population,
    populationYear: pop.year,
    // průměrná roční teplota ve °C (1991–2020); null = údaj není k dispozici (Tchaj-wan)
    avgTemp: temperature[id] ?? null,
    // HDP v USD (běžné ceny) a rok údaje; null = údaj chybí nebo je starší než 2020
    gdp: gdp[id]?.gdp ?? null,
    gdpYear: gdp[id]?.year ?? null,
    area: c.area < 100 ? Number(c.area.toFixed(2)) : Math.round(c.area), // km²
    lat: c.latlng[0],
    lon: c.latlng[1],
    // geometrický střed (pro umístění značky na mapě), [lon, lat]
    centroid: [Number(centroid[0].toFixed(3)), Number(centroid[1].toFixed(3))],
    landlocked: c.landlocked,
    unMember: c.unMember && id !== 'VAT',
    marker: c.area < MARKER_AREA_KM2,
    // dá se rozumně nakreslit: není to ministát ani souostroví (hra Nakresli hranici kreslí jen největší souvislý kus)
    drawable: c.area >= MARKER_AREA_KM2 && mainPolygonShare(geomById.get(id)) >= DRAWABLE_MAIN_SHARE,
    neighbors: neighbors.get(id),
    // sousedé jen přes zámořská území (Francie–Nizozemsko na Svatém Martinu, Francie–Brazílie přes Guyanu)
    overseasNeighbors: overseas.get(id).sort(),
    flag: flagInfo(id, c.cca2.toLowerCase()),
  }
})
fs.writeFileSync(path.join(ROOT, 'src/data/countries.json'), JSON.stringify(countries, null, 1) + '\n')

// ---------------------------------------------------------------------------
// 6) Vlajky
// ---------------------------------------------------------------------------
const flagSrc = path.join(path.dirname(require.resolve('flag-icons/package.json')), 'flags/4x3')
const flagDst = path.join(ROOT, 'public/flags')
fs.mkdirSync(flagDst, { recursive: true })
let flagBytes = 0
for (const c of countries) {
  const src = path.join(flagSrc, c.iso2 + '.svg')
  if (!fs.existsSync(src)) throw new Error('Chybí vlajka: ' + c.id + ' (' + c.iso2 + ')')
  fs.copyFileSync(src, path.join(flagDst, c.iso2 + '.svg'))
  flagBytes += fs.statSync(src).size
}

const size = (p) => (fs.statSync(path.join(ROOT, p)).size / 1024).toFixed(0) + ' kB'
console.log(`Hotovo: ${countries.length} zemí, ${territoryFeatures.length} dalších území`)
console.log(`  countries.json ${size('src/data/countries.json')}, world.topo.json ${size('src/data/world.topo.json')}, distances.json ${size('src/data/distances.json')}, vlajky ${(flagBytes / 1024).toFixed(0)} kB`)
// kontrola orientace polygonů (špatně otočený polygon by pokryl celou zeměkouli)
for (const f of finalGame) if (geoArea(f) > 2 * Math.PI) console.warn('POZOR: podezřelá orientace polygonu', f.id)
