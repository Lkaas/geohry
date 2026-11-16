import { describe, expect, it } from 'vitest'
import { getCountry } from '../../shared/data'
import {
  DRAWABLE_IDS, GRID, buildShareText, iou, maskStats, pickTarget, rasterize, scoreInPlace, scoreNormalized, starString, starsFor, thinPath, type Frame, type Ring,
} from './logic'

const frame: Frame = { x0: 0, y0: 0, x1: 100, y1: 100 }
const square = (x: number, y: number, side: number): Ring => [[x, y], [x + side, y], [x + side, y + side], [x, y + side]]
const fraction = (mask: Uint8Array) => maskStats(mask).count / (GRID * GRID)

describe('rasterize', () => {
  it('čtverec přes čtvrtinu plochy vyplní čtvrtinu mřížky', () => {
    expect(fraction(rasterize([square(0, 0, 50)], frame))).toBeCloseTo(0.25, 2)
  })
  it('těžiště odpovídá poloze tvaru', () => {
    const stats = maskStats(rasterize([square(50, 50, 50)], frame))
    expect(stats.cx / GRID).toBeCloseTo(0.75, 1)
    expect(stats.cy / GRID).toBeCloseTo(0.75, 1)
  })
  it('evenodd nechá díru (enkláva), nonzero ji u stejně orientovaných obrysů vyplní', () => {
    const outer = square(10, 10, 80)
    const hole = square(40, 40, 20)
    expect(fraction(rasterize([outer, hole], frame, 'evenodd'))).toBeCloseTo(0.64 - 0.04, 2)
    expect(fraction(rasterize([outer, hole], frame, 'nonzero'))).toBeCloseTo(0.64, 2)
  })
  it('nezáleží na směru obcházení', () => {
    const cw = square(20, 20, 40)
    const ccw = [...cw].reverse()
    expect(fraction(rasterize([cw], frame, 'nonzero'))).toBeCloseTo(fraction(rasterize([ccw], frame, 'nonzero')), 5)
  })
  it('tvar mimo rámec se ořízne a nic nespadne', () => {
    expect(fraction(rasterize([square(-50, -50, 100)], frame))).toBeCloseTo(0.25, 2)
    expect(fraction(rasterize([square(200, 200, 50)], frame))).toBe(0)
  })
  it('trojúhelník má poloviční plochu čtverce', () => {
    expect(fraction(rasterize([[[0, 0], [100, 0], [0, 100]]], frame))).toBeCloseTo(0.5, 2)
  })
})

describe('iou a scoreInPlace', () => {
  it('totožné tvary mají překryv 1, oddělené 0', () => {
    expect(scoreInPlace([square(20, 20, 40)], square(20, 20, 40), frame)).toBeCloseTo(1, 5)
    expect(scoreInPlace([square(0, 0, 30)], square(60, 60, 30), frame)).toBe(0)
  })
  it('posunutý čtverec má překryv podle vzorce', () => {
    // dva čtverce 40×40 posunuté o 20: průnik 20×40 = 800, sjednocení 2400 -> 1/3
    expect(scoreInPlace([square(10, 10, 40)], square(30, 10, 40), frame)).toBeCloseTo(1 / 3, 1)
  })
  it('prázdné masky dají 0', () => {
    expect(iou(new Uint8Array(4), new Uint8Array(4))).toBe(0)
  })
})

describe('scoreNormalized', () => {
  it('stejný tvar nakreslený jinde a v jiné velikosti dostane skoro plný počet', () => {
    const target = [square(100, 100, 300)]
    const { score, fitted } = scoreNormalized(target, square(5, 7, 20))
    expect(score).toBeGreaterThan(0.95)
    expect(fitted[0][0]).toBeCloseTo(100, 0)
    expect(fitted[2][1]).toBeCloseTo(400, 0)
  })
  it('jiný tvar dostane míň', () => {
    const target = [square(0, 0, 100)]
    const thin: Ring = [[0, 0], [400, 0], [400, 25], [0, 25]] // stejná plocha, jiný poměr stran
    expect(scoreNormalized(target, thin).score).toBeLessThan(0.5)
  })
  it('degenerovaný tah (čára) dá 0', () => {
    expect(scoreNormalized([square(0, 0, 100)], [[0, 0], [10, 0], [20, 0]]).score).toBe(0)
  })
})

describe('hvězdičky', () => {
  it('hranice', () => {
    expect([0, 0.34, 0.35, 0.5, 0.65, 0.79, 0.8, 1].map(starsFor)).toEqual([1, 1, 2, 3, 4, 4, 5, 5])
    expect(starString(3)).toBe('★★★☆☆')
  })
  it('text ke sdílení neprozrazuje zemi', () => {
    expect(buildShareText('16. 11. 2026', 0.724, 'context')).toBe('GeoHry: Nakresli hranici (16. 11. 2026)\n72 % ★★★★☆\ns mapou okolí')
    expect(buildShareText('volná hra', 0.2, 'memory').split('\n')[2]).toBe('z paměti, bez mapy')
  })
})

describe('thinPath', () => {
  it('vynechá příliš blízké body', () => {
    expect(thinPath([[0, 0], [1, 0], [2, 0], [5, 0], [5.5, 0], [10, 0]], 3)).toEqual([[0, 0], [5, 0], [10, 0]])
  })
})

describe('výběr země', () => {
  it('kreslitelné země nejsou ministáty ani souostroví', () => {
    expect(DRAWABLE_IDS.length).toBeGreaterThan(140)
    for (const id of ['CZE', 'FRA', 'BRA', 'ITA', 'USA', 'AUS', 'MDG']) expect(DRAWABLE_IDS, id).toContain(id)
    for (const id of ['VAT', 'MLT', 'IDN', 'PHL', 'JPN', 'NZL', 'DNK', 'TUV']) expect(DRAWABLE_IDS, id).not.toContain(id)
  })
  it('denní cíl je deterministický a kreslitelný', () => {
    const id = pickTarget('daily', '2026-11-16')
    expect(id).toBe(pickTarget('daily', '2026-11-16'))
    expect(getCountry(id).drawable).toBe(true)
  })
})
