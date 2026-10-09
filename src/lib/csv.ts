import type { CardVersion, Trade, UevPlayer } from '../types'

/** Ein Feld für eine CSV-Zeile sicher escapen (Semikolon, Anführungszeichen, Zeilenumbrüche) */
function csvField(value: string | number): string {
  const s = String(value)
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(';')
}

/** CSV der offenen Angebote, mit BOM für korrekte Umlaute in Excel */
export function buildAngeboteCsv(trades: Trade[], versionById: (id: string | null) => CardVersion | undefined): string {
  const header = csvRow(['Spieler', 'Version', 'Rating', 'Chemstyle', 'Einkauf', 'Angebotspreis'])
  const rows = trades.map((t) =>
    csvRow([
      t.player_name,
      versionById(t.card_version_id)?.name ?? '',
      t.rating ?? '',
      t.chemstyle,
      t.buy_price,
      t.buy_now_price ?? '',
    ]),
  )
  return '\uFEFF' + [header, ...rows].join('\r\n') + '\r\n'
}

/** Löst im Browser den Download einer Textdatei aus */
export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** CSV der ÜV-Liste mit Status (gekauft = steht als offenes Angebot drin) */
export function buildUevCsv(
  rows: { u: UevPlayer; match?: Trade }[],
  versionById: (id: string | null) => CardVersion | undefined,
): string {
  const header = csvRow(['Spieler', 'Rating', 'Verein', 'Version', 'Status'])
  const lines = rows.map(({ u, match }) =>
    csvRow([u.player_name, u.rating ?? '', u.club, versionById(u.card_version_id)?.name ?? '', match ? 'Gekauft' : 'Noch kaufen']),
  )
  return '﻿' + [header, ...lines].join('\r\n') + '\r\n'
}

/** ÜV-Liste als einfacher Text zum Teilen (z. B. in Discord oder Notizen) */
export function buildUevText(
  rows: { u: UevPlayer; match?: Trade }[],
  versionById: (id: string | null) => CardVersion | undefined,
): string {
  return rows
    .map(({ u, match }) => {
      const details = [u.rating, versionById(u.card_version_id)?.name, u.club].filter(Boolean).join(' · ')
      return `${match ? '✓' : '○'} ${u.player_name}${details ? ` (${details})` : ''}`
    })
    .join('\n')
}
