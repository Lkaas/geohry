// Ručně sestavené údaje o vlajkách. POTŘEBA OVĚŘIT: sestaveno z hlavy a zkontrolováno
// jen pohledem na zmenšené náhledy vlajek. Chybu oprav tady a spusť `npm run data`.
// Klíče jsou kódy ISO alpha-3 (Kosovo = UNK).

// ---------------------------------------------------------------------------
// Barvy: základ se počítá automaticky (scripts/analyze-flags.mjs, barva musí zabírat aspoň 1 % plochy).
// Tady se jen opravuje: odebírají se barvy, které jsou jen detailem státního znaku nebo obrysem,
// a přidávají ty, které jsou pod prahem, ale k vlajce patří.
// Platné barvy: red, white, blue, green, yellow, black, orange. Světle modrá = blue, vínová = red, zlatá = yellow.
// ---------------------------------------------------------------------------
export const COLOR_REMOVE = {
  AFG: ['orange'],
  ARM: ['yellow'], // spodní pruh je oficiálně oranžový (meruňkový)
  BLZ: ['green', 'black'],
  BTN: ['black'],
  ECU: ['black', 'green', 'white'],
  ESP: ['black'],
  FJI: ['black', 'yellow'],
  GTM: ['green', 'yellow'],
  HTI: ['green'],
  KHM: ['black'],
  LIE: ['black'],
  LKA: ['black'],
  MDA: ['orange', 'black', 'green'],
  MLT: ['black'],
  MNE: ['orange'],
  PRT: ['white', 'black'],
  SMR: ['green', 'yellow'],
  SRB: ['yellow', 'black'],
  TKM: ['yellow', 'black'],
  URY: ['black'],
  VAT: ['black'],
}
export const COLOR_ADD = {
  ARM: ['orange'],
  DJI: ['red'], // červená hvězda je menší než 1 % plochy
}

// ---------------------------------------------------------------------------
// Symboly na vlajce. Počítá se prvek, který je na vlajce zřetelně k rozeznání,
// i když je součástí státního znaku.
// ---------------------------------------------------------------------------
/** Hvězda (pěticípá i vícecípá, Davidova hvězda). Slunce s paprsky se nepočítá. */
export const STAR = [
  'AGO', 'AUS', 'AZE', 'BDI', 'BFA', 'BIH', 'BRA', 'CAF', 'CHL', 'CHN', 'CMR', 'COD', 'COM', 'CPV', 'CUB', 'DJI', 'DMA', 'DZA', 'ETH', 'FSM', 'GHA', 'GNB', 'GNQ', 'GRD',
  'HND', 'ISR', 'JOR', 'KNA', 'LBR', 'LBY', 'MAR', 'MHL', 'MMR', 'MOZ', 'MRT', 'MYS', 'NRU', 'NZL', 'PAK', 'PAN', 'PHL', 'PNG', 'PRK', 'PRY', 'SEN', 'SGP', 'SLB', 'SOM',
  'SSD', 'STP', 'SUR', 'SVN', 'SYR', 'TGO', 'TJK', 'TKM', 'TLS', 'TUN', 'TUR', 'TUV', 'UNK', 'USA', 'UZB', 'VEN', 'VNM', 'WSM', 'ZWE',
]
/** Slunce s paprsky. Samotný kotouč (Japonsko, Bangladéš, Palau) se nepočítá. */
export const SUN = ['ARG', 'ATG', 'KAZ', 'KGZ', 'KIR', 'MKD', 'MWI', 'NAM', 'NPL', 'PHL', 'RWA', 'TWN', 'URY']
/** Půlměsíc. */
export const CRESCENT = ['AZE', 'BRN', 'COM', 'DZA', 'LBY', 'MDV', 'MRT', 'MYS', 'NPL', 'PAK', 'SGP', 'TKM', 'TUN', 'TUR', 'UZB']
/** Kříž (i ondřejský a britská vlajka v rohu). */
export const CROSS = [
  'AUS', 'BDI', 'CHE', 'DMA', 'DNK', 'DOM', 'FIN', 'FJI', 'GBR', 'GEO', 'GRC', 'ISL', 'JAM', 'MLT', 'NOR', 'NZL', 'SRB', 'SVK', 'SWE', 'TON', 'TUV',
]
/** Zvíře (včetně ptáků a draka, i ve státním znaku). */
export const ANIMAL = [
  'ALB', 'AND', 'BOL', 'BTN', 'DMA', 'ECU', 'EGY', 'ESP', 'FJI', 'GTM', 'HRV', 'KAZ', 'KIR', 'LKA', 'MDA', 'MEX', 'MNE', 'PNG', 'SRB', 'UGA', 'ZMB', 'ZWE',
]
/** Nápis nebo písmo. */
export const TEXT = [
  'AFG', 'AND', 'BLZ', 'BOL', 'BRA', 'BRN', 'DOM', 'EGY', 'ESP', 'GNQ', 'GTM', 'HTI', 'IRN', 'IRQ', 'MLT', 'NIC', 'PRY', 'SAU', 'SLV', 'SMR',
]
/** Klín (trojúhelník) u žerdi. */
export const HOIST_TRIANGLE = [
  'BHS', 'COM', 'CUB', 'CZE', 'DJI', 'ERI', 'GNQ', 'GUY', 'JOR', 'MOZ', 'PHL', 'PSE', 'SDN', 'SSD', 'STP', 'TLS', 'VUT', 'ZAF', 'ZWE',
]
