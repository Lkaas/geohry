import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { isCzechoslovakia, triggerEasterEgg } from '../easterEgg'
import { searchCountries } from '../normalize'
import { findSecretWord } from '../secrets'
import { showToast } from '../toast'
import { DOMAIN_NOTES, countryForDomain, parseDomain, takeTrivia } from '../trivia'
import type { Country } from '../types'
import { Flag } from './Flag'

interface CountryInputProps {
  onSelect: (country: Country) => void
  /** Kódy zemí, které se už nemají nabízet (použité tipy). */
  exclude?: ReadonlySet<string>
  placeholder?: string
  disabled?: boolean
  /** Zobrazovat v nabídce vlajky. U vlajkových her vypni, jinak by to byla nápověda. */
  showFlags?: boolean
  autoFocus?: boolean
}

const MAX_SUGGESTIONS = 8

/**
 * Políčko pro zadání země s našeptávačem.
 * Ovládání: psaní (i bez diakritiky), šipky nahoru/dolů, Enter potvrdí zvýrazněnou zemi, Esc zavře nabídku.
 */
export function CountryInput({ onSelect, exclude, placeholder = 'Napiš zemi…', disabled, showFlags = true, autoFocus }: CountryInputProps) {
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const hits = useMemo(() => searchCountries(text, { exclude, limit: MAX_SUGGESTIONS }), [text, exclude])

  useEffect(() => setActive(0), [text])

  const choose = (country: Country, quiet = false) => {
    onSelect(country)
    setText('')
    setOpen(false)
    inputRef.current?.focus()
    // perlička o zemi (jednou za zemi). V hrách o vlajkách se nezobrazuje, aby nic nenapovídala.
    if (!quiet && showFlags) {
      const note = takeTrivia(country.id)
      if (note) showToast({ title: note.title, lines: note.lines })
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, hits.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // easter egg: celé slovo "Československo" otevře pamětní obrazovku a nepočítá se jako tip
      if (isCzechoslovakia(text)) {
        triggerEasterEgg()
        setText('')
        setOpen(false)
        return
      }
      // národní doména (.tv, .fm, .uk): vybere zemi, a když je k doméně poznámka, ukáže ji
      const tld = parseDomain(text)
      if (tld) {
        const domainCountry = countryForDomain(tld)
        const note = DOMAIN_NOTES[tld]
        if (domainCountry || note) {
          if (domainCountry && !exclude?.has(domainCountry.id)) choose(domainCountry, true)
          else {
            setText('')
            setOpen(false)
          }
          if (note) showToast({ title: note.title, lines: note.lines })
          return
        }
      }
      // tajná slova (fiktivní a zaniklé země) ukážou hlášku a nepočítají se jako tip
      const secret = findSecretWord(text)
      if (secret) {
        showToast({ title: secret.title, lines: secret.lines })
        setText('')
        setOpen(false)
        return
      }
      if (hits[active]) choose(hits[active].country)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && text.trim().length > 0

  return (
    <div className="country-input">
      <input
        ref={inputRef}
        type="text"
        className="country-input__field"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && hits[active] ? `${listId}-${hits[active].country.id}` : undefined}
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="country-input__list" id={listId} role="listbox">
          {hits.length === 0 && <li className="country-input__empty">Žádná země neodpovídá. Zkus jiný název.</li>}
          {hits.map((hit, i) => (
            <li
              key={hit.country.id}
              id={`${listId}-${hit.country.id}`}
              role="option"
              aria-selected={i === active}
              className={'country-input__option' + (i === active ? ' country-input__option--active' : '')}
              // onMouseDown místo onClick: políčko nesmí ztratit fokus dřív, než se výběr zpracuje
              onMouseDown={(e) => {
                e.preventDefault()
                choose(hit.country)
              }}
              onMouseEnter={() => setActive(i)}
            >
              {showFlags && <Flag country={hit.country} className="flag--small" />}
              <span>{hit.country.name}</span>
              {hit.matched !== hit.country.name && <span className="country-input__alias">{hit.matched}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
