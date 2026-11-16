import { MAX_GUESSES } from './logic'

/** Pravidla hry GeoGrid. */
export function GeoGridHelp() {
  return (
    <>
      <p>Vyplň mřížku 3×3. Každý řádek a každý sloupec má svou podmínku a do políčka patří země, která splní obě najednou.</p>
      <ul>
        <li>Klikni na políčko, napiš zemi a potvrď Enterem.</li>
        <li>Každou zemi smíš použít jen jednou.</li>
        <li>
          Máš {MAX_GUESSES} tipů na 9 políček. Počítá se každý tip, správný i špatný, takže si můžeš dovolit tři chyby.
        </li>
        <li>Po špatném tipu ti hra řekne, kterou podmínku země nesplnila.</li>
        <li>
          Číslo u vyplněného políčka je vzácnost odpovědi od 0 do 100. Čím menší a méně známá země (podle počtu obyvatel mezi všemi správnými
          odpověďmi), tím vyšší číslo.
        </li>
      </ul>
      <p>
        Příklad: řádek „Evropa“ a sloupec „Vlajka s křížem“. Sedí Švédsko, Řecko nebo Švýcarsko. Itálie ne, protože na vlajce kříž nemá.
      </p>
      <p>Pár upřesnění k vlajkám:</p>
      <ul>
        <li>Barvy: světle modrá se počítá jako modrá, vínová jako červená, zlatá jako žlutá. Drobné detaily státních znaků se nepočítají.</li>
        <li>Slunce znamená slunce s paprsky (Argentina), samotný kotouč jako u Japonska ne.</li>
        <li>Kříž zahrnuje i britskou vlajku v rohu (Austrálie).</li>
        <li>V češtině je Ch samostatné písmeno, takže Chile nezačíná na C. Stejně tak Č, Š a Ž.</li>
      </ul>
    </>
  )
}
