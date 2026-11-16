import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { EmblemKind } from '../shared/components/Emblem'

export interface GameInfo {
  /** Identifikátor pro ukládání (statistiky, denní stav). Po vydání už neměnit. */
  id: string
  /** Část adresy za #. Jen písmena, číslice a pomlčky. */
  route: string
  title: string
  description: string
  emblem: EmblemKind
  /** Hra s hvězdičkou = navíc oproti původnímu zadání. */
  extra?: boolean
  /** Komponenta hry. Když chybí, hra se na domovské obrazovce ukáže jako "Připravuje se". */
  component?: LazyExoticComponent<ComponentType>
}

/** Seznam všech her v pořadí, v jakém se ukazují na domovské obrazovce. Nová hra se přidává sem. */
export const GAMES: GameInfo[] = [
  {
    id: 'mystery',
    route: 'tajemna-zeme',
    title: 'Tajemná země',
    description: 'Tipuj země a sleduj, jestli přihořívá. Čím teplejší barva, tím blíž jsi.',
    emblem: 'mystery',
    component: lazy(() => import('./mystery/MysteryGame')),
  },
  {
    id: 'route',
    route: 'cesta',
    title: 'Cesta mezi zeměmi',
    description: 'Dojdi po souši z jedné země do druhé. Vyjmenuj státy, přes které cesta vede.',
    emblem: 'route',
    component: lazy(() => import('./route/RouteGame')),
  },
  {
    id: 'countryle',
    route: 'countryle',
    title: 'Countryle',
    description: 'Odhal zemi podle kontinentu, počtu obyvatel, rozlohy, teploty a směru.',
    emblem: 'countryle',
    component: lazy(() => import('./countryle/CountryleGame')),
  },
  {
    id: 'geogrid',
    route: 'geogrid',
    title: 'GeoGrid',
    description: 'Vyplň mřížku 3×3 zeměmi, které splní podmínku řádku i sloupce.',
    emblem: 'grid',
    component: lazy(() => import('./geogrid/GeoGridGame')),
  },
  {
    id: 'border',
    route: 'nakresli-hranici',
    title: 'Nakresli hranici',
    description: 'Nakresli obrys země do prázdného místa na mapě co nejpřesněji.',
    emblem: 'border',
    component: lazy(() => import('./border/BorderGame')),
  },
  {
    id: 'flag-clues',
    route: 'tajemna-vlajka',
    title: 'Tajemná vlajka',
    description: 'Uhodni vlajku podle nápověd. Začínají mlhavě a postupně přitvrzují.',
    emblem: 'clues',
    extra: true,
    component: lazy(() => import('./flagclues/FlagCluesGame')),
  },
  {
    id: 'neighbors',
    route: 'sousede',
    title: 'Sousedé',
    description: 'Vyjmenuj všechny země, se kterými zadaná země sousedí.',
    emblem: 'neighbors',
    extra: true,
    component: lazy(() => import('./neighbors/NeighborsGame')),
  },
  {
    id: 'silhouette',
    route: 'silueta',
    title: 'Silueta',
    description: 'Poznej zemi jen podle obrysu.',
    emblem: 'silhouette',
    extra: true,
    component: lazy(() => import('./silhouette/SilhouetteGame')),
  },
  {
    id: 'higher-lower',
    route: 'vic-nebo-min',
    title: 'Víc, nebo míň?',
    description: 'Která země má víc obyvatel, větší rozlohu nebo vyšší HDP? Drž sérii co nejdéle.',
    emblem: 'compare',
    extra: true,
    component: lazy(() => import('./higherlower/HigherLowerGame')),
  },
  // --- nápady, které zatím nejsou naprogramované (na domovské obrazovce jsou v seznamu "v plánu") ---
  { id: 'flag-quiz', route: 'vlajkovy-kviz', title: 'Vlajkový kvíz', description: 'Poznej zemi podle vlajky.', emblem: 'star', extra: true },
  { id: 'flagle', route: 'flagle', title: 'Flagle', description: 'Vlajka se odkrývá po kouskách.', emblem: 'star', extra: true },
  { id: 'click-map', route: 'klikni-na-mapu', title: 'Klikni na mapu', description: 'Najdi zemi na mapě na čas.', emblem: 'star', extra: true },
  { id: 'name-all', route: 'vyjmenuj-vsechny', title: 'Vyjmenuj všechny', description: 'Vypiš všechny země kontinentu.', emblem: 'star', extra: true },
  { id: 'capitals', route: 'hlavni-mesta', title: 'Hlavní města', description: 'Země a jejich hlavní města.', emblem: 'star', extra: true },
  { id: 'album', route: 'album-vlajek', title: 'Album vlajek', description: 'Sbírka vlajek zemí, které jsi uhodl.', emblem: 'star', extra: true },
]

export function findGame(route: string): GameInfo | undefined {
  return GAMES.find((g) => g.route === route)
}
