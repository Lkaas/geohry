/** Pravidla hry Nakresli hranici. */
export function BorderHelp() {
  return (
    <>
      <p>Dostaneš název země a tvým úkolem je nakreslit její obrys co nejpřesněji.</p>
      <ul>
        <li>Stiskni tlačítko myši a jedním tahem obkresli hranice. Když tlačítko pustíš, konec tahu se spojí se začátkem.</li>
        <li>Nepovedlo se? Začni kreslit znovu, nový tah nahradí ten starý. Odevzdáváš až tlačítkem Vyhodnotit.</li>
        <li>Po vyhodnocení se přes tvůj tah ukáže skutečný tvar a dostaneš procenta a jednu až pět hvězdiček.</li>
      </ul>
      <p>Dvě obtížnosti:</p>
      <ul>
        <li>
          <strong>S mapou okolí:</strong> vidíš sousední země a moře, hledaná země je schovaná pod bílým místem. Záleží i na tom, kam a jak velký
          tvar nakreslíš.
        </li>
        <li>
          <strong>Z paměti:</strong> jen prázdný papír. Hodnotí se pouze tvar, na velikosti ani umístění nezáleží.
        </li>
      </ul>
      <p>
        Procenta říkají, jak moc se tvůj tvar překrývá se skutečným. Na tři hvězdičky stačí 50 %, na pět potřebuješ 80 %, a to už chce zemi
        opravdu znát.
      </p>
      <p>Kreslí se jen hlavní souvislá část území (Itálie bez Sicílie a Sardinie). Ministáty a souostroví se v této hře neobjevují.</p>
    </>
  )
}
