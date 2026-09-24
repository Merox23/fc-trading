import { describe, expect, it } from 'vitest'
import { snapToNearestValidPrice, snapUpToValidPrice } from './prices'

describe('Preisstufen (EA FC 27 Transfermarkt)', () => {
  it('Werte unter 200 und über 100.000 bleiben unverändert (keine gesicherte Tabelle)', () => {
    expect(snapToNearestValidPrice(50)).toBe(50)
    expect(snapToNearestValidPrice(199)).toBe(199)
    expect(snapToNearestValidPrice(150_000)).toBe(150_000)
    expect(snapUpToValidPrice(150)).toBe(200) // unter 200 -> auf unterste bekannte Stufe
    expect(snapUpToValidPrice(150_000)).toBe(150_000)
  })

  it('rundet innerhalb jedes Bereichs auf die nächste gültige Stufe', () => {
    expect(snapToNearestValidPrice(213)).toBe(200) // 200-1000: 50er
    expect(snapToNearestValidPrice(230)).toBe(250)
    expect(snapToNearestValidPrice(1040)).toBe(1000) // 1000-10000: 100er
    expect(snapToNearestValidPrice(1060)).toBe(1100)
    expect(snapToNearestValidPrice(10100)).toBe(10000) // 10000-50000: 250er
    expect(snapToNearestValidPrice(10200)).toBe(10250)
    expect(snapToNearestValidPrice(50100)).toBe(50000) // 50000-100000: 500er
    expect(snapToNearestValidPrice(50300)).toBe(50500)
  })

  it('bereits gültige Werte bleiben exakt gleich (idempotent)', () => {
    for (const v of [200, 250, 1000, 1100, 10000, 10250, 50000, 50500, 100000]) {
      expect(snapToNearestValidPrice(v)).toBe(v)
      expect(snapUpToValidPrice(v)).toBe(v)
    }
  })

  it('snapUp rundet nie nach unten, immer >= dem Ausgangswert', () => {
    for (let v = 200; v <= 100_000; v += 37) {
      const up = snapUpToValidPrice(v)
      expect(up).toBeGreaterThanOrEqual(v)
    }
  })

  it('snapUp an Bereichsgrenzen', () => {
    expect(snapUpToValidPrice(960)).toBe(1000)
    expect(snapUpToValidPrice(1001)).toBe(1100)
    expect(snapUpToValidPrice(49900)).toBe(50000)
    expect(snapUpToValidPrice(99900)).toBe(100000)
  })

  it('0 bleibt 0', () => {
    expect(snapToNearestValidPrice(0)).toBe(0)
    expect(snapUpToValidPrice(0)).toBe(0)
  })
})
