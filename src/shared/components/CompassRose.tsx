// Kompasová růžice, ozdoba domovské stránky. Barvu bere z CSS (color), na námořních mapách je purpurová.
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 5 * Math.PI) / 180
  const inner = i % 3 === 0 ? 84 : 87
  const point = (r: number) => `${(Math.sin(angle) * r).toFixed(1)} ${(-Math.cos(angle) * r).toFixed(1)}`
  return `M${point(inner)}L${point(92)}`
}).join('')

export function CompassRose({ className = '' }: { className?: string }) {
  return (
    <svg className={'rose ' + className} viewBox="-100 -100 200 200" fill="none" stroke="currentColor" aria-hidden="true">
      <circle r="92" strokeWidth="1.2" />
      <circle r="80" strokeWidth="0.8" />
      <circle r="52" strokeWidth="0.8" />
      <path d={TICKS} strokeWidth="0.7" />
      <path d="M0-78 9-9 78 0 9 9 0 78-9 9-78 0-9-9Z" strokeWidth="1.2" />
      <path d="M0-78 0 0 9-9ZM78 0 0 0 9 9ZM0 78 0 0-9 9ZM-78 0 0 0-9-9Z" fill="currentColor" stroke="none" />
      <path d="M36-36 12 0 36 36 0 12-36 36-12 0-36-36 0-12Z" strokeWidth="0.9" />
      <text y="-58" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Georgia, serif" fontSize="15" fontStyle="italic">
        S
      </text>
    </svg>
  )
}
