import { useMemo } from 'react'
import { fmt, fmtDate } from '../lib/format'
import type { PriceHistoryPoint } from '../lib/priceHistory'

const W = 320
const H = 140
const PAD_X = 12
const PAD_Y = 24

/** Selbst gezeichnetes Liniendiagramm der bisherigen Einkaufspreise, ohne zusätzliche Chart-Bibliothek */
export function PriceHistoryChart({ points }: { points: PriceHistoryPoint[] }) {
  const { path, dots, min, max } = useMemo(() => {
    const prices = points.map((p) => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const stepX = points.length > 1 ? (W - PAD_X * 2) / (points.length - 1) : 0
    const dots = points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: H - PAD_Y - ((p.price - min) / range) * (H - PAD_Y * 2),
      ...p,
    }))
    const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x.toFixed(1)} ${d.y.toFixed(1)}`).join(' ')
    return { path, dots, min, max }
  }, [points])

  if (points.length < 2) {
    return (
      <p className="py-4 text-center text-[14px] text-mute">
        Nur ein bisheriger Kauf ({fmt(points[0]?.price ?? 0)}), noch kein Verlauf darstellbar.
      </p>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Verlauf der Einkaufspreise">
      <text x={PAD_X} y={14} className="fill-mute" fontSize="11">
        {fmt(max)}
      </text>
      <text x={PAD_X} y={H - 6} className="fill-mute" fontSize="11">
        {fmt(min)}
      </text>
      <path d={path} fill="none" stroke="var(--color-coin)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {dots.map((d) => (
        <circle key={d.date} cx={d.x} cy={d.y} r="4" fill="var(--color-coin)" />
      ))}
    </svg>
  )
}

/** Werte-Liste unter dem Diagramm, älteste zuerst */
export function PriceHistoryList({ points }: { points: PriceHistoryPoint[] }) {
  return (
    <ul className="mt-3 grid gap-1.5">
      {points.map((p) => (
        <li key={p.date} className="flex items-center justify-between text-[14px]">
          <span className="text-mute">{fmtDate(p.date)}</span>
          <span className="font-semibold tabular-nums">{fmt(p.price)}</span>
        </li>
      ))}
    </ul>
  )
}
