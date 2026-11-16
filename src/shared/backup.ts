// Záloha a přenos postupu. Všechno, co si GeoHry pamatují (sbírka, statistiky, série, slabá místa),
// je v prohlížeči jednoho zařízení. Tady se to dá vyexportovat do textu a na jiném zařízení načíst.
import { listKeys, loadRaw, removeKey, saveRaw } from './storage'

const MAGIC = 'GEOHRY1:'
const MAX_BYTES = 2_000_000
const KEY_PATTERN = /^[a-z0-9:_-]{1,80}$/i
const COUNTRY_ID = /^[A-Z]{3}$/
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

export interface BackupFile {
  app: 'geohry'
  version: 1
  /** Kdy byla záloha vytvořena (ISO čas). */
  exportedAt: string
  /** Klíč -> uložený JSON text. */
  data: Record<string, string>
}

/** Stav rozehraných denních her ze starších dnů se do zálohy nedává: nikomu už nepomůže a jen by ji nafukoval. */
function isStaleDaily(key: string, today: string): boolean {
  const match = /^daily:[^:]+:(\d{4}-\d{2}-\d{2})$/.exec(key)
  return match !== null && match[1] < today
}

export function createBackup(today: string, now: Date = new Date()): BackupFile {
  const data: Record<string, string> = {}
  for (const key of listKeys()) {
    if (isStaleDaily(key, today)) continue
    const raw = loadRaw(key)
    if (raw !== null) data[key] = raw
  }
  return { app: 'geohry', version: 1, exportedAt: now.toISOString(), data }
}

// --- převod na text a zpět -------------------------------------------------------------------
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function fromBase64(code: string): string {
  const binary = atob(code)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Záloha jako jeden řádek textu, který jde zkopírovat do zprávy. */
export function encodeBackup(backup: BackupFile): string {
  return MAGIC + toBase64(JSON.stringify(backup))
}

/** Záloha jako čitelný soubor (JSON). */
export function backupToJson(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

/** Přijme kód ze zprávy i obsah staženého souboru. Cokoli jiného vrátí jako null. */
export function decodeBackup(text: string): BackupFile | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > MAX_BYTES * 2) return null
  try {
    // kód z chatu se mohl zalomit na víc řádků, proto se z něj odstraní všechny mezery
    const json = trimmed.startsWith(MAGIC) ? fromBase64(trimmed.slice(MAGIC.length).replace(/\s+/g, '')) : trimmed
    return validateBackup(JSON.parse(json))
  } catch {
    return null
  }
}

export function validateBackup(value: unknown): BackupFile | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (v.app !== 'geohry' || v.version !== 1 || typeof v.data !== 'object' || v.data === null) return null
  const data: Record<string, string> = {}
  let size = 0
  for (const [key, raw] of Object.entries(v.data as Record<string, unknown>)) {
    if (!KEY_PATTERN.test(key) || typeof raw !== 'string') return null
    try {
      JSON.parse(raw)
    } catch {
      return null
    }
    size += raw.length
    if (size > MAX_BYTES) return null
    data[key] = raw
  }
  return { app: 'geohry', version: 1, exportedAt: typeof v.exportedAt === 'string' ? v.exportedAt : '', data }
}

// --- shrnutí pro náhled před načtením ------------------------------------------------------------
export interface BackupSummary {
  countries: number
  played: number
  exportedAt: string
}

export function summarizeBackup(backup: BackupFile): BackupSummary {
  const parse = (key: string): unknown => {
    try {
      return backup.data[key] === undefined ? undefined : JSON.parse(backup.data[key])
    } catch {
      return undefined
    }
  }
  const album = parse('album')
  const countries = album && typeof album === 'object' ? Object.keys(album).filter((id) => COUNTRY_ID.test(id)).length : 0
  let played = 0
  for (const key of Object.keys(backup.data)) {
    if (!key.startsWith('stats:')) continue
    const stats = parse(key) as { played?: unknown } | undefined
    if (stats && typeof stats.played === 'number') played += stats.played
  }
  return { countries, played, exportedAt: backup.exportedAt }
}

// --- sloučení --------------------------------------------------------------------------------
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

/**
 * Spojí hodnotu z tohoto zařízení s hodnotou ze zálohy. Pravidla jsou pro každý druh údajů jiná:
 * sbírka se sjednotí (u země platí dřívější datum), statistiky se vezmou z toho, kde se hrálo víc,
 * slabá místa a malé příznaky ("viděl jsem nápovědu") se sloučí, ostatní zůstane, jak to je tady.
 */
export function mergeValue(key: string, local: unknown, incoming: unknown): unknown {
  if (local === undefined) return incoming
  if (key === 'album') {
    if (!isRecord(local) || !isRecord(incoming)) return local
    const out: Record<string, string> = {}
    for (const source of [local, incoming]) {
      for (const [id, date] of Object.entries(source)) {
        if (!COUNTRY_ID.test(id) || typeof date !== 'string' || !DATE_KEY.test(date)) continue
        if (out[id] === undefined || date < out[id]) out[id] = date
      }
    }
    return out
  }
  if (key.startsWith('stats:')) {
    return num(isRecord(incoming) ? incoming.played : 0) > num(isRecord(local) ? local.played : 0) ? incoming : local
  }
  if (key === 'trivia-seen') {
    const a = Array.isArray(local) ? local : []
    const b = Array.isArray(incoming) ? incoming : []
    return [...new Set([...a, ...b].filter((id): id is string => typeof id === 'string' && COUNTRY_ID.test(id)))]
  }
  if (key === 'weak') {
    if (!isRecord(local) || !isRecord(incoming)) return local
    const out: Record<string, Record<string, unknown>> = {}
    for (const source of [local, incoming]) {
      for (const [id, entry] of Object.entries(source)) {
        if (!COUNTRY_ID.test(id) || !isRecord(entry)) continue
        const prev = out[id]
        const last = typeof entry.last === 'string' ? entry.last : ''
        out[id] = {
          rounds: Math.max(num(prev?.rounds), num(entry.rounds)),
          lost: Math.max(num(prev?.lost), num(entry.lost)),
          fixed: Math.max(num(prev?.fixed), num(entry.fixed)),
          last: last > String(prev?.last ?? '') ? last : String(prev?.last ?? ''),
        }
      }
    }
    return out
  }
  if (key.startsWith('milestone:') || key.startsWith('help-seen:')) return local === true || incoming === true
  return local
}

export interface ApplyResult {
  written: number
}

/**
 * Zapíše zálohu do tohoto zařízení.
 * "merge" spojí zálohu s tím, co tu už je; "replace" nejdřív smaže všechno a nahraje jen zálohu.
 */
export function applyBackup(backup: BackupFile, mode: 'merge' | 'replace'): ApplyResult {
  if (mode === 'replace') for (const key of listKeys()) removeKey(key)
  let written = 0
  for (const [key, raw] of Object.entries(backup.data)) {
    const local = mode === 'merge' ? loadRaw(key) : null
    if (local === null) {
      saveRaw(key, raw)
    } else {
      try {
        saveRaw(key, JSON.stringify(mergeValue(key, JSON.parse(local), JSON.parse(raw))))
      } catch {
        saveRaw(key, raw) // místní hodnota je poškozená, platí záloha
      }
    }
    written++
  }
  return { written }
}
