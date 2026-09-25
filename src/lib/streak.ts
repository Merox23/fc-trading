import type { Trade } from '../types'

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Anzahl aufeinanderfolgender Kalendertage mit mindestens einem Eintrag.
 * Wurde heute noch nichts eingetragen, bleibt die Serie erhalten (zählt bis gestern),
 * bricht aber ab, sobald ein ganzer Tag ohne Eintrag dazwischen liegt.
 */
export function currentStreak(trades: Trade[], now: Date = new Date()): number {
  if (trades.length === 0) return 0
  const days = new Set(trades.map((t) => dayKey(new Date(t.created_at))))
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(dayKey(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}
