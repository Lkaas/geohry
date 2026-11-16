// Sestaví scripts/sources/gdp.json (hrubý domácí produkt v USD, běžné ceny).
// Spouští se jen ručně. Výsledek je v gitu, takže běžný `npm run data` internet nepotřebuje.
//
// Zdroj: Světová banka (ukazatel NY.GDP.MKTP.CD), zrcadlo na GitHubu datasets/gdp.
// Bere se poslední dostupný rok. Údaje starší než MIN_YEAR se zahazují (u hry Víc, nebo míň by zkreslovaly).
//
// Postup:
//   curl -o /tmp/gdp.csv https://raw.githubusercontent.com/datasets/gdp/main/data/gdp.csv
//   node scripts/fetch-gdp.mjs /tmp/gdp.csv
import fs from 'node:fs'

const MIN_YEAR = 2020
const [srcPath] = process.argv.slice(2)
if (!srcPath) {
  console.error('Použití: node scripts/fetch-gdp.mjs <gdp.csv>')
  process.exit(1)
}

const CODE_FIX = { XKX: 'UNK' } // Kosovo
const latest = {}
for (const line of fs.readFileSync(srcPath, 'utf8').split('\n').slice(1)) {
  const parts = line.trim().split(',') // název země může obsahovat čárku, proto bereme poslední tři sloupce
  if (parts.length < 4) continue
  const value = Number(parts.at(-1))
  const year = Number(parts.at(-2))
  const code = CODE_FIX[parts.at(-3)] ?? parts.at(-3)
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(year) || year < MIN_YEAR) continue
  if (!latest[code] || latest[code].year < year) latest[code] = { gdp: Math.round(value), year }
}
const sorted = Object.fromEntries(Object.entries(latest).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(new URL('./sources/gdp.json', import.meta.url), JSON.stringify(sorted, null, 1) + '\n')
console.log('Uloženo', Object.keys(sorted).length, 'záznamů do scripts/sources/gdp.json')
