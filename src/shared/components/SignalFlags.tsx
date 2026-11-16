// Nápis G-E-O-H-R-Y vlajkami mezinárodní námořní signální abecedy.
import { FLAG_MEANINGS } from '../secrets'
import { showToast } from '../toast'
const BLUE = '#0b3d91'
const RED = '#d62828'
const YELLOW = '#ffd23f'

/** Šest signálních vlajek. `small` = malá verze do hlavičky hry. `interactive` = na klik řeknou, co znamenají (easter egg). */
export function SignalFlags({ small = false, interactive = false }: { small?: boolean; interactive?: boolean }) {
  const flags = signalFlagSvgs(BLUE, RED, YELLOW)
  if (interactive) {
    return (
      <div className="signal signal--clickable" role="group" aria-label="GeoHry vlajkami signální abecedy">
        {flags.map((flag, i) => {
          const [letter, meaning] = FLAG_MEANINGS[i]
          return (
            <button
              key={letter}
              type="button"
              className="signal__flag"
              aria-label={`Vlajka ${letter}`}
              onClick={() => showToast({ title: `Vlajka ${letter}`, lines: [meaning] })}
            >
              {flag}
            </button>
          )
        })}
      </div>
    )
  }
  return (
    <div className={'signal' + (small ? ' signal--small' : '')} role="img" aria-label="GeoHry vlajkami signální abecedy">
      {flags}
    </div>
  )
}

/** Jednotlivé vlajky (G, E, O, H, R, Y) jako SVG. */
export function signalFlagSvgs(BLUE: string, RED: string, YELLOW: string) {
  return [
    // G: svislé žluté a modré pruhy
    <svg key="G" viewBox="0 0 60 60">
      <rect width="60" height="60" fill={YELLOW} />
      <rect x="10" width="10" height="60" fill={BLUE} />
      <rect x="30" width="10" height="60" fill={BLUE} />
      <rect x="50" width="10" height="60" fill={BLUE} />
    </svg>,
    // E: nahoře modrá, dole červená
    <svg key="E" viewBox="0 0 60 60">
      <rect width="60" height="30" fill={BLUE} />
      <rect y="30" width="60" height="30" fill={RED} />
    </svg>,
    // O: úhlopříčně dělená, žlutá u žerdi dole, červená nahoře
    <svg key="O" viewBox="0 0 60 60">
      <rect width="60" height="60" fill={RED} />
      <path d="M0 0 L60 60 L0 60 Z" fill={YELLOW} />
    </svg>,
    // H: svisle dělená, bílá a červená
    <svg key="H" viewBox="0 0 60 60">
      <rect width="30" height="60" fill="#ffffff" />
      <rect x="30" width="30" height="60" fill={RED} />
    </svg>,
    // R: červená se žlutým křížem
    <svg key="R" viewBox="0 0 60 60">
      <rect width="60" height="60" fill={RED} />
      <rect x="24" width="12" height="60" fill={YELLOW} />
      <rect y="24" width="60" height="12" fill={YELLOW} />
    </svg>,
    // Y: šikmé žluté a červené pruhy
    <svg key="Y" viewBox="0 0 60 60">
      <rect width="60" height="60" fill={YELLOW} />
      <g transform="rotate(-45 30 30)" fill={RED}>
        {[-3.94, 13.03, 30, 46.97, 63.94].map((y) => (
          <rect key={y} x="-30" y={y} width="120" height="8.485" />
        ))}
      </g>
    </svg>,
  ]
}
