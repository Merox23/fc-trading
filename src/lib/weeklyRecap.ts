import type { Trade } from '../types'
import { profit } from './calc'

function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Montag der Woche, in der `d` liegt (lokale Zeit) */
export function mondayOfWeek(d: Date): Date {
  const date = atMidnight(d)
  const day = date.getDay() // 0 = Sonntag
  const diff = (day === 0 ? -6 : 1) - day
  date.setDate(date.getDate() + diff)
  return date
}

/** Eindeutiger Schlüssel für eine Woche, z. B. "2026-09-21" (der Montag dieser Woche) */
export function weekKey(d: Date): string {
  const m = mondayOfWeek(d)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`
}

export interface WeeklyRecap {
  start: Date
  end: Date
  count: number
  totalProfit: number
  best: { name: string; profit: number } | null
}

/** Rückblick auf die zuletzt abgeschlossene Kalenderwoche (Montag bis Sonntag vor der aktuellen Woche) */
export function weeklyRecap(trades: Trade[], now: Date = new Date()): WeeklyRecap {
  const thisMonday = mondayOfWeek(now)
  const start = new Date(thisMonday)
  start.setDate(start.getDate() - 7)
  const end = new Date(thisMonday)
  end.setDate(end.getDate() - 1)
  const endInclusive = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)

  const sold = trades.filter((t) => {
    if (t.status !== 'sold' || !t.sold_at) return false
    const d = new Date(t.sold_at)
    return d >= start && d <= endInclusive
  })

  let totalProfit = 0
  let best: { name: string; profit: number } | null = null
  for (const t of sold) {
    const p = profit(t.sold_price ?? 0, t.buy_price)
    totalProfit += p
    if (!best || p > best.profit) best = { name: t.player_name, profit: p }
  }

  return { start, end, count: sold.length, totalProfit, best }
}
