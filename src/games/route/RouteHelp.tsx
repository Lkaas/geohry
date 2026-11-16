/** Pravidla hry Cesta mezi zeměmi s příkladem. */
export function RouteHelp() {
  return (
    <>
      <p>Dostaneš startovní a cílovou zemi. Tvůj úkol je dojít z jedné do druhé po souši, tedy vyjmenovat země, přes které cesta vede.</p>
      <ul>
        <li>Na mapě vidíš jen start, cíl a země, které už jsi napsal. Zbytek světa si musíš představit.</li>
        <li>Země můžeš psát v libovolném pořadí. Hra končí, jakmile tvoje země propojí start s cílem.</li>
        <li>
          <strong style={{ color: '#1E9E57' }}>Zelená</strong> země leží na některé z nejkratších cest.
        </li>
        <li>
          <strong style={{ color: '#C96A10' }}>Oranžová</strong> znamená malou zacházku: cesta přes ni je o jednu zemi delší.
        </li>
        <li>
          <strong style={{ color: '#E03A3E' }}>Červená</strong> je mimo. Tip se ale počítá.
        </li>
        <li>Máš o čtyři tipy víc, než kolik zemí má nejkratší cesta.</li>
        <li>Když si nevíš rady, nech si napovědět obrys jedné země na cestě. Název musíš poznat sám.</li>
      </ul>
      <p>
        Příklad: z Česka do Portugalska vede nejkratší cesta přes tři země: Německo, Francii a Španělsko. Švýcarsko by bylo oranžové, Řecko
        červené.
      </p>
      <p>Počítají se jen pozemní hranice, takže ostrovní státy se ve hře neobjeví.</p>
    </>
  )
}
