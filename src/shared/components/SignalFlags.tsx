// Nápis G-E-O-H-R-Y vlajkami mezinárodní námořní signální abecedy.
const BLUE = '#0b3d91'
const RED = '#d62828'
const YELLOW = '#ffd23f'

/** Šest signálních vlajek. `small` = malá verze do hlavičky hry. */
export function SignalFlags({ small = false }: { small?: boolean }) {
  return (
    <div className={'signal' + (small ? ' signal--small' : '')} role="img" aria-label="GeoHry vlajkami signální abecedy">
      {/* G: svislé žluté a modré pruhy */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={YELLOW} />
        <rect x="10" width="10" height="60" fill={BLUE} />
        <rect x="30" width="10" height="60" fill={BLUE} />
        <rect x="50" width="10" height="60" fill={BLUE} />
      </svg>
      {/* E: nahoře modrá, dole červená */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="30" fill={BLUE} />
        <rect y="30" width="60" height="30" fill={RED} />
      </svg>
      {/* O: úhlopříčně dělená, žlutá u žerdi dole, červená nahoře */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={RED} />
        <path d="M0 0 L60 60 L0 60 Z" fill={YELLOW} />
      </svg>
      {/* H: svisle dělená, bílá a červená */}
      <svg viewBox="0 0 60 60">
        <rect width="30" height="60" fill="#ffffff" />
        <rect x="30" width="30" height="60" fill={RED} />
      </svg>
      {/* R: červená se žlutým křížem */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={RED} />
        <rect x="24" width="12" height="60" fill={YELLOW} />
        <rect y="24" width="60" height="12" fill={YELLOW} />
      </svg>
      {/* Y: šikmé žluté a červené pruhy */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={YELLOW} />
        <g transform="rotate(-45 30 30)" fill={RED}>
          {[-3.94, 13.03, 30, 46.97, 63.94].map((y) => (
            <rect key={y} x="-30" y={y} width="120" height="8.485" />
          ))}
        </g>
      </svg>
    </div>
  )
}
