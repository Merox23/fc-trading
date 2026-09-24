import { describe, expect, it } from 'vitest'
import { netProceeds, profit, taxLoss } from './calc'
import { fmt, fmtSigned } from './format'
import { lockedCoins, potentialIfAllSold, soldInRange, summarize, topByCount, topByPrice, topByProfit } from './stats'
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

  it('möglicher Erlös/Gewinn, wenn alle offenen Angebote zum Sofortkaufpreis verkauft würden', () => {
    // offen: Offen (Einkauf 7000, Sofortkauf 9000) und Offen2 (Einkauf 3000, Sofortkauf 4000)
    const p = potentialIfAllSold(trades)
    expect(p.revenueNet).toBe(Math.floor(9000 * 0.95) + Math.floor(4000 * 0.95))
    expect(p.profit).toBe((Math.floor(9000 * 0.95) - 7000) + (Math.floor(4000 * 0.95) - 3000))
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

import { LISTED_SORT_OPTIONS, SOLD_SORT_OPTIONS, sortListed, sortSold } from './sort'

function listed(name: string, buy: number, buyNow: number, createdAt: string): Trade {
  return {
    id: name + createdAt,
    user_id: 'u',
    player_name: name,
    card_version_id: null,
    rating: 90,
    chemstyle: 'Keiner',
    buy_price: buy,
    bid_price: null,
    buy_now_price: buyNow,
    status: 'listed',
    sold_price: null,
    sold_type: null,
    sold_at: null,
    created_at: createdAt,
  }
}

describe('Sortierung offene Angebote', () => {
  const trades: Trade[] = [
    listed('Bravo', 5000, 9000, '2026-09-10T10:00:00.000Z'),
    listed('alpha', 1000, 2000, '2026-09-12T10:00:00.000Z'),
    listed('Charlie', 3000, 6000, '2026-09-11T10:00:00.000Z'),
  ]

  it('jede Option hat eine passende Sortierfunktion (kein Absturz, gleiche Länge)', () => {
    for (const { value } of LISTED_SORT_OPTIONS) {
      const result = sortListed(trades, value)
      expect(result).toHaveLength(3)
    }
  })

  it('Neueste zuerst = Standard', () => {
    expect(sortListed(trades, 'created_desc').map((t) => t.player_name)).toEqual(['alpha', 'Charlie', 'Bravo'])
  })
  it('Älteste zuerst', () => {
    expect(sortListed(trades, 'created_asc').map((t) => t.player_name)).toEqual(['Bravo', 'Charlie', 'alpha'])
  })
  it('Einkauf hoch -> niedrig', () => {
    expect(sortListed(trades, 'buy_desc').map((t) => t.buy_price)).toEqual([5000, 3000, 1000])
  })
  it('Sofortkauf niedrig -> hoch', () => {
    expect(sortListed(trades, 'buynow_asc').map((t) => t.buy_now_price)).toEqual([2000, 6000, 9000])
  })
  it('Name A-Z, unabhängig von Groß-/Kleinschreibung', () => {
    expect(sortListed(trades, 'name_asc').map((t) => t.player_name)).toEqual(['alpha', 'Bravo', 'Charlie'])
  })
})

function soldTrade(name: string, buy: number, price: number, soldAt: string): Trade {
  return {
    id: name + soldAt,
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
    sold_at: soldAt,
    created_at: soldAt,
  }
}

describe('Sortierung Verkäufe', () => {
  const trades: Trade[] = [
    soldTrade('Bravo', 5000, 9000, '2026-09-10T10:00:00.000Z'), // Gewinn 3550
    soldTrade('alpha', 1000, 2000, '2026-09-12T10:00:00.000Z'), // Gewinn 900
    soldTrade('Charlie', 3000, 6000, '2026-09-11T10:00:00.000Z'), // Gewinn 2700
  ]

  it('jede Option hat eine passende Sortierfunktion (kein Absturz, gleiche Länge)', () => {
    for (const { value } of SOLD_SORT_OPTIONS) {
      expect(sortSold(trades, value)).toHaveLength(3)
    }
  })

  it('Gewinn hoch -> niedrig', () => {
    expect(sortSold(trades, 'profit_desc').map((t) => t.player_name)).toEqual(['Bravo', 'Charlie', 'alpha'])
  })
  it('Verkaufspreis niedrig -> hoch', () => {
    expect(sortSold(trades, 'price_asc').map((t) => t.sold_price)).toEqual([2000, 6000, 9000])
  })
  it('Neueste zuerst = Standard', () => {
    expect(sortSold(trades, 'sold_desc').map((t) => t.player_name)).toEqual(['alpha', 'Charlie', 'Bravo'])
  })
})

import { daysSince, fmtDaysOpen } from './format'

describe('Seit wann offen', () => {
  const now = new Date(2026, 8, 24, 15, 0) // 24.09.2026, 15 Uhr

  it('daysSince zählt Kalendertage, nicht 24h-Blöcke', () => {
    expect(daysSince(new Date(2026, 8, 24, 23, 0).toISOString(), now)).toBe(0) // heute, auch spät abends
    expect(daysSince(new Date(2026, 8, 23, 0, 1).toISOString(), now)).toBe(1) // gestern kurz nach Mitternacht
    expect(daysSince(new Date(2026, 8, 20, 12, 0).toISOString(), now)).toBe(4)
  })

  it('fmtDaysOpen formatiert lesbar', () => {
    expect(fmtDaysOpen(new Date(2026, 8, 24, 9, 0).toISOString(), now)).toBe('heute eingetragen')
    expect(fmtDaysOpen(new Date(2026, 8, 23, 9, 0).toISOString(), now)).toBe('seit 1 Tag offen')
    expect(fmtDaysOpen(new Date(2026, 8, 20, 9, 0).toISOString(), now)).toBe('seit 4 Tagen offen')
  })
})

import { buildAngeboteCsv } from './csv'

describe('CSV-Export der Angebote', () => {
  const versions = new Map([['v-gold', { id: 'v-gold', user_id: null, name: 'Gold', color: '#E5B93C' }]])
  const versionById = (id: string | null) => (id ? versions.get(id) : undefined)

  it('baut Kopfzeile und Datenzeilen mit Semikolon getrennt, inkl. BOM', () => {
    const trades: Trade[] = [
      {
        id: 't1', user_id: 'u', player_name: 'Jamal Musiala', card_version_id: 'v-gold', rating: 91,
        chemstyle: 'Hunter', buy_price: 10000, bid_price: 11000, buy_now_price: 12500,
        status: 'listed', sold_price: null, sold_type: null, sold_at: null, created_at: new Date().toISOString(),
      },
    ]
    const csv = buildAngeboteCsv(trades, versionById)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const lines = csv.slice(1).trim().split('\r\n')
    expect(lines[0]).toBe('Spieler;Version;Rating;Chemstyle;Einkauf;Angebotspreis')
    expect(lines[1]).toBe('Jamal Musiala;Gold;91;Hunter;10000;12500')
  })

  it('escaped Namen mit Semikolon korrekt', () => {
    const trades: Trade[] = [
      {
        id: 't2', user_id: 'u', player_name: 'Müller; Thomas', card_version_id: null, rating: null,
        chemstyle: 'Keiner', buy_price: 1000, bid_price: null, buy_now_price: null,
        status: 'listed', sold_price: null, sold_type: null, sold_at: null, created_at: new Date().toISOString(),
      },
    ]
    const csv = buildAngeboteCsv(trades, versionById)
    expect(csv).toContain('"Müller; Thomas"')
  })
})
