// Ruční úpravy českých názvů zemí.
// Základ názvů pochází z datasetu world-countries (překlad "ces"). Tady se jen:
//   NAME_OVERRIDES: přepisuje hlavní zobrazovaný název,
//   ALIASES: přidávají další názvy, které má našeptávač přijmout.
// Oficiální dlouhý název (např. "Česká republika") se jako alias přidává automaticky.
// Klíč je kód ISO alpha-3 (Kosovo = UNK).

export const NAME_OVERRIDES = {
  USA: 'Spojené státy americké',
  SWZ: 'Eswatini',
  PNG: 'Papua Nová Guinea',
}

export const ALIASES = {
  USA: ['USA', 'Spojené státy', 'Amerika'],
  GBR: ['Velká Británie', 'Británie', 'UK', 'Anglie'],
  ARE: ['SAE', 'Emiráty', 'Arabské emiráty'],
  CZE: ['ČR', 'Čechy'],
  COD: ['Demokratická republika Kongo', 'DRK', 'Kongo Kinshasa', 'Zair'],
  COG: ['Republika Kongo', 'Kongo Brazzaville'],
  SWZ: ['Svazijsko'],
  MMR: ['Barma'],
  CIV: ["Côte d'Ivoire"],
  CPV: ['Kapverdské ostrovy', 'Cabo Verde'],
  TLS: ['Timor-Leste'],
  CAF: ['SAR'],
  ZAF: ['JAR', 'Jižní Afrika'],
  NLD: ['Holandsko'],
  MKD: ['Makedonie'],
  PRK: ['KLDR'],
  TWN: ['Taiwan'],
  BIH: ['Bosna', 'BiH'],
  DOM: ['Dominikána'],
  MDA: ['Moldávie'],
  KNA: ['Sv. Kryštof a Nevis'],
  LCA: ['Sv. Lucie'],
  VCT: ['Sv. Vincenc a Grenadiny'],
  STP: ['Sv. Tomáš a Princův ostrov', 'Svatý Tomáš'],
  VAT: ['Svatý stolec'],
  LKA: ['Cejlon'],
  BLR: ['Bílá Rus'],
  KGZ: ['Kirgizstán', 'Kyrgyzie'],
  FSM: ['Federativní státy Mikronésie'],
  TUR: ['Türkiye'],
  RUS: ['Ruská federace'],
  CHN: ['ČLR'],
  DEU: ['SRN'],
}

// České názvy území, která nejsou hratelnými zeměmi, ale jsou vidět na mapě
// (jen ta, která world-countries nezná nebo která vznikla odtržením při úpravě geometrie).
export const TERRITORY_NAMES = {
  'Siachen Glacier': 'Siačen (sporné území)',
  'Indian Ocean Ter.': 'Australská území v Indickém oceánu',
  X_GUF: 'Francouzská Guyana (Francie)',
  X_REU: 'Réunion (Francie)',
  X_MYT: 'Mayotte (Francie)',
  X_MTQ: 'Martinik (Francie)',
  X_GLP: 'Guadeloupe (Francie)',
  X_BES: 'Karibské Nizozemsko',
  X_TKL: 'Tokelau (Nový Zéland)',
}
