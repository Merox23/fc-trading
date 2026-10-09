import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BottomSheet, ConfirmSheet } from '../components/BottomSheet'
import { TradeForm } from '../components/TradeForm'
import { VersionSelect } from '../components/VersionSelect'
import { Empty, PageTitle, PlayerAvatar, Segmented, SmallButton, VersionChip } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import { useRun, useToast } from '../hooks/useToast'
import { useUev } from '../hooks/useUev'
import { errMsg } from '../lib/errors'
import { recognizeImages } from '../lib/ocr'
import { bookmarkletCode, readPayloadFromHash } from '../lib/bookmarklet'
import { buildUevCsv, buildUevText, downloadTextFile } from '../lib/csv'
import { correctName, fromFutbin, isSameUev, parseUevText, uevStatus, type FutbinDraft } from '../lib/uev'
import type { UevInput, UevPlayer } from '../types'

type Filter = 'alle' | 'offen' | 'gekauft'

// Gemerkte Versionen je Futbin-Karten-Fingerabdruck (nur in diesem Browser, reicht für den Import)
const LEARNED_KEY = 'fc-uev-versions'

function loadLearned(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LEARNED_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function learnVersion(futbinKey: string, versionId: string | null) {
  try {
    const map = loadLearned()
    if (versionId) map[futbinKey] = versionId
    else delete map[futbinKey]
    localStorage.setItem(LEARNED_KEY, JSON.stringify(map))
  } catch {
    /* ohne Speicher wird nur nichts gemerkt */
  }
}

export default function Uev() {
  const { session } = useAuth()
  const uev = useUev(session!.user.id)
  const { trades, versions, versionById, addTrade } = useData()
  const run = useRun()
  const [filter, setFilter] = useState<Filter>('alle')
  const [importOpen, setImportOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<UevPlayer | null>(null)
  const [buying, setBuying] = useState<UevPlayer | null>(null)
  const [clearing, setClearing] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  // Vom Futbin-Lesezeichen mitgeschickte Spieler (#uev=… im Link)
  const [incoming, setIncoming] = useState<FutbinDraft[] | null>(null)

  useEffect(() => {
    const payload = readPayloadFromHash(window.location.hash)
    if (!payload) return
    history.replaceState(null, '', window.location.pathname)
    const items = payload.players.length > 0 ? fromFutbin(payload.players, versions, loadLearned()) : parseUevText(payload.text ?? '', versions)
    setIncoming(items)
    setImportOpen(true)
    // nur einmal beim Öffnen über das Lesezeichen
  }, [])

  // Abgleich läuft live: kaufst oder verkaufst du einen Spieler, ändert sich die Markierung sofort
  const rows = useMemo(() => uevStatus(uev.list, trades, versionById), [uev.list, trades, versionById])
  const bought = rows.filter((r) => r.match).length
  const shown = rows.filter((r) => filter === 'alle' || (filter === 'gekauft') === !!r.match)

  if (uev.loading) return <p className="py-20 text-center text-mute">Lädt …</p>

  return (
    <>
      <PageTitle sub="Spieler, die du einkaufen und überteuert anbieten willst">ÜV-Liste</PageTitle>

      {uev.error != null && (
        <div className="tile mb-4 border-bad/50 text-[15px]">
          <p className="font-semibold text-bad">ÜV-Liste konnte nicht geladen werden</p>
          <p className="mt-1 text-mute">{errMsg(uev.error)}</p>
          <p className="mt-1 text-mute">
            Falls die Tabelle fehlt: <code>supabase/002_uev.sql</code> im Supabase SQL Editor ausführen.
          </p>
          <button className="btn btn-quiet mt-3" onClick={() => void uev.refresh()}>
            Erneut versuchen
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:max-w-md">
        <button className="btn btn-coin" onClick={() => setImportOpen(true)}>
          Liste importieren
        </button>
        <button className="btn btn-quiet" onClick={() => setAdding(true)}>
          Spieler hinzufügen
        </button>
        <button className="btn btn-quiet col-span-2" onClick={() => setSetupOpen(true)}>
          Futbin-Button einrichten
        </button>
      </div>

      {rows.length === 0 ? (
        <Empty
          title="Noch keine Spieler"
          text="Importiere einen Screenshot deiner Futbin-Liste oder füge Spieler von Hand hinzu."
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[15px] text-mute">
              <span className="font-semibold text-good">{bought}</span> von {rows.length} bereits gekauft
            </p>
            <div className="flex shrink-0">
              <SmallButton onClick={() => setExportOpen(true)}>Exportieren</SmallButton>
              <SmallButton onClick={() => setClearing(true)}>Liste leeren</SmallButton>
            </div>
          </div>
          <div className="mb-4">
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'alle', label: 'Alle' },
                { value: 'offen', label: 'Noch kaufen' },
                { value: 'gekauft', label: 'Gekauft' },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <Empty title={filter === 'gekauft' ? 'Noch nichts gekauft' : 'Alles gekauft'} />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {shown.map(({ u, match, near }) => {
                const version = versionById(u.card_version_id)
                const nearVersion = near && versionById(near.card_version_id)
                return (
                  <li key={u.id} className={`tile flex items-center gap-3 ${match ? 'border-good/40' : ''}`}>
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => setEditing(u)}
                      aria-label={`${u.player_name} bearbeiten`}
                    >
                      <PlayerAvatar name={u.player_name} color={version?.color} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-lg font-bold">{u.player_name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-mute">
                          {u.rating != null && (
                            <span className="rounded-md bg-raised px-1.5 py-0.5 text-[14px] font-bold tabular-nums text-ink">
                              {u.rating}
                            </span>
                          )}
                          {version && <VersionChip version={version} />}
                          {u.club && <span className="truncate">{u.club}</span>}
                        </div>
                        {near && (
                          <p className="mt-1 text-[13px] text-coin">
                            Im Angebot als {near.player_name}
                            {near.rating != null && ` · ${near.rating}`}
                            {nearVersion && ` · ${nearVersion.name}`}, zählt nicht wegen{' '}
                            {u.rating != null && near.rating != null && u.rating !== near.rating
                              ? 'anderem Rating'
                              : u.card_version_id && near.card_version_id && u.card_version_id !== near.card_version_id
                                ? 'anderer Version'
                                : 'abweichendem Namen ohne Rating'}
                            .
                            Tippen zum Anpassen.
                          </p>
                        )}
                      </div>
                    </button>
                    {match ? (
                      <span className="shrink-0 rounded-full bg-good/15 px-3 py-1.5 text-[13px] font-bold text-good">
                        ✓ Gekauft
                      </span>
                    ) : (
                      <button className="btn btn-quiet min-h-10 shrink-0 px-4 text-[15px]" onClick={() => setBuying(u)}>
                        Kaufen
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <ImportSheet
        open={importOpen}
        incoming={incoming}
        onSetup={() => {
          setImportOpen(false)
          setSetupOpen(true)
        }}
        onClose={() => {
          setImportOpen(false)
          setIncoming(null)
        }}
        existing={uev.list}
        onSave={(items) => run(() => uev.addMany(items), `${items.length} Spieler übernommen`)}
      />

      <BottomSheet open={exportOpen} onClose={() => setExportOpen(false)} title="ÜV-Liste exportieren">
        <div className="grid gap-3">
          <button
            className="btn btn-coin min-h-14"
            onClick={() => {
              const date = new Date().toISOString().slice(0, 10)
              downloadTextFile(`fc-trading-uev-liste-${date}.csv`, buildUevCsv(rows, versionById))
              setExportOpen(false)
            }}
          >
            Als CSV (Excel)
          </button>
          <Link to="/mehr/uev/pdf" className="btn btn-quiet min-h-14" onClick={() => setExportOpen(false)}>
            Als PDF
          </Link>
          <button
            className="btn btn-quiet min-h-14"
            onClick={async () => {
              const ok = await run(() => navigator.clipboard.writeText(buildUevText(rows, versionById)), 'Liste kopiert')
              if (ok) setExportOpen(false)
            }}
          >
            Als Text kopieren
          </button>
          <p className="text-center text-[13px] text-mute">✓ = gekauft (steht unter Angebote), ○ = noch kaufen</p>
        </div>
      </BottomSheet>

      <BottomSheet open={setupOpen} onClose={() => setSetupOpen(false)} title="Futbin-Button einrichten">
        <BookmarkletSetup />
      </BottomSheet>

      <BottomSheet open={adding} onClose={() => setAdding(false)} title="Spieler hinzufügen">
        {adding && (
          <UevForm
            submitLabel="Hinzufügen"
            onSubmit={async (v) => {
              const ok = await run(() => uev.addMany([v]), 'Hinzugefügt')
              if (ok) setAdding(false)
            }}
          />
        )}
      </BottomSheet>

      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title="Spieler bearbeiten">
        {editing && (
          <>
            <UevForm
              key={editing.id}
              initial={editing}
              submitLabel="Speichern"
              onSubmit={async (v) => {
                const ok = await run(() => uev.update(editing.id, v), 'Gespeichert')
                if (ok) setEditing(null)
              }}
            />
            <button
              className="btn btn-ghost mt-2 w-full text-bad"
              onClick={async () => {
                const ok = await run(() => uev.remove([editing.id]), 'Entfernt')
                if (ok) setEditing(null)
              }}
            >
              Aus der ÜV-Liste entfernen
            </button>
          </>
        )}
      </BottomSheet>

      {buying && (
        <BottomSheet open onClose={() => setBuying(null)} title={`${buying.player_name} einkaufen`}>
          <TradeForm
            submitLabel="Einkaufen"
            prefill={{ player_name: buying.player_name, card_version_id: buying.card_version_id, rating: buying.rating }}
            onSubmit={async (v) => {
              const ok = await run(() => addTrade(v), 'Eingekauft')
              if (ok) setBuying(null)
              return ok
            }}
          />
        </BottomSheet>
      )}

      <ConfirmSheet
        open={clearing}
        title="ÜV-Liste leeren?"
        text="Alle Spieler der ÜV-Liste werden entfernt. Deine Angebote und Verkäufe bleiben unverändert."
        confirmLabel="Liste leeren"
        danger
        onClose={() => setClearing(false)}
        onConfirm={async () => {
          const ok = await run(() => uev.remove(uev.list.map((u) => u.id)), 'ÜV-Liste geleert')
          if (ok) setClearing(false)
        }}
      />
    </>
  )
}

/** Einzelnen Spieler von Hand anlegen oder bearbeiten */
function UevForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: UevInput
  submitLabel: string
  onSubmit: (v: UevInput) => Promise<void>
}) {
  const id = useId()
  const [name, setName] = useState(initial?.player_name ?? '')
  const [rating, setRating] = useState(initial?.rating != null ? String(initial.rating) : '')
  const [club, setClub] = useState(initial?.club ?? '')
  const [versionId, setVersionId] = useState<string | null>(initial?.card_version_id ?? null)
  const [busy, setBusy] = useState(false)
  const r = Number(rating)
  const invalid = !name.trim() ? 'Bitte einen Namen eintragen.' : rating && (r < 1 || r > 99) ? 'Das Rating muss zwischen 1 und 99 liegen.' : ''

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (invalid || busy) return
    setBusy(true)
    await onSubmit({ player_name: name.trim(), rating: rating ? r : null, club: club.trim(), card_version_id: versionId })
    setBusy(false)
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div>
        <label className="label" htmlFor={`${id}-name`}>
          Spieler
        </label>
        <input id={`${id}-name`} className="field" autoCapitalize="words" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <div>
          <label className="label" htmlFor={`${id}-rating`}>
            Rating
          </label>
          <input
            id={`${id}-rating`}
            className="field"
            inputMode="numeric"
            value={rating}
            onChange={(e) => setRating(e.target.value.replace(/\D/g, '').slice(0, 2))}
          />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-club`}>
            Verein
          </label>
          <input id={`${id}-club`} className="field" autoComplete="off" value={club} onChange={(e) => setClub(e.target.value)} />
        </div>
      </div>
      <div>
        <VersionSelect value={versionId} onChange={setVersionId} />
      </div>
      {invalid && name && <p className="text-[14px] text-bad">{invalid}</p>}
      <button className="btn btn-coin min-h-14" disabled={!!invalid || busy}>
        {submitLabel}
      </button>
    </form>
  )
}

interface Draft extends FutbinDraft {
  key: number
  /** Ursprünglich erkannter Name, wenn er mit einem deiner eingetragenen Spieler korrigiert wurde */
  read?: string
}

/** Import: Screenshot (Texterkennung im Browser) oder eingefügter Text, danach Vorschau zum Korrigieren */
function ImportSheet({
  open,
  incoming,
  onSetup,
  onClose,
  existing,
  onSave,
}: {
  open: boolean
  /** Spieler vom Futbin-Lesezeichen: direkt in die Vorschau */
  incoming: FutbinDraft[] | null
  onSetup: () => void
  onClose: () => void
  existing: UevPlayer[]
  onSave: (items: UevInput[]) => Promise<boolean>
}) {
  const { versions, trades } = useData()
  const toast = useToast()
  const knownNames = useMemo(() => [...new Set(trades.map((t) => t.player_name))], [trades])
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Draft[] | null>(null)
  const [busy, setBusy] = useState(false)

  function close() {
    if (progress != null) return
    setText('')
    setDrafts(null)
    onClose()
  }

  useEffect(() => {
    if (incoming) showDrafts(incoming)
  }, [incoming])

  function preview(raw: string) {
    showDrafts(parseUevText(raw, versions))
  }

  function showDrafts(parsed: FutbinDraft[]) {
    if (parsed.length === 0) {
      toast('Keine Spieler erkannt.', 'error')
      return
    }
    setDrafts(
      parsed.map((p, i) => {
        const fixed = correctName(p.player_name, knownNames)
        return fixed ? { ...p, player_name: fixed, read: p.player_name, key: i } : { ...p, key: i }
      }),
    )
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setProgress(0)
    try {
      preview(await recognizeImages([...files], setProgress))
    } catch (e) {
      toast(`Texterkennung fehlgeschlagen: ${errMsg(e)}`, 'error')
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const patch = (key: number, p: Partial<UevInput>) =>
    setDrafts((d) => d && d.map((x) => (x.key === key ? { ...x, ...p } : x)))

  // Version für eine Futbin-Karte gewählt: für alle Karten mit gleichem Fingerabdruck übernehmen und merken
  function setVersion(d: Draft, versionId: string | null) {
    if (!d.futbinKey) return patch(d.key, { card_version_id: versionId })
    learnVersion(d.futbinKey, versionId)
    setDrafts((list) => list && list.map((x) => (x.futbinKey === d.futbinKey ? { ...x, card_version_id: versionId } : x)))
  }

  const valid = (drafts ?? []).filter((d) => d.player_name.trim())
  const fresh = valid.filter((d) => !existing.some((e) => isSameUev(e, d)))

  return (
    <BottomSheet open={open} onClose={close} title={drafts ? 'Erkannte Spieler prüfen' : 'Liste importieren'}>
      {!drafts ? (
        <div className="grid gap-4">
          <div className="tile bg-raised text-[14px] leading-relaxed text-mute">
            <span className="font-semibold text-ink">Am genauesten:</span> der Futbin-Button. Ein Tipp darauf auf deiner
            Futbin-Liste übernimmt Namen und Ratings direkt aus der Seite, ganz ohne Lesefehler.
            <button className="btn btn-coin mt-3 w-full" onClick={onSetup}>
              Futbin-Button einrichten
            </button>
          </div>

          <p className="text-[14px] text-mute">
            Oder per Screenshot (Texterkennung, ungenauer). Tipp: Vorher im Browser hineinzoomen, je größer die Schrift,
            desto besser.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <button className="btn btn-quiet min-h-14" disabled={progress != null} onClick={() => fileRef.current?.click()}>
            {progress == null ? 'Screenshot auswählen' : `Text wird erkannt … ${Math.round(progress * 100)} %`}
          </button>
          {progress != null && (
            <p className="text-center text-[13px] text-mute">Beim ersten Mal werden ca. 10 MB Erkennungsdaten geladen.</p>
          )}

          <div className="flex items-center gap-3 text-[13px] text-mute">
            <span className="h-px flex-1 bg-line" /> oder <span className="h-px flex-1 bg-line" />
          </div>

          <div>
            <label className="label" htmlFor="uev-text">
              Text einfügen (eine Zeile pro Spieler, z. B. „Mbappé; 91; Real Madrid; TOTW“)
            </label>
            <textarea
              id="uev-text"
              className="field min-h-32 py-3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button className="btn btn-quiet" disabled={!text.trim() || progress != null} onClick={() => preview(text)}>
            Text auslesen
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {drafts.some((d) => d.futbinKey) ? (
            <p className="text-[14px] text-mute">
              Prüfe die Einträge. Fehlt die Version, wähle sie bei einer Karte: Sie gilt dann für alle gleichen Karten
              und wird für künftige Importe gemerkt. Spieler, die schon in deiner ÜV-Liste stehen, werden übersprungen.
            </p>
          ) : (
            <p className="text-[14px] text-mute">
              Prüfe die Einträge: Die Texterkennung verliest sich manchmal, und Ratings aus den kleinen Futbin-Karten
              werden oft nicht erkannt. Störtext einfach mit ✕ entfernen. Spieler, die schon in deiner ÜV-Liste stehen,
              werden übersprungen.
            </p>
          )}
          <ul className="grid gap-2">
            {drafts.map((d) => {
              const dup = existing.some((e) => isSameUev(e, d))
              return (
                <li key={d.key} className={`rounded-xl border border-line p-3 ${dup ? 'opacity-50' : ''}`}>
                  <div className="flex gap-2">
                    <input
                      className="field min-h-10 flex-1"
                      aria-label="Spieler"
                      value={d.player_name}
                      onChange={(e) => patch(d.key, { player_name: e.target.value })}
                    />
                    <input
                      className="field min-h-10 w-16 px-2 text-center"
                      aria-label="Rating"
                      inputMode="numeric"
                      placeholder="OVR"
                      value={d.rating ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                        patch(d.key, { rating: v && Number(v) > 0 ? Number(v) : null })
                      }}
                    />
                    <button
                      className="min-h-10 shrink-0 px-2 text-mute"
                      aria-label="Entfernen"
                      onClick={() => setDrafts((list) => list && list.filter((x) => x.key !== d.key))}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="field min-h-10 flex-1"
                      aria-label="Verein"
                      placeholder="Verein"
                      value={d.club}
                      onChange={(e) => patch(d.key, { club: e.target.value })}
                    />
                    <select
                      className="field min-h-10 flex-1 px-2"
                      aria-label="Version"
                      value={d.card_version_id ?? ''}
                      onChange={(e) => setVersion(d, e.target.value || null)}
                    >
                      <option value="">Version …</option>
                      {versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {d.read && d.read !== d.player_name && (
                    <p className="mt-1 text-[13px] text-mute">Erkannt als „{d.read}“, korrigiert nach deinen Trades</p>
                  )}
                  {dup && <p className="mt-1 text-[13px] text-mute">Schon in der ÜV-Liste</p>}
                </li>
              )
            })}
          </ul>
          <button
            className="btn btn-coin min-h-14"
            disabled={fresh.length === 0 || busy}
            onClick={async () => {
              setBusy(true)
              const ok = await onSave(
                fresh.map((d) => ({
                  player_name: d.player_name.trim(),
                  rating: d.rating,
                  club: d.club.trim(),
                  card_version_id: d.card_version_id,
                })),
              )
              setBusy(false)
              if (ok) close()
            }}
          >
            {fresh.length === 1 ? '1 Spieler übernehmen' : `${fresh.length} Spieler übernehmen`}
          </button>
          <button className="btn btn-ghost" onClick={() => setDrafts(null)}>
            Zurück
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

/** Anleitung und Code für das Futbin-Lesezeichen */
function BookmarkletSetup() {
  const toast = useToast()
  const code = useMemo(() => bookmarkletCode(window.location.origin), [])
  const linkRef = useRef<HTMLAnchorElement>(null)

  // React erlaubt keine javascript:-Links als href, deshalb direkt am Element setzen
  useEffect(() => {
    linkRef.current?.setAttribute('href', code)
  }, [code])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      toast('Code kopiert')
    } catch {
      toast('Kopieren nicht möglich. Bitte den Code unten markieren und kopieren.', 'error')
    }
  }

  return (
    <div className="grid gap-5 text-[15px] leading-relaxed">
      <p className="text-mute">
        Der Button ist ein Lesezeichen in deinem Browser. Du öffnest deine Liste auf Futbin, tippst auf das Lesezeichen,
        und die App öffnet sich mit den Spielern in der Vorschau. Einmal einrichten, dann immer wieder nutzen.
      </p>

      <section>
        <h3 className="font-display text-lg font-bold">Am PC</h3>
        <ol className="mt-1 list-decimal pl-5 text-mute">
          <li>Lesezeichenleiste einblenden (Strg + Umschalt + B).</li>
          <li>
            Diesen Button in die Lesezeichenleiste ziehen:{' '}
            <a
              ref={linkRef}
              className="btn btn-coin my-1 min-h-10 px-4 text-[15px]"
              onClick={(e) => {
                e.preventDefault()
                toast('Nicht klicken, sondern in die Lesezeichenleiste ziehen.')
              }}
            >
              ÜV-Import
            </a>
          </li>
          <li>Auf Futbin deine Liste öffnen und in der Leiste auf „ÜV-Import“ klicken.</li>
        </ol>
      </section>

      <section>
        <h3 className="font-display text-lg font-bold">Am Handy (iPhone Safari / Android Chrome)</h3>
        <ol className="mt-1 list-decimal pl-5 text-mute">
          <li>
            <button className="btn btn-quiet my-1 min-h-10 px-4 text-[15px]" onClick={() => void copy()}>
              Code kopieren
            </button>
          </li>
          <li>Irgendeine Seite als Lesezeichen speichern (iPhone: Teilen → Lesezeichen hinzufügen) und „ÜV-Import“ nennen.</li>
          <li>Das Lesezeichen bearbeiten, die Adresse komplett löschen und den kopierten Code einfügen.</li>
          <li>
            Auf Futbin deine Liste öffnen, dann die Lesezeichen öffnen (iPhone: unten „•••“ → Lesezeichen) und dort
            „ÜV-Import“ antippen.
          </li>
        </ol>
        <p className="mt-2 text-[13px] text-mute">
          Wichtig am iPhone: nicht über die Vorschläge der Adressleiste starten. Dann meldet Safari „Skript kann nicht
          ausgeführt werden“.
        </p>
        <p className="mt-2 text-[13px] text-mute">
          Die App öffnet sich dann im Browser. Beim ersten Mal musst du dich dort eventuell einmal anmelden.
        </p>
      </section>

      <section>
        <h3 className="font-display text-lg font-bold">Gut zu wissen</h3>
        <ul className="mt-1 list-disc pl-5 text-mute">
          <li>Stehen mehrere Spielerlisten auf der Seite, fragt der Button, welche du übernehmen willst.</li>
          <li>Hast du vorher etwas markiert, wird nur die Markierung übernommen.</li>
          <li>Vor dem Speichern siehst du immer die Vorschau und kannst alles korrigieren.</li>
        </ul>
      </section>

      <details className="text-[13px] text-mute">
        <summary className="cursor-pointer">Code anzeigen</summary>
        <textarea readOnly className="field mt-2 min-h-24 py-2 font-mono text-[12px]" value={code} onFocus={(e) => e.target.select()} />
      </details>
    </div>
  )
}
