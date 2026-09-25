import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { CHEMSTYLES } from '../constants'
import { useData } from '../hooks/useData'
import { requiredSellPrice } from '../lib/calc'
import { fmt } from '../lib/format'
import { nextStepAbove, nextStepBelow, snapUpToValidPrice } from '../lib/prices'
import type { Trade, TradeInput } from '../types'
import { NameAutocomplete } from './NameAutocomplete'
import { PriceInput } from './PriceInput'
import { Icon } from './ui'
import { VersionSelect } from './VersionSelect'

/** Gruppiert zusammengehörige Felder sichtbar, damit das Formular nicht als eine lange Liste wirkt */
function FormGroup({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-card p-4">
      <legend className="mb-3 flex items-center gap-2 px-0.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-coin text-[13px] font-bold text-on-coin">
          {step}
        </span>
        <span className="font-display text-[17px] font-bold">{title}</span>
      </legend>
      <div className="grid gap-4">{children}</div>
    </fieldset>
  )
}

interface Props {
  initial?: Trade
  /** Für einen neuen Eintrag mit vorausgefüllten Werten (z. B. Rückkauf nach Verkauf) */
  prefill?: Pick<TradeInput, 'player_name' | 'card_version_id' | 'rating'>
  submitLabel: string
  onSubmit: (v: TradeInput) => Promise<boolean>
  /** true: Formular nach dem Speichern leeren (schnelles Eintragen) */
  clearOnSuccess?: boolean
  /** true: Speichern-Button klebt über der Tab-Leiste (nur für die Seite, nicht im Sheet) */
  stickySubmit?: boolean
}

export function TradeForm({ initial, prefill, submitLabel, onSubmit, clearOnSuccess, stickySubmit }: Props) {
  const { trades } = useData()
  const initChem = initial?.chemstyle ?? 'Keiner'

  const [name, setName] = useState(initial?.player_name ?? prefill?.player_name ?? '')
  const [versionId, setVersionId] = useState<string | null>(initial?.card_version_id ?? prefill?.card_version_id ?? null)
  const [rating, setRating] = useState(
    initial?.rating ? String(initial.rating) : prefill?.rating ? String(prefill.rating) : '',
  )
  const [chem, setChem] = useState(initChem)
  const [otherChem, setOtherChem] = useState(!CHEMSTYLES.includes(initChem))
  const [buy, setBuy] = useState<number | null>(initial?.buy_price ?? null)
  const [bid, setBid] = useState<number | null>(initial?.bid_price ?? null)
  const [buyNow, setBuyNow] = useState<number | null>(initial?.buy_now_price ?? null)
  const [showCalc, setShowCalc] = useState(false)
  const [targetProfit, setTargetProfit] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // Vorschläge aus bereits eingetragenen Spielernamen
  const names = useMemo(
    () => Array.from(new Set(trades.map((t) => t.player_name))).sort((a, b) => a.localeCompare(b, 'de')),
    [trades],
  )

  function reset() {
    setName('')
    setVersionId(null)
    setRating('')
    setChem('Keiner')
    setOtherChem(false)
    setBuy(null)
    setBid(null)
    setBuyNow(null)
    setTargetProfit(null)
    setError('')
  }

  function validate(): TradeInput | string {
    const playerName = name.trim()
    if (!playerName) return 'Bitte den Spielernamen eingeben.'
    if (!versionId) return 'Bitte eine Version wählen.'
    const r = Number(rating)
    if (!rating || !Number.isInteger(r) || r < 1 || r > 99) return 'Das Rating muss zwischen 1 und 99 liegen.'
    const chemstyle = chem.trim()
    if (!chemstyle) return 'Bitte einen Chemstyle wählen oder eintragen.'
    if (buy === null) return 'Bitte den Einkaufspreis eingeben.'
    if (bid === null) return 'Bitte den Gebotspreis eingeben.'
    if (buyNow === null) return 'Bitte den Sofortkaufpreis eingeben.'
    if (bid > buyNow) return 'Der Gebotspreis darf nicht höher sein als der Sofortkaufpreis.'
    return {
      player_name: playerName,
      card_version_id: versionId,
      rating: r,
      chemstyle,
      buy_price: buy,
      bid_price: bid,
      buy_now_price: buyNow,
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const result = validate()
    if (typeof result === 'string') {
      setError(result)
      return
    }
    setError('')
    setBusy(true)
    const ok = await onSubmit(result)
    setBusy(false)
    if (ok && clearOnSuccess) {
      reset()
      nameRef.current?.focus()
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:mx-auto md:max-w-4xl md:items-start lg:grid-cols-2" noValidate>
      <FormGroup step={1} title="Spielerdaten">
        <div>
          <label htmlFor="player-name" className="label">
            Spielername
          </label>
          <NameAutocomplete
            id="player-name"
            inputRef={nameRef}
            value={name}
            onChange={setName}
            suggestions={names}
            placeholder="z. B. Jamal Musiala"
          />
          {name.trim().length >= 2 && (
            <a
              className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-[14px] font-medium text-coin"
              href={`https://www.futbin.com/27/players?search=${encodeURIComponent(name.trim())}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bei Futbin nachschauen &#x2197;
            </a>
          )}
        </div>

        <div>
          <VersionSelect value={versionId} onChange={setVersionId} />
        </div>

        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <div>
            <label htmlFor="rating" className="label">
              Rating
            </label>
            <input
              id="rating"
              className="field text-center text-lg tabular-nums"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              autoComplete="off"
              value={rating}
              onChange={(e) => setRating(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="91"
            />
          </div>
          <div>
            <label htmlFor="chem" className="label">
              Chemstyle
            </label>
            <div className="relative">
              <select
                id="chem"
                className="field pr-10"
                value={otherChem ? '__other' : chem}
                onChange={(e) => {
                  if (e.target.value === '__other') {
                    setOtherChem(true)
                    setChem('')
                  } else {
                    setOtherChem(false)
                    setChem(e.target.value)
                  }
                }}
              >
                {CHEMSTYLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__other">Andere …</option>
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true">
                &#x25BE;
              </span>
            </div>
          </div>
        </div>

        {otherChem && (
          <div>
            <label htmlFor="chem-other" className="label">
              Eigener Chemstyle
            </label>
            <input
              id="chem-other"
              className="field"
              autoComplete="off"
              value={chem}
              onChange={(e) => setChem(e.target.value)}
              placeholder="Name des Chemstyles"
            />
          </div>
        )}
      </FormGroup>

      <FormGroup step={2} title="Preise">
        <PriceInput label="Einkaufspreis" value={buy} onChange={setBuy} />

        <div>
          <button
            type="button"
            className="btn btn-quiet min-h-11 w-full justify-start gap-2 px-3 text-[14px]"
            onClick={() => setShowCalc((s) => !s)}
            aria-expanded={showCalc}
          >
            <Icon>
              <rect x="5" y="3" width="14" height="18" rx="2" />
              <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 14.5h2M12 14.5h2M16 14.5h0M8 18h2M12 18h2M16 18h0" />
            </Icon>
            {showCalc ? 'Rückwärts-Rechner ausblenden' : 'Rückwärts-Rechner: Zielgewinn → Preis'}
          </button>
          {showCalc && (
            <div className="mt-2 grid gap-3 rounded-xl bg-raised p-3">
              <PriceInput
                label="Zielgewinn"
                value={targetProfit}
                onChange={setTargetProfit}
                steps={[500, 1000, 5000]}
                snap={false}
              />
              {buy === null ? (
                <p className="text-[13px] text-mute">Erst den Einkaufspreis oben eintragen.</p>
              ) : (
                targetProfit !== null && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[14px] text-mute">
                      Nötiger Sofortkaufpreis:{' '}
                      <span className="font-semibold text-ink tabular-nums">
                        {fmt(snapUpToValidPrice(requiredSellPrice(buy, targetProfit)))}
                      </span>
                    </p>
                    <button
                      type="button"
                      className="btn btn-quiet shrink-0 px-3 text-[13px]"
                      onClick={() => {
                        const price = snapUpToValidPrice(requiredSellPrice(buy, targetProfit))
                        setBuyNow(price)
                        setBid(nextStepBelow(price))
                      }}
                    >
                      Übernehmen
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <PriceInput
          label="Gebotspreis (Startpreis)"
          value={bid}
          onChange={setBid}
          onSnap={(v) => setBuyNow(nextStepAbove(v))}
        />
        <PriceInput label="Sofortkaufpreis" value={buyNow} onChange={setBuyNow} />
      </FormGroup>

      <div
        className={
          stickySubmit
            ? 'sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 bg-gradient-to-t from-night via-night to-transparent px-4 pb-3 pt-4 md:static md:mx-0 md:bg-none md:px-0 md:pb-0 md:pt-0 lg:col-span-2'
            : 'pt-1 lg:col-span-2'
        }
      >
        {error && (
          <p role="alert" className="mb-2 text-[15px] font-medium text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-coin min-h-14 w-full text-lg" disabled={busy}>
          {busy ? 'Speichert …' : submitLabel}
        </button>
      </div>
    </form>
  )
}
