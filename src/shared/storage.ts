// Ukládání do localStorage. Když prohlížeč úložiště nepovolí (anonymní režim, vložený rámec),
// drží se data aspoň v paměti do zavření stránky a nic nespadne.
const PREFIX = 'geohry:'
const memory = new Map<string, string>()

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key) ?? memory.get(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    const raw = memory.get(key)
    try {
      return raw == null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  }
}

export function saveJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    localStorage.setItem(PREFIX + key, raw)
  } catch {
    // úložiště není dostupné, zůstává jen kopie v paměti
  }
}

/** Všechny uložené klíče (bez předpony). Slouží záloze postupu. */
export function listKeys(): string[] {
  const keys = new Set(memory.keys())
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(PREFIX)) keys.add(key.slice(PREFIX.length))
    }
  } catch {
    // úložiště není dostupné, zůstávají klíče z paměti
  }
  return [...keys].sort()
}

/** Uložený text tak, jak je (JSON), nebo null. */
export function loadRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key) ?? memory.get(key) ?? null
  } catch {
    return memory.get(key) ?? null
  }
}

/** Zapíše hotový JSON text. Vstup musí být platný JSON. */
export function saveRaw(key: string, raw: string): void {
  memory.set(key, raw)
  try {
    localStorage.setItem(PREFIX + key, raw)
  } catch {
    // úložiště není dostupné, zůstává jen kopie v paměti
  }
}

export function removeKey(key: string): void {
  memory.delete(key)
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // nic
  }
}
