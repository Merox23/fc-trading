import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BottomSheet, ConfirmSheet } from '../components/BottomSheet'
import { PageTitle, VersionChip } from '../components/ui'
import { PALETTE } from '../constants'
import { useData } from '../hooks/useData'
import { useRun, useToast } from '../hooks/useToast'
import type { CardVersion } from '../types'

export default function Kartenversionen() {
  const { versions, trades, addVersion, updateVersion, deleteVersion } = useData()
  const run = useRun()
  const toast = useToast()
  const [editing, setEditing] = useState<CardVersion | 'new' | null>(null)
  const [del, setDel] = useState<CardVersion | null>(null)

  const defaults = versions.filter((v) => v.user_id === null)
  const custom = versions.filter((v) => v.user_id !== null)

  function askDelete(v: CardVersion) {
    const used = trades.filter((t) => t.card_version_id === v.id).length
    if (used > 0) {
      toast(`"${v.name}" wird noch bei ${used} Spielern verwendet.`, 'error')
      return
    }
    setDel(v)
  }

  return (
    <>
      <Link to="/mehr" className="mb-2 inline-flex min-h-12 items-center text-[15px] text-mute">
        &#x2039; Zurück
      </Link>
      <PageTitle sub="Standardversionen gelten für alle. Eigene kannst du ändern und löschen.">Kartenversionen</PageTitle>

      <div className="md:max-w-2xl">
      <button className="btn btn-coin mb-5 min-h-14 w-full text-lg" onClick={() => setEditing('new')}>
        Neue Version
      </button>

      <h2 className="mb-2 font-display text-lg font-bold">Eigene Versionen</h2>
      {custom.length === 0 ? (
        <p className="mb-6 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[15px] text-mute">
          Noch keine eigenen Versionen. Lege z. B. eine Karte für ein Promo-Event an.
        </p>
      ) : (
        <ul className="mb-6 grid gap-2">
          {custom.map((v) => (
            <li key={v.id} className="tile flex items-center justify-between gap-2 !p-2 !pl-4">
              <VersionChip version={v} />
              <div className="flex gap-2">
                <button className="btn btn-quiet px-4 text-[15px]" onClick={() => setEditing(v)}>
                  Ändern
                </button>
                <button className="btn btn-quiet px-4 text-[15px] text-bad" onClick={() => askDelete(v)}>
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 font-display text-lg font-bold">Standardversionen</h2>
      <ul className="grid gap-2">
        {defaults.map((v) => (
          <li key={v.id} className="tile flex min-h-12 items-center justify-between !py-3">
            <VersionChip version={v} />
            <span className="text-[13px] text-mute">fest</span>
          </li>
        ))}
      </ul>
      </div>

      <BottomSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Neue Version' : 'Version ändern'}
      >
        {editing && (
          <VersionForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            onSubmit={async (name, color) => {
              const ok = await run(
                () => (editing === 'new' ? addVersion(name, color) : updateVersion(editing.id, name, color)),
                'Gespeichert',
              )
              if (ok) setEditing(null)
            }}
          />
        )}
      </BottomSheet>

      <ConfirmSheet
        open={del !== null}
        title="Version löschen?"
        text={del ? `"${del.name}" wird aus dem Auswahlmenü entfernt.` : undefined}
        confirmLabel="Löschen"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          const ok = await run(() => deleteVersion(del.id), 'Gelöscht')
          if (ok) setDel(null)
        }}
      />
    </>
  )
}

function VersionForm({
  initial,
  onSubmit,
}: {
  initial?: CardVersion
  onSubmit: (name: string, color: string) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color.toLowerCase() ?? PALETTE[3].toLowerCase())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return setError('Bitte einen Namen eingeben.')
    setError('')
    setBusy(true)
    await onSubmit(n, color.toUpperCase())
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div>
        <label htmlFor="v-name" className="label">
          Name
        </label>
        <input
          id="v-name"
          className="field"
          maxLength={40}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Future Stars"
        />
      </div>
      <div>
        <span className="label">Farbe</span>
        <div className="grid grid-cols-6 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Farbe ${c}`}
              aria-pressed={color.toLowerCase() === c.toLowerCase()}
              onClick={() => setColor(c.toLowerCase())}
              className={`h-12 rounded-xl ring-1 ring-white/25 ${
                color.toLowerCase() === c.toLowerCase() ? 'outline outline-2 outline-offset-2 outline-coin' : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="mt-3 flex min-h-12 items-center justify-between rounded-xl border border-line bg-raised px-4">
          <span className="text-[15px]">Eigene Farbe wählen</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
          />
        </label>
      </div>
      <div className="flex min-h-12 items-center rounded-xl bg-raised px-4">
        <VersionChip version={{ name: name.trim() || 'Vorschau', color }} />
      </div>
      {error && (
        <p role="alert" className="text-[15px] font-medium text-bad">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-coin min-h-14 text-lg" disabled={busy}>
        {busy ? 'Speichert …' : 'Speichern'}
      </button>
    </form>
  )
}
