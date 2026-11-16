import { useMemo, useState } from 'react'
import { getCountry } from '../data'
import { dateKey } from '../random'
import { practiceQueue, recordPractice, weakList, type PracticeQuestion } from '../weak'
import { CountryInput } from './CountryInput'
import { Flag } from './Flag'
import { SignalFlags } from './SignalFlags'
import { ThemeToggle } from './ThemeToggle'
import type { Country } from '../types'

/** Slabá místa: země, které se ti nepodařilo vyřešit, a procvičování jen jich. */
export default function WeakSpotsPage() {
  const [version, setVersion] = useState(0)
  const [queue, setQueue] = useState<PracticeQuestion[] | null>(null)
  // `version` se zvýší po procvičování a seznam se spočítá znovu
  const items = useMemo(() => (version >= 0 ? weakList() : []), [version])

  const start = () => setQueue(practiceQueue(items))
  const finish = () => {
    setQueue(null)
    setVersion((v) => v + 1)
  }

  return (
    <div className="shell">
      <header className="shell__header">
        <a className="shell__home" href="#" aria-label="Zpět na přehled her">
          <SignalFlags small />
        </a>
        <div className="shell__title">
          <h1>Slabá místa</h1>
        </div>
        <div className="shell__actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="shell__main weak">
        {queue ? (
          <Practice queue={queue} onFinish={finish} />
        ) : items.length === 0 ? (
          <section className="weak__box">
            <h2 className="collection__count">Zatím nic</h2>
            <p>
              Sem se zapíše každá země, kterou nevyřešíš: v Tajemné zemi, Countryle, Tajemné vlajce, Siluetě nebo Sousedech. Čím víckrát, tím výš je v
              seznamu.
            </p>
            <p className="muted">Zapisuje se od nasazení téhle verze. Dřívější hry se do slabých míst nepočítají.</p>
          </section>
        ) : (
          <section className="weak__box">
            <h2 className="collection__count">
              {items.length} {items.length === 1 ? 'země dělá' : items.length < 5 ? 'země dělají' : 'zemí dělá'} potíže
            </h2>
            <p>Nejvýš jsou země, které se ti nepodařilo vyřešit nejčastěji. Správná odpověď při procvičování jednu potíž odečte.</p>
            <div>
              <button type="button" className="button button--primary" onClick={start}>
                Procvičit {Math.min(10, items.length)} {Math.min(10, items.length) === 1 ? 'zemi' : Math.min(10, items.length) < 5 ? 'země' : 'zemí'}
              </button>
            </div>
            <ul className="weak__list">
              {items.map((item) => {
                const country = getCountry(item.id)
                return (
                  <li key={item.id}>
                    <Flag country={country} className="flag--small" />
                    <a href={`#atlas-${item.id}`} className="weak__name">
                      {country.name}
                    </a>
                    <span className="muted">
                      nevyřešeno {item.trouble}× z {item.rounds} {item.rounds === 1 ? 'kola' : 'kol'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

type Answer = { given: Country | null; correct: boolean }

function Practice({ queue, onFinish }: { queue: PracticeQuestion[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [right, setRight] = useState(0)
  const today = dateKey()

  if (index >= queue.length) {
    const left = weakList().length
    return (
      <section className="weak__box">
        <h2 className="collection__count">
          Zvládl jsi {right} z {queue.length}
        </h2>
        <p>{left === 0 ? 'Žádné slabé místo ti nezbylo.' : `Slabých míst zbývá ${left}.`}</p>
        <div className="backup__buttons">
          <button type="button" className="button button--primary" onClick={onFinish}>
            Zpět na seznam
          </button>
        </div>
      </section>
    )
  }

  const question = queue[index]
  const target = getCountry(question.countryId)

  const submit = (given: Country | null) => {
    if (answer) return
    const correct = given?.id === target.id
    recordPractice(target.id, correct, today)
    if (correct) setRight((n) => n + 1)
    setAnswer({ given, correct })
  }

  const next = () => {
    setAnswer(null)
    setIndex((i) => i + 1)
  }

  return (
    <section className="weak__box weak__practice">
      <p className="muted">
        Otázka {index + 1} z {queue.length}
      </p>
      {question.kind === 'flag' ? (
        <>
          <h2 className="result__country">Čí je tahle vlajka?</h2>
          <Flag country={target} className="flag--large" decorative={false} />
        </>
      ) : (
        <>
          <h2 className="result__country">Která země má hlavní město {target.capital}?</h2>
        </>
      )}
      {answer ? (
        <>
          <p className={answer.correct ? 'weak__right' : 'weak__wrong'}>
            {answer.correct ? 'Správně.' : answer.given ? `Ne, ${answer.given.name} to není.` : 'Nevadí.'} Je to {target.name}
            {question.kind === 'flag' ? `, hlavní město ${target.capital}` : ''}.
          </p>
          <div className="backup__buttons">
            <button type="button" className="button button--primary" onClick={next} autoFocus>
              {index + 1 < queue.length ? 'Další' : 'Dokončit'}
            </button>
          </div>
        </>
      ) : (
        <>
          <CountryInput onSelect={submit} placeholder="Napiš zemi a potvrď Enterem" showFlags={false} autoFocus />
          <div>
            <button type="button" className="button button--ghost-dark" onClick={() => submit(null)}>
              Nevím
            </button>
          </div>
        </>
      )}
    </section>
  )
}
