import { heatColor } from './logic'

/** Pravidla hry Tajemná země s příkladem. */
export function MysteryHelp() {
  const example = [
    { name: 'Japonsko', km: 8047, text: '8 047 km' },
    { name: 'Francie', km: 370, text: '370 km, přihořívá' },
    { name: 'Rakousko', km: 0, text: 'sousedí!' },
  ]
  return (
    <>
      <p>Hra si myslí jednu zemi světa. Tvůj úkol je přijít na to, která to je.</p>
      <ul>
        <li>Napiš jakoukoli zemi. Obarví se na mapě podle toho, jak daleko má hranice od hranic tajemné země.</li>
        <li>Modrá znamená daleko, žlutá a oranžová blíž, červená velmi blízko.</li>
        <li>Když tvůj tip s tajemnou zemí sousedí, hra to řekne.</li>
        <li>U každého tipu se dozvíš, jestli přihořívá, nebo chladne oproti tomu předchozímu.</li>
        <li>Počet tipů není omezený, ale čím méně jich potřebuješ, tím lépe.</li>
      </ul>
      <p>Příklad, kdy je tajemná země Česko:</p>
      <ul className="help-example">
        {example.map((row) => (
          <li key={row.name}>
            <span className="guess__chip" style={{ background: heatColor(row.km) }} />
            <strong>{row.name}</strong>
            <span>{row.text}</span>
          </li>
        ))}
      </ul>
      <p>Mapu přiblížíš kolečkem myši nebo tlačítky, posuneš ji tažením. Malé státy jsou vyznačené kroužkem.</p>
    </>
  )
}
