/** Pravidla hry Tajemná vlajka. */
export function FlagCluesHelp() {
  return (
    <>
      <p>Hra si myslí jednu vlajku a popisuje ji slovy. Nápovědy začínají mlhavě a postupně přitvrzují.</p>
      <ul>
        <li>Na začátku vidíš jednu nápovědu. Po každém tipu, nebo když si řekneš o další bez tipování, se odkryje další.</li>
        <li>Čím dřív vlajku poznáš, tím lépe. Po poslední nápovědě máš ještě jeden tip.</li>
        <li>Hra průběžně ukazuje, kolika vlajkám světa všechny odkryté nápovědy odpovídají.</li>
        <li>U každého špatného tipu vidíš, na kolik tehdy odkrytých nápověd tvoje vlajka seděla.</li>
      </ul>
      <p>Příklad pro Turecko: „Není na ní modrá barva.“ → „Vlajka má dvě barvy.“ → „Červená zabírá asi 95 % plochy.“ → „Je na ní hvězda.“</p>
      <p>Pár upřesnění:</p>
      <ul>
        <li>Podíly barev jsou změřené z obrázku vlajky a zaokrouhlené na 5 %. „Asi 35 %“ znamená 30 až 40 %.</li>
        <li>Světle modrá se počítá jako modrá, vínová jako červená, zlatá jako žlutá. Drobné detaily státních znaků se nepočítají.</li>
        <li>Předposlední nápověda prozradí kontinent. Když ani to nestačí (některé vlajky jsou si velmi podobné), přidá se první písmeno názvu.</li>
      </ul>
    </>
  )
}
