const nf = new Intl.NumberFormat('de-DE')
const df = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** 12500 -> "12.500" */
export const fmt = (n: number): string => nf.format(n)

/** Mit Vorzeichen: +1.875 / −500 / 0 */
export const fmtSigned = (n: number): string =>
  n > 0 ? `+${nf.format(n)}` : n < 0 ? `\u2212${nf.format(-n)}` : '0'

export const fmtDate = (iso: string): string => df.format(new Date(iso))

/** Ganze Tage seit einem Zeitpunkt (lokale Kalendertage, nicht 24h-Blöcke) */
export function daysSince(iso: string, now: Date = new Date()): number {
  const then = new Date(iso)
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** "heute" / "seit 1 Tag" / "seit 4 Tagen" */
export function fmtDaysOpen(iso: string, now: Date = new Date()): string {
  const days = daysSince(iso, now)
  if (days <= 0) return 'heute eingetragen'
  if (days === 1) return 'seit 1 Tag offen'
  return `seit ${days} Tagen offen`
}
