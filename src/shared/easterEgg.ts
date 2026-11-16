// Easter egg: když hráč do políčka pro zemi napíše celé "Československo" a potvrdí Enterem,
// objeví se pamětní obrazovka. V našeptávači se nenabízí a nepočítá se jako tip.
import { normalize } from './normalize'

export const EASTER_EGG_EVENT = 'geohry:ceskoslovensko'

/** Je napsaný text přesně "Československo" (bez ohledu na diakritiku a velikost písmen)? */
export function isCzechoslovakia(text: string): boolean {
  return normalize(text) === 'ceskoslovensko'
}

export function triggerEasterEgg(): void {
  window.dispatchEvent(new CustomEvent(EASTER_EGG_EVENT))
}

/** Jedna nota: název (např. 'C#5', 'B4'; 'r' = pomlka) a délka v dobách. */
export type Note = [name: string, beats: number]

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Frekvence noty v Hz podle názvu, např. 'A4' = 440 Hz. Pomlka ('r') = 0. */
export function noteToHz(name: string): number {
  if (name === 'r') return 0
  const match = /^([A-G])(#?)(\d)$/.exec(name)
  if (!match) throw new Error(`Neplatná nota: ${name}`)
  const midi = 12 * (Number(match[3]) + 1) + SEMITONES[match[1]] + (match[2] ? 1 : 0)
  return 440 * 2 ** ((midi - 69) / 12)
}

/**
 * Kde domov můj: první, česká část československé hymny. Hudba František Škroup (1834), volné dílo.
 * Noty jsou přepsané z notového záznamu hymny (v původní tónině E dur, 17 taktů ve 4/4).
 * Slovenská část hymny (Nad Tatrou sa blýska) chybí, její noty se nepodařilo ověřit.
 * Každý řádek je jeden takt: [nota, délka v dobách]. 'C5' ve 12. taktu je v zápisu B# (zvuk je stejný).
 */
export const MELODY: Note[] = [
  ['r', 1], ['B4', 2], ['C#5', 0.5], ['B4', 0.5],
  ['F#4', 1], ['A4', 2], ['G#4', 0.5], ['F#4', 0.5],
  ['E4', 2], ['r', 1], ['E4', 0.5], ['E4', 0.5],
  ['E4', 0.75], ['A4', 0.25], ['A4', 2], ['B4', 0.5], ['C#5', 0.5],
  ['B4', 0.5], ['G#4', 0.5], ['E4', 1], ['r', 1], ['E4', 0.5], ['E4', 0.5],
  ['E4', 0.5], ['A4', 0.5], ['A4', 0.5], ['C#5', 0.5], ['E5', 1], ['D#5', 0.5], ['C#5', 0.5],
  ['C#5', 1], ['B4', 1], ['r', 1], ['B4', 0.5], ['B4', 0.5],
  ['B4', 2.5], ['C#5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['G#4', 2], ['r', 1], ['B4', 0.5], ['B4', 0.5],
  ['D#5', 2.5], ['C#5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['G#4', 2], ['r', 1], ['G#4', 0.5], ['G#4', 0.5],
  ['G#4', 1.5], ['G#4', 0.5], ['G#4', 1], ['A#4', 0.5], ['C5', 0.5],
  ['C5', 0.5], ['C#5', 0.5], ['C#5', 1], ['r', 1], ['C#5', 0.5], ['C#5', 0.5],
  ['C#5', 0.5], ['B4', 0.5], ['B4', 2], ['A4', 0.5], ['B4', 0.5],
  ['G#4', 1], ['E5', 2], ['D#5', 0.5], ['C#5', 0.5],
  ['C#5', 1], ['B4', 2], ['F#4', 0.5], ['G#4', 0.5],
  ['E4', 2], ['r', 2],
]

/** Tempo: délka jedné doby v sekundách. Původní zápis má 88 úderů za minutu, tady je to pomalejší, smuteční. */
export const BEAT_SECONDS = 0.9
/** Pauza před tím, než se melodie začne opakovat. */
const LOOP_PAUSE_SECONDS = 3.5

/** Umělá ozvěna: šum, který pozvolna slábne (jako zvuk v prázdné hale). */
function makeReverb(ctx: AudioContext, seconds = 3): ConvolverNode {
  const length = Math.floor(ctx.sampleRate * seconds)
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.5
  }
  const reverb = ctx.createConvolver()
  reverb.buffer = impulse
  return reverb
}

/**
 * Přehraje melodii dokola přes Web Audio (žádný zvukový soubor). Zní jako tichý varhanní nástroj
 * v hale. Vrací funkci, která hudbu zastaví. Když prohlížeč zvuk nepovolí, tiše neudělá nic.
 */
export function playMelody(): () => void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return () => {}
    const ctx = new AudioCtx()
    const master = ctx.createGain()
    master.gain.value = 0.2
    // suchý zvuk + ozvěna, aby nota nekončila ostře
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 1800
    const wet = ctx.createGain()
    wet.gain.value = 0.55
    const reverb = makeReverb(ctx)
    tone.connect(master)
    tone.connect(reverb)
    reverb.connect(wet).connect(master)
    master.connect(ctx.destination)

    let stopped = false
    let timer: number | undefined

    const scheduleLoop = (startAt: number) => {
      let t = startAt
      for (const [name, beats] of MELODY) {
        const duration = beats * BEAT_SECONDS
        const frequency = noteToHz(name)
        if (frequency > 0) {
          // hlavní hlas, tišší tón o oktávu níž a nepatrný tón o oktávu výš
          for (const [ratio, level, type] of [[1, 0.8, 'triangle'], [0.5, 0.5, 'sine'], [2, 0.12, 'sine']] as const) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = type
            osc.frequency.value = frequency * ratio
            gain.gain.setValueAtTime(0, t)
            gain.gain.linearRampToValueAtTime(level, t + 0.07)
            gain.gain.setValueAtTime(level, t + Math.max(0.08, duration * 0.82))
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.5)
            osc.connect(gain).connect(tone)
            osc.start(t)
            osc.stop(t + duration + 0.6)
          }
        }
        t += duration
      }
      const length = t - startAt + LOOP_PAUSE_SECONDS
      timer = window.setTimeout(() => !stopped && scheduleLoop(ctx.currentTime + 0.05), length * 1000)
    }
    void ctx.resume().catch(() => {})
    scheduleLoop(ctx.currentTime + 0.3)

    return () => {
      stopped = true
      window.clearTimeout(timer)
      void ctx.close().catch(() => {})
    }
  } catch {
    return () => {}
  }
}
