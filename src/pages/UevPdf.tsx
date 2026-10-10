import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useUev } from '../hooks/useUev'
import { fmtDate } from '../lib/format'
import { loadUevSort, sortUevRows, uevStatus } from '../lib/uev'

/** Schlichte, helle Druckansicht der ÜV-Liste – für "Als PDF sichern" über den Drucken-Dialog */
export default function UevPdf() {
  const { session } = useAuth()
  const uev = useUev(session!.user.id)
  const { trades, versionById } = useData()

  const rows = useMemo(
    () =>
      sortUevRows(uevStatus(uev.list, trades, versionById), loadUevSort(), versionById),
    [uev.list, trades, versionById],
  )
  const bought = rows.filter((r) => r.match).length

  // Drucken erst, wenn die Liste geladen ist
  useEffect(() => {
    if (uev.loading) return
    const t = window.setTimeout(() => window.print(), 300)
    return () => window.clearTimeout(t)
  }, [uev.loading])

  return (
    <div className="mx-auto max-w-3xl bg-white px-6 py-8 text-[#111]">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to="/mehr/uev" className="text-sm font-medium text-[#0b5fff] underline underline-offset-2">
          &#x2039; Zurück zur App
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white"
        >
          Drucken / Als PDF sichern
        </button>
      </div>

      <h1 className="text-2xl font-bold">FC Trading – ÜV-Liste</h1>
      <p className="mt-1 text-sm text-[#555]">
        Stand: {fmtDate(new Date().toISOString())} &middot; {rows.length} Spieler &middot; {bought} gekauft
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#111] text-left">
            <th className="py-2 pr-3">Spieler</th>
            <th className="py-2 pr-3 text-right">Rating</th>
            <th className="py-2 pr-3">Verein</th>
            <th className="py-2 pr-3">Version</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ u, match }) => (
            <tr key={u.id} className="border-b border-[#ddd]">
              <td className="py-2 pr-3">{u.player_name}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{u.rating ?? '-'}</td>
              <td className="py-2 pr-3">{u.club || '-'}</td>
              <td className="py-2 pr-3">{versionById(u.card_version_id)?.name ?? '-'}</td>
              <td className={`py-2 font-semibold ${match ? 'text-[#15803d]' : ''}`}>{match ? '✓ Gekauft' : 'Noch kaufen'}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-[#777]">
                {uev.loading ? 'Lädt …' : 'Die ÜV-Liste ist leer.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-8 text-xs text-[#999]">Inoffizielles Fan-Tool, nicht mit EA verbunden.</p>
    </div>
  )
}
