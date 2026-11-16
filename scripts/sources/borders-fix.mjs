// Ruční opravy seznamu pozemních sousedů z datasetu world-countries.
// Každá položka je dvojice kódů zemí. Opravy platí vždy oběma směry.
export const REMOVE_BORDERS = [
  ['LKA', 'IND'], // Srí Lanka a Indie nemají pozemní hranici (v datasetu byla jen jedním směrem)
]
export const ADD_BORDERS = []

// Hranice, které existují jen přes zámořská území, jež jsou součástí státu.
// Na mapě se tyto země nedotýkají (zámořská území jsou tam vedená zvlášť jako nehratelná),
// proto NEJSOU v běžném seznamu sousedů: hra Cesta mezi zeměmi a vzdálenosti v Tajemné zemi s nimi nepočítají.
// Počítají s nimi hry Sousedé a GeoGrid (pole `overseasNeighbors` v countries.json).
export const OVERSEAS_BORDERS = [
  ['FRA', 'NLD'], // ostrov Svatý Martin: francouzský Saint-Martin a nizozemský Sint Maarten
  ['FRA', 'BRA'], // Francouzská Guyana
  ['FRA', 'SUR'], // Francouzská Guyana
]
