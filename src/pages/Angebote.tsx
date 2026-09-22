import { useMemo, useState } from 'react'
import { ConfirmSheet, BottomSheet } from '../components/BottomSheet'
import { SaleSheet } from '../components/SaleSheet'
import { TradeCard } from '../components/TradeCard'
import { TradeForm } from '../components/TradeForm'
import { Empty, MoreButton, PageTitle, SearchField } from '../components/ui'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import { fmt } from '../lib/format'
import { lockedCoins } from '../lib/stats'
import type { Trade } from '../types'

export default function Angebote() {
  const { trades, updateTrade, deleteTrade } = useData()
  const run = useRun()
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(25)
  const [sell, setSell] = useState<Trade | null>(null)
  const [edit, setEdit] = useState<Trade | null>(null)
  const [del, setDel] = useState<Trade | null>(null)

  const all = useMemo(() => trades.filter((t) => t.status === 'listed'), [trades])
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? all.filter((t) => t.player_name.toLowerCase().includes(term)) : all
  }, [all, q])

  return (
    <>
      <PageTitle sub={`${all.length} offen, ${fmt(lockedCoins(trades))} Coins gebunden`}>Angebote</PageTitle>
      <div className="grid gap-4">
        <SearchField value={q} onChange={(v) => { setQ(v); setLimit(25) }} />
        {shown.length === 0 ? (
          <Empty
            title={q ? 'Kein Treffer' : 'Keine offenen Angebote'}
            text={q ? 'Prüfe die Schreibweise.' : 'Neue Spieler trägst du unter "Eintragen" ein.'}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, limit).map((t) => (
              <TradeCard key={t.id} trade={t}>
                <div className="grid grid-cols-3 gap-2">
                  <button className="btn btn-coin px-2 text-[15px]" onClick={() => setSell(t)}>
                    Verkauft
                  </button>
                  <button className="btn btn-quiet px-2 text-[15px]" onClick={() => setEdit(t)}>
                    Bearbeiten
                  </button>
                  <button className="btn btn-quiet px-2 text-[15px] text-bad" onClick={() => setDel(t)}>
                    Löschen
                  </button>
                </div>
              </TradeCard>
            ))}
          </div>
        )}
        <MoreButton shown={Math.min(limit, shown.length)} total={shown.length} onMore={() => setLimit((l) => l + 25)} />
      </div>

      <SaleSheet trade={sell} onClose={() => setSell(null)} />

      <BottomSheet open={edit !== null} onClose={() => setEdit(null)} title="Angebot bearbeiten">
        {edit && (
          <TradeForm
            key={edit.id}
            initial={edit}
            submitLabel="Änderungen speichern"
            onSubmit={async (v) => {
              const ok = await run(() => updateTrade(edit.id, v), 'Gespeichert')
              if (ok) setEdit(null)
              return ok
            }}
          />
        )}
      </BottomSheet>

      <ConfirmSheet
        open={del !== null}
        title="Angebot löschen?"
        text={del ? `${del.player_name} wird endgültig entfernt.` : undefined}
        confirmLabel="Löschen"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          const ok = await run(() => deleteTrade(del.id), 'Gelöscht')
          if (ok) setDel(null)
        }}
      />
    </>
  )
}
