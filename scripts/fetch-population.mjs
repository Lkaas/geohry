// Sestaví scripts/sources/population.json (počty obyvatel).
// Spouští se jen ručně, když chceš populace obnovit. Výsledek je v gitu, takže
// běžný `npm run data` internet nepotřebuje.
//
// Zdroje:
//   1) Světová banka (ukazatel SP.POP.TOTL), zrcadlo na GitHubu datasets/population. Bere se poslední rok.
//   2) Natural Earth (POP_EST) jako záloha pro země, které Světová banka nevede (Tchaj-wan, Vatikán).
//
// Postup:
//   curl -o /tmp/wb.csv   https://raw.githubusercontent.com/datasets/population/main/data/population.csv
//   curl -o /tmp/ne50.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
//   curl -o /tmp/tiny.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_tiny_countries.geojson
//   node scripts/fetch-population.mjs /tmp/wb.csv /tmp/ne50.geojson /tmp/tiny.geojson
import fs from 'node:fs'

const [wbPath, mainPath, tinyPath] = process.argv.slice(2)
if (!wbPath || !mainPath || !tinyPath) {
  console.error('Použití: node scripts/fetch-population.mjs <population.csv> <ne_50m_admin_0_countries.geojson> <ne_50m_admin_0_tiny_countries.geojson>')
  process.exit(1)
}

const out = {}

// --- 1) Světová banka ---
const WB_FIX = { XKX: 'UNK' } // Kosovo
for (const line of fs.readFileSync(wbPath, 'utf8').split('\n').slice(1)) {
  // název země může obsahovat čárku v uvozovkách, proto bereme poslední tři sloupce
  const parts = line.trim().split(',')
  if (parts.length < 4) continue
  const value = Number(parts.at(-1))
  const year = Number(parts.at(-2))
  let code = parts.at(-3)
  code = WB_FIX[code] ?? code
  if (!Number.isFinite(value) || !Number.isFinite(year)) continue
  if (!out[code] || out[code].year < year) out[code] = { population: Math.round(value), year, source: 'WB' }
}

// --- 2) Natural Earth jako záloha ---
const NE_FIX = { KOS: 'UNK', PSX: 'PSE', SDS: 'SSD', SAH: 'ESH' }
function addNE(props) {
  let code = props.ISO_A3_EH && props.ISO_A3_EH !== '-99' ? props.ISO_A3_EH : props.ADM0_A3
  code = NE_FIX[props.ADM0_A3] ?? code
  if (out[code]) return
  out[code] = { population: Math.round(props.POP_EST), year: props.POP_YEAR, source: 'NE' }
}
for (const p of [mainPath, tinyPath]) for (const f of JSON.parse(fs.readFileSync(p, 'utf8')).features) addNE(f.properties)

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(new URL('./sources/population.json', import.meta.url), JSON.stringify(sorted, null, 1) + '\n')
console.log('Uloženo', Object.keys(sorted).length, 'záznamů do scripts/sources/population.json')
