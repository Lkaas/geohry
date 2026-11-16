import { MAX_GUESSES } from './logic'

/** Pravidla hry Silueta. */
export function SilhouetteHelp() {
  return (
    <>
      <p>Vidíš jen obrys země, bez sousedů a bez měřítka. Poznáš, která to je?</p>
      <ul>
        <li>Máš {MAX_GUESSES} pokusů.</li>
        <li>Po špatném tipu se dozvíš vzdálenost a směr od středu tvé země ke středu té hledané.</li>
        <li>Procenta ukazují blízkost: 100 % je správná země, 0 % země na opačné straně světa.</li>
        <li>Obrys je vždy roztažený na celou plochu, takže velikost země z něj nepoznáš.</li>
      </ul>
      <p>Obrys zahrnuje i ostrovy. Ministáty a drobné ostrovní státy se v této hře neobjevují.</p>
    </>
  )
}
