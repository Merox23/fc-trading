import { describe, expect, it } from 'vitest'
import { netProceeds, profit, taxLoss } from './calc'
import { fmt, fmtSigned } from './format'
import { lockedCoins, soldInRange, summarize, topByCount, topByPrice, topByProfit } from './stats'
import type { Trade } from '../types'

describe('EA-Steuer', () => {
  it('Erlös netto = 95 %, abgerundet', () => {
    expect(netProceeds(10000)).toBe(9500)
    expect(netProceeds(12500)).toBe(11875)
    expect(netProceeds(12345)).toBe(11727) // 11727,75 -> 11727
    expect(netProceeds(999)).toBe(949) // 949,05 -> 949
    expect(netProceeds(100)).toBe(95)
    expect(netProceeds(1)).toBe(0)
    expect(netProceeds(0)).toBe(0)
    expect(netProceeds(15000000)).toBe(14250000)
  })

  it('Steuerverlust = Verkaufspreis - Erlös netto', () => {
    expect(taxLoss(10000)).toBe(500)
    expect(taxLoss(12345)).toBe(618)
    expect(taxLoss(1)).toBe(1)
  })

  it('Gewinn = Erlös netto - Einkaufspreis', () => {
    expect(profit(12500, 10000)).toBe(1875)
    expect(profit(10000, 10000)).toBe(-500) // Verkauf zum Einkaufspreis ist ein Verlust
    expect(profit(50000, 45000)).toBe(2500)
    expect(profit(9000, 10000)).toBe(-1450)
  })

  it('stimmt für viele Preise exakt mit Ganzzahl-Rechnung überein (keine Rundungsfehler)', () => {
    for (let p = 0; p <= 100000; p += 1) {
      expect(netProceeds(p)).toBe(Number((BigInt(p) * 95n) / 100n))
      expect(netProceeds(p) + taxLoss(p)).toBe(p)
    }
  })
})

describe('Anzeige', () => {
  it('Tausendertrennzeichen', () => {
    expect(fmt(12500)).toBe('12.500')
    expect(fmt(1000)).toBe('1.000')
    expect(fmt(950)).toBe('950')
    expect(fmt(1250000)).toBe('1.250.000')
    expect(fmtSigned(1875)).toBe('+1.875')
    expect(fmtSigned(-500)).toBe('\u2212500')
    expect(fmtSigned(0)).toBe('0')
  })
})

function sold(name: string, buy: number, price: number, at: string): Trade {
  return {
    id: name + at,
    user_id: 'u',
    player_name: name,
    card_version_id: null,
    rating: 90,
    chemstyle: 'Keiner',
    buy_price: buy,
    bid_price: null,
    buy_now_price: price,
    status: 'sold',
    sold_price: price,
    sold_type: 'buy_now',
    sold_at: at,
    created_at: at,
  }
}

describe('Statistik', () => {
  const now = new Date(2026, 8, 21, 12, 0) // 21.09.2026, lokal
  const trades: Trade[] = [
    sold('Müller', 10000, 12500, new Date(2026, 8, 21, 8, 0).toISOString()), // heute, Gewinn 1.875
    sold('müller ', 20000, 30000, new Date(2026, 8, 18, 9, 0).toISOString()), // 3 Tage her, Gewinn 8.500
    sold('Kane', 5000, 4000, new Date(2026, 8, 10, 9, 0).toISOString()), // 11 Tage her, Gewinn -1.200
    sold('Kane', 5000, 4000, new Date(2026, 7, 1, 9, 0).toISOString()), // Vormonat
    { ...sold('Offen', 7000, 9000, ''), status: 'listed', sold_price: null, sold_type: null, sold_at: null },
    { ...sold('Offen2', 3000, 4000, ''), status: 'listed', sold_price: null, sold_type: null, sold_at: null },
  ]

  it('Zeitfilter', () => {
    expect(soldInRange(trades, 'today', now)).toHaveLength(1)
    expect(soldInRange(trades, '7d', now)).toHaveLength(2)
    expect(soldInRange(trades, '30d', now)).toHaveLength(3)
    expect(soldInRange(trades, 'all', now)).toHaveLength(4)
  })

  it('Summen', () => {
    const s = summarize(soldInRange(trades, '7d', now))
    expect(s.count).toBe(2)
    expect(s.revenueNet).toBe(11875 + 28500)
    expect(s.tax).toBe(625 + 1500)
    expect(s.profit).toBe(1875 + 8500)
  })

  it('gebundene Coins = Einkaufspreise offener Angebote', () => {
    expect(lockedCoins(trades)).toBe(10000)
  })

  it('Top-Listen', () => {
    const all = soldInRange(trades, 'all', now)
    expect(topByPrice(all, 1)[0].sold_price).toBe(30000)
    const c = topByCount(all)
    expect(c[0].count).toBe(2) // Müller (Schreibweise egal) und Kane haben je 2 Verkäufe
    expect(c).toHaveLength(2)
    const p = topByProfit(all)
    expect(p[0].name.toLowerCase()).toBe('müller')
    expect(p[0].profit).toBe(1875 + 8500)
    expect(p[1].profit).toBe(-1200 - 1200)
  })
})
