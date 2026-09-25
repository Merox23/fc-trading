import { describe, expect, it } from 'vitest'
import { buyPriceHistory } from './priceHistory'
import type { Trade } from '../types'

function trade(id: string, name: string, buy: number, createdAt: string): Trade {
  return {
    id, user_id: 'u', player_name: name, card_version_id: null, rating: 90, chemstyle: 'Keiner',
    buy_price: buy, bid_price: null, buy_now_price: null, status: 'listed',
    sold_price: null, sold_type: null, sold_at: null, created_at: createdAt,
  }
}

describe('buyPriceHistory', () => {
  const trades: Trade[] = [
    trade('1', 'Jamal Musiala', 8000, '2026-09-01T10:00:00.000Z'),
    trade('2', 'jamal musiala', 9500, '2026-09-05T10:00:00.000Z'), // andere Schreibweise, zählt trotzdem
    trade('3', 'Erling Haaland', 20000, '2026-09-03T10:00:00.000Z'),
    trade('4', 'Musiala', 10000, '2026-09-10T10:00:00.000Z'), // exakter Name ohne Vorname
  ]

  it('findet nur Treffer mit exakt gleichem (getrimmtem, case-insensitivem) Namen', () => {
    const h = buyPriceHistory(trades, 'Jamal Musiala')
    expect(h).toEqual([
      { price: 8000, date: '2026-09-01T10:00:00.000Z' },
      { price: 9500, date: '2026-09-05T10:00:00.000Z' },
    ])
  })

  it('ist chronologisch aufsteigend sortiert (älteste zuerst)', () => {
    const h = buyPriceHistory(trades, 'jamal musiala   ') // mit Leerzeichen/Groß-Kleinschreibung
    expect(h.map((p) => p.price)).toEqual([8000, 9500])
  })

  it('schließt den aktuell bearbeiteten Eintrag per excludeId aus', () => {
    const h = buyPriceHistory(trades, 'Jamal Musiala', '1')
    expect(h).toEqual([{ price: 9500, date: '2026-09-05T10:00:00.000Z' }])
  })

  it('leerer Name liefert leere Liste', () => {
    expect(buyPriceHistory(trades, '')).toEqual([])
    expect(buyPriceHistory(trades, '   ')).toEqual([])
  })

  it('unbekannter Name liefert leere Liste', () => {
    expect(buyPriceHistory(trades, 'Unbekannt')).toEqual([])
  })

  it('begrenzt auf die letzten n Einträge (neueste behalten)', () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      trade(`m${i}`, 'Vielgehandelt', 1000 + i * 100, new Date(2026, 0, i + 1).toISOString()),
    )
    const h = buyPriceHistory(many, 'Vielgehandelt', undefined, 10)
    expect(h).toHaveLength(10)
    expect(h[0].price).toBe(1000 + 5 * 100) // älteste der behaltenen 10 (Index 5..14)
    expect(h[9].price).toBe(1000 + 14 * 100) // neueste
  })
})
