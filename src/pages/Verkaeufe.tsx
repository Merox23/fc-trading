import { useMemo, useState } from 'react'
import { ConfirmSheet } from '../components/BottomSheet'
import { TradeCard } from '../components/TradeCard'
import { Empty, MoreButton, PageTitle, SearchField } from '../components/ui'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import type { Trade } from '../types'

export default function Verkaeufe() {
  const { trades, undoSale } = useData()
  const run = useRun()
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(25)
  const [undo, setUndo] = useState<Trade | null>(null)

  const sold = useMemo(
    () =>
      trades
        .filter((t) => t.status === 'sold' && t.sold_price != null)
        .sort((a, b) => (b.sold_at ?? '').localeCompare(a.sold_at ?? '')),
    [trades],
  )
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? sold.filter((t) => t.player_name.toLowerCase().includes(term)) : sold
  }, [sold, q])

  return (
    <>
      <PageTitle sub={`${sold.length} verkaufte Spieler`}>Verkäufe</PageTitle>
      <div className="grid gap-4">
        <SearchField value={q} onChange={(v) => { setQ(v); setLimit(25) }} />
        {shown.length === 0 ? (
          <Empty
            title={q ? 'Kein Treffer' : 'Noch keine Verkäufe'}
            text={q ? 'Prüfe die Schreibweise.' : 'Verkäufe trägst du unter "Eintragen" ein.'}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, limit).map((t) => (
              <TradeCard key={t.id} trade={t}>
                <button className="btn btn-quiet w-full text-[15px]" onClick={() => setUndo(t)}>
                  Verkauf rückgängig machen
                </button>
              </TradeCard>
            ))}
          </div>
        )}
        <MoreButton shown={Math.min(limit, shown.length)} total={shown.length} onMore={() => setLimit((l) => l + 25)} />
      </div>

      <ConfirmSheet
        open={undo !== null}
        title="Verkauf rückgängig machen?"
        text={undo ? `${undo.player_name} wandert zurück zu den Angeboten.` : undefined}
        confirmLabel="Rückgängig machen"
        onClose={() => setUndo(null)}
        onConfirm={async () => {
          if (!undo) return
          const ok = await run(() => undoSale(undo.id), 'Zurück bei den Angeboten')
          if (ok) setUndo(null)
        }}
      />
    </>
  )
}
