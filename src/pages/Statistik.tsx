import { useMemo, useState, type ReactNode } from 'react'
import { PageTitle, Segmented, Tile } from '../components/ui'
import { useData } from '../hooks/useData'
import { fmt, fmtAvgDays, fmtDate, fmtSigned } from '../lib/format'
import {
  averages,
  lockedCoins,
  soldInRange,
  summarize,
  topByCount,
  topByPrice,
  topByProfit,
  type Range,
} from '../lib/stats'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-bold">{title}</h2>
      <div className="tile !py-1">{children}</div>
    </section>
  )
}

function Row({ rank, title, sub, value, tone }: { rank: number; title: string; sub?: string; value: string; tone?: string }) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <span className="w-5 text-center text-[15px] tabular-nums text-mute">{rank}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{title}</div>
        {sub && <div className="truncate text-[13px] text-mute">{sub}</div>}
      </div>
      <div className={`shrink-0 font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
    </li>
  )
}

const NONE = <p className="py-4 text-center text-[15px] text-mute">Keine Verkäufe in diesem Zeitraum.</p>

export default function Statistik() {
  const { trades, versionById } = useData()
  const [range, setRange] = useState<Range>('7d')

  const sold = useMemo(() => soldInRange(trades, range), [trades, range])
  const sum = useMemo(() => summarize(sold), [sold])
  const avg = useMemo(() => averages(sold), [sold])
  const openCount = useMemo(() => trades.filter((t) => t.status === 'listed').length, [trades])
  const byPrice = useMemo(() => topByPrice(sold), [sold])
  const byCount = useMemo(() => topByCount(sold), [sold])
  const byProfit = useMemo(() => topByProfit(sold), [sold])

  return (
    <>
      <PageTitle>Statistik</PageTitle>
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: 'today', label: 'Heute' },
          { value: '7d', label: '7 Tage' },
          { value: '30d', label: '30 Tage' },
          { value: 'all', label: 'Gesamt' },
        ]}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Gesamt-Erlös (netto)" value={fmt(sum.revenueNet)} />
        <Tile
          label="Gesamt-Gewinn"
          value={fmtSigned(sum.profit)}
          tone={sum.profit > 0 ? 'text-good' : sum.profit < 0 ? 'text-bad' : ''}
        />
        <Tile label="Gezahlte EA-Steuer" value={fmt(sum.tax)} />
        <Tile label="Verkaufte Spieler" value={fmt(sum.count)} />
        <Tile
          label="Ø Gewinn pro Verkauf"
          value={sum.count > 0 ? fmtSigned(avg.avgProfit) : '-'}
          tone={avg.avgProfit > 0 ? 'text-good' : avg.avgProfit < 0 ? 'text-bad' : ''}
        />
        <Tile label="Ø Haltezeit" value={sum.count > 0 ? fmtAvgDays(avg.avgHoldDays) : '-'} sub="Kauf bis Verkauf" />
        <Tile
          wide
          label="Aktuell gebundene Coins"
          value={fmt(lockedCoins(trades))}
          sub={`Einkaufspreise von ${openCount} offenen Angeboten`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-4">
      <Section title="Top Verkäufe nach Preis">
        {byPrice.length === 0 ? (
          NONE
        ) : (
          <ol>
            {byPrice.map((t, i) => (
              <Row
                key={t.id}
                rank={i + 1}
                title={t.player_name}
                sub={`${versionById(t.card_version_id)?.name ?? ''} ${t.sold_at ? fmtDate(t.sold_at) : ''}`.trim()}
                value={fmt(t.sold_price ?? 0)}
              />
            ))}
          </ol>
        )}
      </Section>

      <Section title="Top Verkäufe nach Menge">
        {byCount.length === 0 ? (
          NONE
        ) : (
          <ol>
            {byCount.map((p, i) => (
              <Row key={p.name} rank={i + 1} title={p.name} value={`${fmt(p.count)}x`} />
            ))}
          </ol>
        )}
      </Section>

      <Section title="Top nach Gewinn">
        {byProfit.length === 0 ? (
          NONE
        ) : (
          <ol>
            {byProfit.map((p, i) => (
              <Row
                key={p.name}
                rank={i + 1}
                title={p.name}
                sub={`${fmt(p.count)}x verkauft`}
                value={fmtSigned(p.profit)}
                tone={p.profit >= 0 ? 'text-good' : 'text-bad'}
              />
            ))}
          </ol>
        )}
      </Section>
      </div>
    </>
  )
}
