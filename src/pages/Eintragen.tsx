import { useMemo, useState } from 'react'
import { SaleSheet } from '../components/SaleSheet'
import { TradeCard } from '../components/TradeCard'
import { TradeForm } from '../components/TradeForm'
import { Empty, MoreButton, PageTitle, SearchField, Segmented } from '../components/ui'
import { useData } from '../hooks/useData'
import { useRun } from '../hooks/useToast'
import type { Trade } from '../types'

type Tab = 'neu' | 'verkauf'

export default function Eintragen() {
  const [tab, setTab] = useState<Tab>('neu')
  return (
    <>
      <PageTitle>Eintragen</PageTitle>
      <div className="mb-5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'neu', label: 'Neuer Spieler' },
            { value: 'verkauf', label: 'Verkauf eintragen' },
          ]}
        />
      </div>
      {tab === 'neu' ? <NewPlayer /> : <SellList />}
    </>
  )
}

function NewPlayer() {
  const { addTrade } = useData()
  const run = useRun()
  return (
    <TradeForm
      submitLabel="Spieler speichern"
      clearOnSuccess
      stickySubmit
      onSubmit={(v) => run(() => addTrade(v), 'Gespeichert')}
    />
  )
}

function SellList() {
  const { trades } = useData()
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(25)
  const [selected, setSelected] = useState<Trade | null>(null)

  const listed = useMemo(() => {
    const term = q.trim().toLowerCase()
    return trades.filter((t) => t.status === 'listed' && (!term || t.player_name.toLowerCase().includes(term)))
  }, [trades, q])

  return (
    <div className="grid gap-3">
      <SearchField value={q} onChange={(v) => { setQ(v); setLimit(25) }} />
      {listed.length === 0 ? (
        <Empty
          title={q ? 'Kein Treffer' : 'Keine offenen Angebote'}
          text={q ? 'Prüfe die Schreibweise.' : 'Trage zuerst unter "Neuer Spieler" einen Spieler ein.'}
        />
      ) : (
        listed.slice(0, limit).map((t) => <TradeCard key={t.id} trade={t} onOpen={() => setSelected(t)} />)
      )}
      <MoreButton shown={Math.min(limit, listed.length)} total={listed.length} onMore={() => setLimit((l) => l + 25)} />
      <SaleSheet trade={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
