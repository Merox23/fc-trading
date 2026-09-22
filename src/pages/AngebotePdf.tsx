import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../hooks/useData'
import { fmt, fmtDate } from '../lib/format'

/** Schlichte, helle Druckansicht der offenen Angebote – für "Als PDF sichern" über den Drucken-Dialog */
export default function AngebotePdf() {
  const { trades, versionById } = useData()

  const listed = useMemo(
    () =>
      trades
        .filter((t) => t.status === 'listed')
        .sort((a, b) => a.player_name.localeCompare(b.player_name, 'de')),
    [trades],
  )
  const total = useMemo(() => listed.reduce((s, t) => s + (t.buy_now_price ?? 0), 0), [listed])

  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 300)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="mx-auto max-w-3xl bg-white px-6 py-8 text-[#111]">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to="/angebote" className="text-sm font-medium text-[#0b5fff] underline underline-offset-2">
          &#x2039; Zurück zur App
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white"
        >
          Drucken / Als PDF sichern
        </button>
      </div>

      <h1 className="text-2xl font-bold">FC Trading – Offene Angebote</h1>
      <p className="mt-1 text-sm text-[#555]">Stand: {fmtDate(new Date().toISOString())} &middot; {listed.length} Spieler</p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#111] text-left">
            <th className="py-2 pr-3">Spieler</th>
            <th className="py-2 pr-3">Version</th>
            <th className="py-2 pr-3 text-right">Rating</th>
            <th className="py-2 pr-3">Chemstyle</th>
            <th className="py-2 pr-3 text-right">Einkauf</th>
            <th className="py-2 text-right">Angebotspreis</th>
          </tr>
        </thead>
        <tbody>
          {listed.map((t) => {
            const v = versionById(t.card_version_id)
            return (
              <tr key={t.id} className="border-b border-[#ddd]">
                <td className="py-2 pr-3">{t.player_name}</td>
                <td className="py-2 pr-3">{v?.name ?? '-'}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{t.rating ?? '-'}</td>
                <td className="py-2 pr-3">{t.chemstyle}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{fmt(t.buy_price)}</td>
                <td className="py-2 text-right tabular-nums">{t.buy_now_price != null ? fmt(t.buy_now_price) : '-'}</td>
              </tr>
            )
          })}
          {listed.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-[#777]">
                Keine offenen Angebote.
              </td>
            </tr>
          )}
        </tbody>
        {listed.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-[#111] font-semibold">
              <td className="py-2 pr-3" colSpan={5}>
                Summe Angebotspreise
              </td>
              <td className="py-2 text-right tabular-nums">{fmt(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>

      <p className="mt-8 text-xs text-[#999]">Inoffizielles Fan-Tool, nicht mit EA verbunden.</p>
    </div>
  )
}
