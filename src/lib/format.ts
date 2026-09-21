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
