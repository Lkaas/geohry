/** Jedna hratelná země. Data se generují skriptem scripts/build-data.mjs do src/data/countries.json. */
export interface Country {
  /** ISO alpha-3 kód, např. "CZE" (Kosovo = "UNK"). Používá se jako identifikátor všude v aplikaci. */
  id: string
  /** ISO alpha-2 malými písmeny, slouží jako název souboru vlajky. */
  iso2: string
  /** Český název, který se zobrazuje. */
  name: string
  /** Další názvy, které našeptávač přijme (oficiální název, zkratky, starší názvy). */
  aliases: string[]
  capital: string
  capitalAlt: string[]
  continent: Continent
  subregion: string
  population: number
  populationYear: number
  /** Průměrná roční teplota ve °C (1991–2020). null = údaj chybí (jen Tchaj-wan). */
  avgTemp: number | null
  /** Hrubý domácí produkt v USD (běžné ceny). null = údaj chybí nebo je příliš starý. */
  gdp: number | null
  gdpYear: number | null
  /** Rozloha v km². */
  area: number
  /** Střed země (pro směr a vzdálenost mezi středy). */
  lat: number
  lon: number
  /** Geometrický střed [lon, lat], pro značku na mapě. */
  centroid: [number, number]
  landlocked: boolean
  unMember: boolean
  /** Malá země: mapa jí kreslí navíc kroužek. */
  marker: boolean
  /** Hodí se pro hru Nakresli hranici (není ministát ani souostroví). */
  drawable: boolean
  /** Kódy zemí, se kterými má pozemní hranici na mapě (používají je cesty a vzdálenosti). */
  neighbors: string[]
  /** Sousedé jen přes zámořská území (Francie–Nizozemsko na Svatém Martinu). Počítají je hry Sousedé a GeoGrid. */
  overseasNeighbors: string[]
  flag: FlagInfo
}

export type FlagColor = 'red' | 'white' | 'blue' | 'green' | 'yellow' | 'black' | 'orange'

/** Údaje o vlajce. Barvy se určují automaticky z obrázku, symboly jsou sepsané ručně (scripts/sources/flags-manual.mjs). */
export interface FlagInfo {
  colors: FlagColor[]
  /** Kolik procent plochy vlajky zabírá která barva (součet zhruba 100). */
  shares: Partial<Record<FlagColor, number>>
  /** Vlajka složená jen z vodorovných / jen ze svislých pruhů. */
  stripes: 'horizontal' | 'vertical' | null
  star: boolean
  sun: boolean
  crescent: boolean
  cross: boolean
  animal: boolean
  text: boolean
  /** Klín (trojúhelník) u žerdi. */
  hoistTriangle: boolean
}

export type Continent = 'Evropa' | 'Asie' | 'Afrika' | 'Severní Amerika' | 'Jižní Amerika' | 'Austrálie a Oceánie'

export type GameMode = 'daily' | 'free'
