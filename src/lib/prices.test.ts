import { describe, expect, it } from 'vitest'
import { nextStepAbove, nextStepBelow, snapToNearestValidPrice, snapUpToValidPrice } from './prices'

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

describe('Dein Beispiel: 5555 als Einkaufspreis', () => {
  it('rundet auf 5600 (5555 -> 5600, 1000-10000: 100er, .55 rundet auf)', () => {
    expect(snapToNearestValidPrice(5555)).toBe(5600)
  })
})

describe('nextStepAbove / nextStepBelow: Verknüpfung Gebot <-> Sofortkauf', () => {
  it('einfache Fälle innerhalb eines Bereichs', () => {
    expect(nextStepAbove(1200)).toBe(1300)
    expect(nextStepBelow(1200)).toBe(1100)
    expect(nextStepAbove(300)).toBe(350) // 200-1000: 50er
    expect(nextStepBelow(300)).toBe(250)
  })

  it('rundet vorher auf eine gültige Stufe, falls nötig', () => {
    expect(nextStepAbove(1230)).toBe(1300) // 1230 -> 1200 -> 1300
    expect(nextStepBelow(1230)).toBe(1100) // 1230 -> 1200 -> 1100
  })

  it('wechselt an Bereichsgrenzen korrekt die Schrittweite', () => {
    expect(nextStepAbove(1000)).toBe(1100) // oberhalb 1000 gilt der 100er-Schritt
    expect(nextStepBelow(1000)).toBe(950) // unterhalb 1000 gilt noch der 50er-Schritt
    expect(nextStepAbove(10000)).toBe(10250)
    expect(nextStepBelow(10000)).toBe(9900)
    expect(nextStepAbove(50000)).toBe(50500)
    expect(nextStepBelow(50000)).toBe(49750)
  })

  it('bleibt an den äußeren Grenzen (200 bzw. 100.000) stehen', () => {
    expect(nextStepBelow(200)).toBe(200)
    expect(nextStepAbove(100000)).toBe(100000)
  })

  it('außerhalb der Tabelle bleibt der Wert unverändert', () => {
    expect(nextStepAbove(150)).toBe(150)
    expect(nextStepBelow(150)).toBe(150)
    expect(nextStepAbove(150000)).toBe(150000)
    expect(nextStepBelow(150000)).toBe(150000)
  })

  it('ist immer echt höher/niedriger als der Ausgangswert (innerhalb der Tabelle)', () => {
    for (let v = 200; v <= 100000; v += 233) {
      expect(nextStepAbove(v)).toBeGreaterThan(snapToNearestValidPrice(v) - 1)
      if (v < 100000) expect(nextStepAbove(v)).toBeGreaterThanOrEqual(snapToNearestValidPrice(v))
      if (v > 200) expect(nextStepBelow(v)).toBeLessThanOrEqual(snapToNearestValidPrice(v))
    }
  })
})
