import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmSheet, BottomSheet } from '../components/BottomSheet'
import { RebuySheet } from '../components/RebuySheet'
import { SaleSheet } from '../components/SaleSheet'
import { TradeCard } from '../components/TradeCard'
import { TradeForm } from '../components/TradeForm'
import { Empty, FieldSelect, MoreButton, PageTitle, SearchField, Tile } from '../components/ui'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import { fmt, fmtSigned } from '../lib/format'
import { buildAngeboteCsv, downloadTextFile } from '../lib/csv'
import { LISTED_SORT_OPTIONS, sortListed, type ListedSortKey } from '../lib/sort'
import { lockedCoins, potentialIfAllSold } from '../lib/stats'
import type { Trade } from '../types'

export default function Angebote() {
  const { trades, versions, versionById, updateTrade, deleteTrade } = useData()
  const run = useRun()
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<ListedSortKey>('created_desc')
  const [versionFilter, setVersionFilter] = useState('all')
  const [limit, setLimit] = useState(25)
  const [sell, setSell] = useState<Trade | null>(null)
  const [edit, setEdit] = useState<Trade | null>(null)
  const [del, setDel] = useState<Trade | null>(null)
  const [rebuy, setRebuy] = useState<Trade | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const all = useMemo(() => trades.filter((t) => t.status === 'listed'), [trades])
  const availableVersions = useMemo(() => {
    const ids = new Set(all.map((t) => t.card_version_id).filter((id): id is string => id !== null))
    return versions.filter((v) => ids.has(v.id))
  }, [all, versions])
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = term ? all.filter((t) => t.player_name.toLowerCase().includes(term)) : all
    if (versionFilter !== 'all') list = list.filter((t) => t.card_version_id === versionFilter)
    return sortListed(list, sortKey)
  }, [all, q, versionFilter, sortKey])
  const potential = useMemo(() => potentialIfAllSold(trades), [trades])

  return (
    <>
      <PageTitle sub={`${all.length} offen`}>Angebote</PageTitle>
      {all.length > 0 && (
        <div className="-mt-2 mb-4 flex justify-end">
          <button
            className="min-h-9 rounded-lg px-3 text-[13px] font-medium text-mute active:bg-raised"
            onClick={() => setExportOpen(true)}
          >
            Exportieren &#x2193;
          </button>
        </div>
      )}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile label="Gebundene Coins" value={fmt(lockedCoins(trades))} />
        <Tile
          label="Erlös bei Sofortkauf (netto)"
          value={fmt(potential.revenueNet)}
          sub="wenn alles verkauft wird"
        />
        <Tile
          label="Gewinn bei Sofortkauf"
          value={fmtSigned(potential.profit)}
          tone={potential.profit >= 0 ? 'text-good' : 'text-bad'}
          sub="wenn alles zum Sofortkaufpreis verkauft wird"
        />
      </div>
      <div className="grid gap-4">
        <SearchField value={q} onChange={(v) => { setQ(v); setLimit(25) }} />
        <div className="grid grid-cols-2 gap-3">
          <FieldSelect
            label="Sortieren"
            value={sortKey}
            onChange={(v) => setSortKey(v as ListedSortKey)}
            options={LISTED_SORT_OPTIONS}
          />
          <FieldSelect
            label="Version"
            value={versionFilter}
            onChange={setVersionFilter}
            options={[{ value: 'all', label: 'Alle Versionen' }, ...availableVersions.map((v) => ({ value: v.id, label: v.name }))]}
          />
        </div>
        {shown.length === 0 ? (
          <Empty
            title={q || versionFilter !== 'all' ? 'Kein Treffer' : 'Keine offenen Angebote'}
            text={
              q || versionFilter !== 'all'
                ? 'Prüfe Suche und Filter.'
                : 'Neue Spieler trägst du unter "Eintragen" ein.'
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, limit).map((t) => (
              <TradeCard key={t.id} trade={t}>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn btn-coin px-2 text-[15px]" onClick={() => setSell(t)}>
                    Verkauft
                  </button>
                  <button className="btn btn-quiet px-2 text-[15px]" onClick={() => setRebuy(t)}>
                    Nochmal einkaufen
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

      <BottomSheet open={exportOpen} onClose={() => setExportOpen(false)} title="Exportieren">
        <div className="grid gap-3">
          <button
            className="btn btn-coin min-h-14"
            onClick={() => {
              const date = new Date().toISOString().slice(0, 10)
              downloadTextFile(`fc-trading-angebote-${date}.csv`, buildAngeboteCsv(all, versionById))
              setExportOpen(false)
            }}
          >
            Als CSV
          </button>
          <Link to="/angebote/pdf" className="btn btn-quiet min-h-14" onClick={() => setExportOpen(false)}>
            Als PDF
          </Link>
        </div>
      </BottomSheet>
      <RebuySheet trade={rebuy} onClose={() => setRebuy(null)} />

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
