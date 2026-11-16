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
