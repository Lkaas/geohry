// Každá hra má vlastní vymyšlenou "vlajku" (poměr 4:3) místo ikony.
export type EmblemKind = 'mystery' | 'route' | 'countryle' | 'grid' | 'border' | 'star' | 'clues' | 'neighbors' | 'silhouette' | 'compare'

const NAVY = '#14171c'
const RED = '#d62828'
const YELLOW = '#ffd23f'
const WHITE = '#fdfdf9'
const BLUE = '#0b3d91'
const ORANGE = '#F28C28'

export function Emblem({ kind, className = '' }: { kind: EmblemKind; className?: string }) {
  return (
    <svg className={'emblem ' + className} viewBox="0 0 40 30" aria-hidden="true">
      {kind === 'mystery' && (
        <>
          <rect width="40" height="30" fill={BLUE} />
          <circle cx="20" cy="15" r="12" fill={YELLOW} />
          <circle cx="20" cy="15" r="8" fill={ORANGE} />
          <circle cx="20" cy="15" r="4" fill={RED} />
        </>
      )}
      {kind === 'route' && (
        <>
          <rect width="40" height="30" fill={NAVY} />
          <path d="M0 30 L0 22 L30 0 L40 0 L40 8 L10 30 Z" fill={WHITE} />
          <path d="M0 30 L0 25 L33.5 0 L40 0 L40 5 L6.5 30 Z" fill={YELLOW} />
        </>
      )}
      {kind === 'countryle' && (
        <>
          <rect width="40" height="30" fill={WHITE} />
          <rect y="0" width="40" height="6" fill={RED} />
          <rect y="12" width="40" height="6" fill={RED} />
          <rect y="24" width="40" height="6" fill={RED} />
          <path d="M0 0 L18 15 L0 30 Z" fill={NAVY} />
          <circle cx="6.5" cy="15" r="3" fill={YELLOW} />
        </>
      )}
      {kind === 'grid' && (
        <>
          <rect width="40" height="30" fill={WHITE} />
          {[0, 1, 2].flatMap((row) =>
            [0, 1, 2].map((col) =>
              (row + col) % 2 === 0 ? <rect key={`${row}-${col}`} x={(col * 40) / 3} y={row * 10} width={40 / 3} height="10" fill={RED} /> : null,
            ),
          )}
        </>
      )}
      {kind === 'border' && (
        <>
          <rect width="40" height="30" fill={RED} />
          <path d="M0 0 H10 L16 3 L10 6 L16 9 L10 12 L16 15 L10 18 L16 21 L10 24 L16 27 L10 30 H0 Z" fill={WHITE} />
        </>
      )}
      {kind === 'clues' && (
        <>
          <rect width="40" height="30" fill={RED} />
          <rect width="40" height="10" fill={WHITE} />
          <circle cx="20" cy="15" r="9" fill={NAVY} />
          <path d="M16.6 12.2a3.5 3.5 0 1 1 5.6 2.8c-1 .8-1.4 1.3-1.4 2.6h-1.9c0-2 .7-2.9 1.9-3.8a1.7 1.7 0 1 0-2.4-1.6z M18.9 19.2h1.9v1.9h-1.9z" fill={YELLOW} />
        </>
      )}
      {kind === 'neighbors' && (
        <>
          <rect width="40" height="30" fill={WHITE} />
          <rect x="14" y="10" width="12" height="10" fill={YELLOW} stroke={NAVY} strokeWidth="1.2" />
          <rect x="0" y="0" width="13" height="14" fill={BLUE} />
          <rect x="15" y="0" width="25" height="8.5" fill={RED} />
          <rect x="27.5" y="10" width="12.5" height="20" fill={BLUE} />
          <rect x="0" y="16" width="12.5" height="14" fill={RED} />
          <rect x="14" y="21.5" width="12" height="8.5" fill={NAVY} />
        </>
      )}
      {kind === 'silhouette' && (
        <>
          <rect width="40" height="30" fill={YELLOW} />
          <path d="M9 9 L16 5 L24 7 L31 5 L34 11 L30 15 L33 21 L26 25 L18 23 L12 26 L7 20 L10 15 Z" fill={NAVY} />
        </>
      )}
      {kind === 'compare' && (
        <>
          <rect width="20" height="30" fill={BLUE} />
          <rect x="20" width="20" height="30" fill={RED} />
          <path d="M10 7 L16 17 H4 Z" fill={WHITE} />
          <path d="M30 23 L24 13 H36 Z" fill={WHITE} />
        </>
      )}
      {kind === 'star' && (
        <>
          <rect width="40" height="30" fill={NAVY} />
          <path d="M20 6 L22.6 13.1 L30 13.4 L24.2 18 L26.2 25.2 L20 21 L13.8 25.2 L15.8 18 L10 13.4 L17.4 13.1 Z" fill={YELLOW} />
        </>
      )}
    </svg>
  )
}
