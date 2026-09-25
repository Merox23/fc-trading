import { useMemo, useState } from 'react'
import { BottomSheet, ConfirmSheet } from '../components/BottomSheet'
import { TradeCard } from '../components/TradeCard'
import { Empty, FieldSelect, MoreButton, PageTitle, SearchField, SmallButton } from '../components/ui'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import { SOLD_SORT_OPTIONS, sortSold, type SoldSortKey } from '../lib/sort'
import type { Trade } from '../types'

export default function Verkaeufe() {
  const { trades, versions, undoSale } = useData()
  const run = useRun()
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SoldSortKey>('sold_desc')
  const [versionFilter, setVersionFilter] = useState('all')
  const [limit, setLimit] = useState(25)
  const [undo, setUndo] = useState<Trade | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const filterActive = q.trim() !== '' || versionFilter !== 'all' || sortKey !== 'sold_desc'

  const sold = useMemo(() => trades.filter((t) => t.status === 'sold' && t.sold_price != null), [trades])
  const availableVersions = useMemo(() => {
    const ids = new Set(sold.map((t) => t.card_version_id).filter((id): id is string => id !== null))
    return versions.filter((v) => ids.has(v.id))
  }, [sold, versions])
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = term ? sold.filter((t) => t.player_name.toLowerCase().includes(term)) : sold
    if (versionFilter !== 'all') list = list.filter((t) => t.card_version_id === versionFilter)
    return sortSold(list, sortKey)
  }, [sold, q, versionFilter, sortKey])

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageTitle sub={`${sold.length} verkaufte Spieler`}>Verkäufe</PageTitle>
        <div className="mt-1 shrink-0">
          <SmallButton active={filterActive} onClick={() => setFilterOpen(true)}>
            Filtern
          </SmallButton>
        </div>
      </div>

      <div className="grid gap-4">
        {shown.length === 0 ? (
          <Empty
            title={filterActive ? 'Kein Treffer' : 'Noch keine Verkäufe'}
            text={filterActive ? 'Prüfe Suche und Filter.' : 'Verkäufe trägst du unter "Eintragen" ein.'}
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

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filtern">
        <div className="grid gap-4">
          <SearchField value={q} onChange={(v) => { setQ(v); setLimit(25) }} />
          <FieldSelect
            label="Sortieren"
            value={sortKey}
            onChange={(v) => setSortKey(v as SoldSortKey)}
            options={SOLD_SORT_OPTIONS}
          />
          <FieldSelect
            label="Version"
            value={versionFilter}
            onChange={setVersionFilter}
            options={[{ value: 'all', label: 'Alle Versionen' }, ...availableVersions.map((v) => ({ value: v.id, label: v.name }))]}
          />
          {filterActive && (
            <button
              className="btn btn-quiet min-h-12"
              onClick={() => {
                setQ('')
                setSortKey('sold_desc')
                setVersionFilter('all')
              }}
            >
              Zurücksetzen
            </button>
          )}
        </div>
      </BottomSheet>

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
