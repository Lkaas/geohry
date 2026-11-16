import { useMemo } from 'react'
import { dailyAnswers } from '../dailyAnswers'
import { flagOfDay } from '../flagOfDay'
import { dateKey } from '../random'
import { Flag } from './Flag'

/** Vlajka dne s jednou větou spočítanou z dat. Nikdy nevybere zemi, která je dnes hledaná v některé hře. */
export function FlagOfDay() {
  const today = dateKey()
  const { country, fact } = useMemo(() => flagOfDay(today, dailyAnswers(today)), [today])
  return (
    <section className="flag-day" aria-label="Vlajka dne">
      <Flag country={country} className="flag-day__flag" decorative={false} />
      <div>
        <p className="flag-day__title">
          Vlajka dne: <strong>{country.name}</strong>
        </p>
        <p className="flag-day__fact">{fact}</p>
      </div>
    </section>
  )
}
