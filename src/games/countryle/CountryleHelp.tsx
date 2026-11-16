/** Pravidla hry Countryle. */
export function CountryleHelp() {
  return (
    <>
      <p>Hledáš jednu zemi světa. Po každém tipu uvidíš, v čem se tvoje země podobá té hledané.</p>
      <ul>
        <li>
          <strong>Kontinent a polokoule:</strong> zelená znamená shodu, šedá neshodu. Polokoule se určuje podle středu země.
        </li>
        <li>
          <strong>Obyvatel, rozloha a průměrná teplota:</strong> vidíš hodnotu své země. Šipka ▲ říká, že hledaná země má víc, ▼ že má míň.
          Zelená znamená velmi blízko, žlutá středně blízko, šedá daleko.
        </li>
        <li>
          <strong>Kde hledat:</strong> směr a vzdálenost od středu tvé země ke středu té hledané.
        </li>
        <li>Máš 8 pokusů.</li>
      </ul>
      <p>
        Příklad: napíšeš Brazílii a u obyvatel vidíš „213,4 mil. ▼“ šedě. Hledaná země má tedy obyvatel mnohem méně. Směr „9 600 km na
        severovýchod“ tě pošle do Evropy.
      </p>
      <p>
        Průměrná teplota je roční průměr přes celé území země, takže třeba Rusko a Kanada vycházejí pod nulou. Jedna země (Tchaj-wan) údaj o
        teplotě nemá.
      </p>
    </>
  )
}
