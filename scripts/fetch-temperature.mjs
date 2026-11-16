// Sestaví scripts/sources/temperature.json (průměrná roční teplota zemí ve °C).
// Spouští se jen ručně. Výsledek je v gitu, takže běžný `npm run data` internet nepotřebuje.
//
// Zdroj: seznam "List of countries by average yearly temperature" na Wikipedii
// (data Světové banky z mřížkových klimatologií CRU, průměr let 1991–2020),
// ve strojově čitelné podobě z github.com/samayo/country-json.
//
// Postup:
//   curl -o /tmp/temp.json https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-yearly-average-temperature.json
//   node scripts/fetch-temperature.mjs /tmp/temp.json
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const [srcPath] = process.argv.slice(2)
if (!srcPath) {
  console.error('Použití: node scripts/fetch-temperature.mjs <country-by-yearly-average-temperature.json>')
  process.exit(1)
}

// Názvy, které se v datasetu jmenují jinak než ve world-countries
const NAME_FIX = { 'Fiji Islands': 'FJI', 'The Democratic Republic of Congo': 'COD', Turkey: 'TUR' }

// Hodnoty doplněné nebo opravené ručně přímo podle tabulky na Wikipedii (ověřeno 16. 11. 2026):
const MANUAL = {
  UNK: 10.02, // Kosovo v datasetu chybí
  MNE: 9.93, // Černá Hora v datasetu chybí
  BFA: 30.4, // dataset má starší hodnotu 29,26
  VAT: 15.2, // dataset má 16,34
  PSE: 20.04, // dataset má 19,5
}
// Tchaj-wan v tabulce Wikipedie ani v datasetu není -> zůstává bez hodnoty (null).

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ').trim()
const countries = require('world-countries')
const byName = new Map()
for (const c of countries) for (const n of [c.name.common, c.name.official, ...c.altSpellings]) byName.set(norm(n), c.cca3)

const out = {}
const unmatched = []
for (const row of JSON.parse(fs.readFileSync(srcPath, 'utf8'))) {
  const id = NAME_FIX[row.country] ?? byName.get(norm(row.country))
  if (!id) { unmatched.push(row.country); continue }
  if (typeof row.temperature === 'number') out[id] = row.temperature
}
Object.assign(out, MANUAL)

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(new URL('./sources/temperature.json', import.meta.url), JSON.stringify(sorted, null, 1) + '\n')
console.log('Uloženo', Object.keys(sorted).length, 'teplot. Nespárované názvy:', unmatched.join('; ') || 'žádné')
