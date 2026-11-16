import { DAILY_LENGTH, PARAMS, WIN_STREAK } from './logic'

/** Pravidla hry Víc, nebo míň? */
export function HigherLowerHelp() {
  return (
    <>
      <p>Vidíš dvě země. U první znáš hodnotu, u druhé hádáš, jestli má víc, nebo míň.</p>
      <ul>
        <li>Když odpovíš správně, druhá země se posune doleva a přijde nová. Hraje se do první chyby.</li>
        <li>Každé kolo má jedno téma a ta se nemíchají: {PARAMS.map((p) => p.label.toLowerCase()).join(', ')}.</li>
        <li>
          Denní výzva má téma podle dne a nejvýš {DAILY_LENGTH} dvojic. Splněná je od série {WIN_STREAK}.
        </li>
        <li>Ve volné hře si téma vybíráš sám a série může být libovolně dlouhá.</li>
        <li>Dvojice s téměř stejnou hodnotou hra nedává, rozdíl je vždy aspoň 15 % (u teploty 1,5 °C).</li>
      </ul>
      <p>HDP je v amerických dolarech za poslední dostupný rok. Země, u kterých údaj chybí, se v daném tématu neobjeví.</p>
    </>
  )
}
