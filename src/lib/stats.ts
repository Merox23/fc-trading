import type { Trade } from '../types'
import { netProceeds, profit, taxLoss } from './calc'

export type Range = 'today' | '7d' | '30d' | 'all'

/** Beginn des Zeitraums (lokale Zeit). "7 Tage" = heute + die 6 Tage davor. */
export function rangeStart(range: Range, now: Date = new Date()): Date | null {
  if (range === 'all') return null
  const back = range === 'today' ? 0 : range === '7d' ? 6 : 29
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - back)
}

export function soldInRange(trades: Trade[], range: Range, now: Date = new Date()): Trade[] {
  const start = rangeStart(range, now)
  return trades.filter(
    (t) =>
      t.status === 'sold' &&
      t.sold_price != null &&
      t.sold_at != null &&
      (start === null || new Date(t.sold_at) >= start),
  )
}

export function summarize(sold: Trade[]) {
  let revenueNet = 0
  let totalProfit = 0
  let tax = 0
  for (const t of sold) {
    const p = t.sold_price ?? 0
    revenueNet += netProceeds(p)
    totalProfit += profit(p, t.buy_price)
    tax += taxLoss(p)
  }
  return { revenueNet, profit: totalProfit, tax, count: sold.length }
}

/** Summe der Einkaufspreise aller offenen Angebote */
export function lockedCoins(trades: Trade[]): number {
  return trades.filter((t) => t.status === 'listed').reduce((s, t) => s + t.buy_price, 0)
}

export function topByPrice(sold: Trade[], n = 10): Trade[] {
  return [...sold].sort((a, b) => (b.sold_price ?? 0) - (a.sold_price ?? 0)).slice(0, n)
}

interface PlayerAgg {
  name: string
  count: number
  profit: number
}

function byPlayer(sold: Trade[]): PlayerAgg[] {
  // neueste Verkäufe zuerst, damit die zuletzt verwendete Schreibweise angezeigt wird
  const sorted = [...sold].sort((a, b) => (b.sold_at ?? '').localeCompare(a.sold_at ?? ''))
  const map = new Map<string, PlayerAgg>()
  for (const t of sorted) {
    const key = t.player_name.trim().toLowerCase()
    const agg = map.get(key) ?? { name: t.player_name.trim(), count: 0, profit: 0 }
    agg.count += 1
    agg.profit += profit(t.sold_price ?? 0, t.buy_price)
    map.set(key, agg)
  }
  return [...map.values()]
}

export function topByCount(sold: Trade[], n = 10): PlayerAgg[] {
  return byPlayer(sold)
    .sort((a, b) => b.count - a.count || b.profit - a.profit)
    .slice(0, n)
}

export function topByProfit(sold: Trade[], n = 10): PlayerAgg[] {
  return byPlayer(sold)
    .sort((a, b) => b.profit - a.profit || b.count - a.count)
    .slice(0, n)
}
