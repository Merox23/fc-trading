import { describe, expect, it } from 'vitest'
import { currentStreak } from './streak'
import type { Trade } from '../types'

function trade(id: string, createdAt: string): Trade {
  return {
    id, user_id: 'u', player_name: 'X', card_version_id: null, rating: 90, chemstyle: 'Keiner',
    buy_price: 100, bid_price: null, buy_now_price: null, status: 'listed',
    sold_price: null, sold_type: null, sold_at: null, created_at: createdAt,
  }
}

describe('currentStreak', () => {
  it('0 ohne Trades', () => {
    expect(currentStreak([])).toBe(0)
  })

  it('1, wenn nur heute ein Eintrag existiert', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    const trades = [trade('1', new Date(2026, 8, 24, 9, 0).toISOString())]
    expect(currentStreak(trades, now)).toBe(1)
  })

  it('zählt mehrere aufeinanderfolgende Tage inkl. heute', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    const trades = [
      trade('1', new Date(2026, 8, 22, 9, 0).toISOString()),
      trade('2', new Date(2026, 8, 23, 9, 0).toISOString()),
      trade('3', new Date(2026, 8, 24, 9, 0).toISOString()),
    ]
    expect(currentStreak(trades, now)).toBe(3)
  })

  it('bleibt erhalten, wenn heute noch nichts eingetragen wurde, aber gestern schon', () => {
    const now = new Date(2026, 8, 24, 8, 0) // früh morgens, noch nichts eingetragen
    const trades = [
      trade('1', new Date(2026, 8, 22, 9, 0).toISOString()),
      trade('2', new Date(2026, 8, 23, 9, 0).toISOString()),
    ]
    expect(currentStreak(trades, now)).toBe(2)
  })

  it('bricht ab, wenn ein ganzer Tag fehlt', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    const trades = [
      trade('1', new Date(2026, 8, 20, 9, 0).toISOString()), // Lücke am 21.-23.
      trade('2', new Date(2026, 8, 24, 9, 0).toISOString()),
    ]
    expect(currentStreak(trades, now)).toBe(1)
  })

  it('ignoriert mehrere Einträge am selben Tag (zählt den Tag nur einmal)', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    const trades = [
      trade('1', new Date(2026, 8, 24, 8, 0).toISOString()),
      trade('2', new Date(2026, 8, 24, 20, 0).toISOString()),
    ]
    expect(currentStreak(trades, now)).toBe(1)
  })

  it('0, wenn seit vorgestern nichts mehr eingetragen wurde (gestern fehlt)', () => {
    const now = new Date(2026, 8, 24, 15, 0)
    const trades = [trade('1', new Date(2026, 8, 22, 9, 0).toISOString())]
    expect(currentStreak(trades, now)).toBe(0)
  })
})
