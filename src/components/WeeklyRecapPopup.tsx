import { useEffect, useState } from 'react'
import { useData } from '../hooks/useData'
import { fmt, fmtDate, fmtSigned } from '../lib/format'
import { weekKey, weeklyRecap } from '../lib/weeklyRecap'
import { BottomSheet } from './BottomSheet'

const KEY = 'fc-weekly-recap-shown'

/** Popup mit dem Rückblick auf die letzte Woche, einmalig beim ersten Öffnen einer neuen Woche */
export function WeeklyRecapPopup() {
  const { trades, loading } = useData()
  const [open, setOpen] = useState(false)
  const recap = weeklyRecap(trades)

  useEffect(() => {
    if (loading) return
    const key = weekKey(new Date())
    let shown = ''
    try {
      shown = localStorage.getItem(KEY) ?? ''
    } catch {
      return
    }
    if (shown === key) return
    if (recap.count === 0) {
      // nichts zu zeigen, aber trotzdem merken, damit es bei neuen Verkäufen diese Woche nicht rückwirkend erscheint
      try {
        localStorage.setItem(KEY, key)
      } catch {
        /* egal */
      }
      return
    }
    setOpen(true)
    try {
      localStorage.setItem(KEY, key)
    } catch {
      /* egal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  if (!open) return null

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} title="Wochenrückblick">
      <p className="mb-4 text-[13px] text-mute">
        {fmtDate(recap.start.toISOString()).split(',')[0]} – {fmtDate(recap.end.toISOString()).split(',')[0]}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="tile">
          <div className="text-[13px] text-mute">Gewinn</div>
          <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${recap.totalProfit >= 0 ? 'text-good' : 'text-bad'}`}>
            {fmtSigned(recap.totalProfit)}
          </div>
        </div>
        <div className="tile">
          <div className="text-[13px] text-mute">Verkäufe</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{fmt(recap.count)}</div>
        </div>
      </div>
      {recap.best && (
        <div className="tile mt-3">
          <div className="text-[13px] text-mute">Bester Trade</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-display text-lg font-bold">{recap.best.name}</span>
            <span className="font-semibold tabular-nums text-good">{fmtSigned(recap.best.profit)}</span>
          </div>
        </div>
      )}
      <button className="btn btn-coin mt-5 min-h-12 w-full" onClick={() => setOpen(false)}>
        Weiter geht's
      </button>
    </BottomSheet>
  )
}
