import type { Trade } from '../types'

export interface PriceHistoryPoint {
  price: number
  date: string
}

/** Bisherige Einkaufspreise für einen Spielernamen (chronologisch, älteste zuerst), ohne den aktuell bearbeiteten Eintrag */
export function buyPriceHistory(trades: Trade[], playerName: string, excludeId?: string, limit = 10): PriceHistoryPoint[] {
  const term = playerName.trim().toLowerCase()
  if (!term) return []
  return trades
    .filter((t) => t.id !== excludeId && t.player_name.trim().toLowerCase() === term)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .reverse()
    .map((t) => ({ price: t.buy_price, date: t.created_at }))
}
