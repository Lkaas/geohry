import { MAX_MISTAKES } from './logic'

/** Pravidla hry Sousedé. */
export function NeighborsHelp() {
  return (
    <>
      <p>Dostaneš zemi a tvým úkolem je vyjmenovat všechny státy, se kterými má pozemní hranici.</p>
      <ul>
        <li>Na mapě je vidět jen zadaná země. Sousedé se objevují, jak je nacházíš.</li>
        <li>Na pořadí nezáleží. Hra ti řekne, kolik sousedů celkem hledáš.</li>
        <li>Můžeš udělat nejvýš {MAX_MISTAKES - 1} chyby, třetí hru ukončí.</li>
        <li>Po prohře se chybějící sousedé ukážou čárkovaně.</li>
      </ul>
      <p>Co se počítá jako hranice:</p>
      <ul>
        <li>Pozemní hranice mezi 197 zeměmi hry. Španělsko sousedí s Marokem (Ceuta a Melilla).</li>
        <li>
          Hranice přes zámořská území, která jsou součástí státu: Francie sousedí s Nizozemskem na ostrově Svatý Martin a přes Francouzskou
          Guyanu s Brazílií a Surinamem. Na mapě se tyto země nedotýkají, ale jako sousedé se uznají.
        </li>
        <li>Západní Sahara ve hře není, proto Maroko nesousedí s Mauritánií.</li>
      </ul>
    </>
  )
}
