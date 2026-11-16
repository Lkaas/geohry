import { useEffect, useState } from 'react'

// Jednoduché směrování přes část adresy za # (např. index.html#tajemna-zeme).
// Záměrně jen prosté jméno bez lomítek: funguje na GitHub Pages i ve vložených náhledech.
function currentRoute(): string {
  return decodeURIComponent(window.location.hash.replace(/^#/, ''))
}

/** Vrátí aktuální cestu (text za #). Prázdný řetězec = domovská obrazovka. */
export function useRoute(): string {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const onChange = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function navigate(route: string): void {
  window.location.hash = route
}
