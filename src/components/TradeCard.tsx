import type { ReactNode } from 'react'
import { netProceeds, profit } from '../lib/calc'
import { daysSince, fmt, fmtDate, fmtDaysOpen, fmtSigned } from '../lib/format'
import { useData } from '../hooks/useData'
import type { Trade } from '../types'
import { PlayerAvatar, VersionChip } from './ui'

function Amount({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] text-mute">{label}</div>
      <div className={`truncate text-[17px] font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
    </div>
  )
}

/** Karte für einen Spieler: offen (listed) oder verkauft (sold) */
export function TradeCard({ trade, onOpen, children }: { trade: Trade; onOpen?: () => void; children?: ReactNode }) {
  const { versionById } = useData()
  const version = versionById(trade.card_version_id)
  const isSold = trade.status === 'sold' && trade.sold_price != null
  const gain = isSold ? profit(trade.sold_price!, trade.buy_price) : 0

  const head = (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar name={trade.player_name} color={version?.color} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold">{trade.player_name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-mute">
            {trade.rating != null && (
              <span className="rounded-md bg-raised px-1.5 py-0.5 text-[14px] font-bold tabular-nums text-ink">
                {trade.rating}
              </span>
            )}
            {version && <VersionChip version={version} />}
            <span>{trade.chemstyle}</span>
          </div>
        </div>
      </div>
      {isSold && (
        <div className="shrink-0 text-right">
          <div className="text-[13px] text-mute">Gewinn</div>
          <div className={`font-display text-xl font-bold tabular-nums ${gain >= 0 ? 'text-good' : 'text-bad'}`}>
            {fmtSigned(gain)}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <article className="rounded-2xl border border-line bg-card">
      <div className="p-4">
        {onOpen ? (
          <button type="button" onClick={onOpen} className="block w-full text-left">
            {head}
          </button>
        ) : (
          head
        )}

        <div className="mt-3 grid grid-cols-3 gap-3">
          {isSold ? (
            <>
              <Amount label="Verkauft für" value={fmt(trade.sold_price!)} />
              <Amount label="Netto" value={fmt(netProceeds(trade.sold_price!))} />
              <Amount label="Einkauf" value={fmt(trade.buy_price)} />
            </>
          ) : (
            <>
              <Amount label="Einkauf" value={fmt(trade.buy_price)} />
              <Amount label="Gebot" value={trade.bid_price != null ? fmt(trade.bid_price) : '-'} />
              <Amount label="Sofortkauf" value={trade.buy_now_price != null ? fmt(trade.buy_now_price) : '-'} />
            </>
          )}
        </div>

        {isSold && trade.sold_at && (
          <p className="mt-2 text-[13px] text-mute">
            {trade.sold_type === 'buy_now' ? 'Sofortkauf' : 'Gebot'}, {fmtDate(trade.sold_at)}
          </p>
        )}
        {!isSold && (
          <p className={`mt-2 text-[13px] ${daysSince(trade.created_at) >= 3 ? 'font-medium text-coin' : 'text-mute'}`}>
            {fmtDaysOpen(trade.created_at)}
          </p>
        )}
      </div>
      {children && <div className="border-t border-line p-2">{children}</div>}
    </article>
  )
}
