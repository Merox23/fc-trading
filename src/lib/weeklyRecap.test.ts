import { describe, expect, it } from 'vitest'
import { mondayOfWeek, weekKey, weeklyRecap } from './weeklyRecap'
import type { Trade } from '../types'

function sold(id: string, name: string, buy: number, price: number, soldAt: string): Trade {
  return {
    id, user_id: 'u', player_name: name, card_version_id: null, rating: 90, chemstyle: 'Keiner',
    buy_price: buy, bid_price: null, buy_now_price: price, status: 'sold',
    sold_price: price, sold_type: 'buy_now', sold_at: soldAt, created_at: soldAt,
  }
}

describe('mondayOfWeek / weekKey', () => {
  it('findet den Montag für jeden Wochentag', () => {
    // 21.09.2026 ist ein Montag
    expect(mondayOfWeek(new Date(2026, 8, 21)).getDate()).toBe(21)
    expect(mondayOfWeek(new Date(2026, 8, 23)).getDate()).toBe(21) // Mittwoch
    expect(mondayOfWeek(new Date(2026, 8, 27)).getDate()).toBe(21) // Sonntag -> noch dieselbe Woche
    expect(mondayOfWeek(new Date(2026, 8, 28)).getDate()).toBe(28) // Montag danach
  })

  it('weekKey ändert sich nur beim Wochenwechsel', () => {
    const k1 = weekKey(new Date(2026, 8, 21))
    const k2 = weekKey(new Date(2026, 8, 27))
    const k3 = weekKey(new Date(2026, 8, 28))
    expect(k1).toBe(k2)
    expect(k1).not.toBe(k3)
    expect(k1).toBe('2026-09-21')
  })
})

describe('weeklyRecap', () => {
  // "jetzt" ist Montag, 28.09.2026 -> letzte Woche = Mo 21.09. bis So 27.09.2026
  const now = new Date(2026, 8, 28, 9, 0)

  it('erfasst nur Verkäufe der zuletzt abgeschlossenen Woche', () => {
    const trades = [
      sold('1', 'A', 5000, 7000, new Date(2026, 8, 21, 10).toISOString()), // Mo letzte Woche, Gewinn 1650
      sold('2', 'B', 3000, 10000, new Date(2026, 8, 27, 23, 30).toISOString()), // So letzte Woche, Gewinn 6500
      sold('3', 'C', 1000, 2000, new Date(2026, 8, 20, 10).toISOString()), // davor (vorletzte Woche) -> zählt nicht
      sold('4', 'D', 1000, 2000, new Date(2026, 8, 28, 10).toISOString()), // diese Woche -> zählt nicht
    ]
    const r = weeklyRecap(trades, now)
    expect(r.count).toBe(2)
    expect(r.totalProfit).toBe(1650 + 6500)
    expect(r.best).toEqual({ name: 'B', profit: 6500 })
  })

  it('leere Woche ergibt count 0 und best null', () => {
    const r = weeklyRecap([], now)
    expect(r).toMatchObject({ count: 0, totalProfit: 0, best: null })
  })

  it('ignoriert offene (nicht verkaufte) Angebote', () => {
    const trades: Trade[] = [
      {
        id: 'x', user_id: 'u', player_name: 'Offen', card_version_id: null, rating: 90, chemstyle: 'Keiner',
        buy_price: 100, bid_price: null, buy_now_price: null, status: 'listed',
        sold_price: null, sold_type: null, sold_at: null, created_at: new Date(2026, 8, 22).toISOString(),
      },
    ]
    expect(weeklyRecap(trades, now).count).toBe(0)
  })
})
