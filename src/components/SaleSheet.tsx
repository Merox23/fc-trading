import { useEffect, useState } from 'react'
import { netProceeds, profit } from '../lib/calc'
import { fmt, fmtSigned } from '../lib/format'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import type { Trade } from '../types'
import { BottomSheet } from './BottomSheet'
import { PriceInput } from './PriceInput'
import { TradeForm } from './TradeForm'
import { PlayerAvatar, VersionChip } from './ui'

function Preview({ price, buyPrice }: { price: number | null; buyPrice: number }) {
  const ok = price !== null && price > 0
  const gain = ok ? profit(price, buyPrice) : 0
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl bg-raised p-3">
      <div>
        <div className="text-[13px] text-mute">Netto-Erlös</div>
        <div className="text-lg font-bold tabular-nums">{ok ? fmt(netProceeds(price)) : '-'}</div>
      </div>
      <div>
        <div className="text-[13px] text-mute">Gewinn</div>
        <div className={`text-lg font-bold tabular-nums ${!ok ? '' : gain >= 0 ? 'text-good' : 'text-bad'}`}>
          {ok ? fmtSigned(gain) : '-'}
        </div>
      </div>
    </div>
  )
}

type Step = 'sell' | 'rebuy-offer' | 'rebuy-form'

/** Verkaufs-Dialog: Sofortkauf mit einem Tipp oder Endpreis eines Gebots eintragen,
 *  danach optional direkt denselben Spieler neu einkaufen (Name/Version/Rating vorausgefüllt) */
export function SaleSheet({ trade, onClose }: { trade: Trade | null; onClose: () => void }) {
  const { sellTrade, addTrade, versionById } = useData()
  const run = useRun()
  const [bid, setBid] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step>('sell')

  useEffect(() => {
    setBid(trade?.bid_price ?? null)
    setStep('sell')
  }, [trade])

  if (!trade) return null
  const version = versionById(trade.card_version_id)

  async function sell(price: number, type: 'buy_now' | 'bid') {
    if (busy || !trade) return
    setBusy(true)
    const g = profit(price, trade.buy_price)
    const ok = await run(() => sellTrade(trade.id, price, type), `Verkauft, Gewinn ${fmtSigned(g)}`)
    setBusy(false)
    if (ok) setStep('rebuy-offer')
  }

  if (step === 'rebuy-form') {
    return (
      <BottomSheet open onClose={onClose} title={`${trade.player_name} neu einkaufen`}>
        <TradeForm
          submitLabel="Neu einkaufen"
          prefill={{ player_name: trade.player_name, card_version_id: trade.card_version_id, rating: trade.rating }}
          onSubmit={async (v) => {
            const ok = await run(() => addTrade(v), 'Neu eingekauft')
            if (ok) onClose()
            return ok
          }}
        />
      </BottomSheet>
    )
  }

  if (step === 'rebuy-offer') {
    return (
      <BottomSheet open onClose={onClose} title="Verkauft!">
        <div className="mb-5 flex items-center gap-3">
          <PlayerAvatar name={trade.player_name} color={version?.color} size={36} />
          <div>
            <div className="font-display text-lg font-bold">{trade.player_name}</div>
            {version && <VersionChip version={version} />}
          </div>
        </div>
        <p className="mb-5 text-[15px] leading-relaxed text-mute">
          Direkt neu einkaufen? Name, Version und Rating übernehme ich, Preise und Chemstyle trägst du neu ein.
        </p>
        <div className="grid gap-3">
          <button className="btn btn-coin min-h-14 text-lg" onClick={() => setStep('rebuy-form')}>
            Ja, neu einkaufen
          </button>
          <button className="btn btn-quiet min-h-14 text-lg" onClick={onClose}>
            Nein, fertig
          </button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open onClose={onClose} title={trade.player_name}>
      <div className="mb-4 flex items-center gap-3">
        <PlayerAvatar name={trade.player_name} color={version?.color} size={36} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-mute">
          {trade.rating != null && <span className="font-bold text-ink">{trade.rating}</span>}
          {version && <VersionChip version={version} />}
          <span>Einkauf {fmt(trade.buy_price)}</span>
        </div>
      </div>

      {trade.buy_now_price != null && (
        <div className="grid gap-2">
          <button
            className="btn btn-coin min-h-[4.5rem] w-full text-xl"
            disabled={busy}
            onClick={() => void sell(trade.buy_now_price!, 'buy_now')}
          >
            Sofortkauf ({fmt(trade.buy_now_price)})
          </button>
          <Preview price={trade.buy_now_price} buyPrice={trade.buy_price} />
        </div>
      )}

      <p className="my-4 text-center text-[15px] text-mute">oder als Gebot verkauft</p>

      <div className="grid gap-3">
        <PriceInput label="Endpreis Gebot" value={bid} onChange={setBid} />
        <Preview price={bid} buyPrice={trade.buy_price} />
        <button
          className="btn btn-quiet min-h-14 w-full text-lg"
          disabled={busy || bid === null || bid <= 0}
          onClick={() => bid && void sell(bid, 'bid')}
        >
          Bestätigen
        </button>
      </div>
    </BottomSheet>
  )
}
