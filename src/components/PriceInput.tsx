import { useId } from 'react'
import { MAX_PRICE } from '../constants'
import { fmt } from '../lib/format'
import { snapToNearestValidPrice } from '../lib/prices'

interface Props {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  steps?: number[]
  /** false: kein Runden auf Marktpreis-Stufen (z. B. bei einem frei wählbaren Zielwert statt einem echten Listenpreis) */
  snap?: boolean
}

/** Preisfeld mit Zahlen-Tastatur, Tausenderpunkten und Schnellbuttons.
 *  Rundet beim Verlassen des Felds und bei den Schnellbuttons auf gültige Marktpreis-Stufen. */
export function PriceInput({ label, value, onChange, steps = [1000, 5000, 10000], snap = true }: Props) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="field pr-16 text-lg tabular-nums"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="0"
          value={value === null ? '' : fmt(value)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
            onChange(digits === '' ? null : Number(digits))
          }}
          onBlur={() => {
            if (snap && value !== null) onChange(snapToNearestValidPrice(value))
          }}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-coin">Coins</span>
      </div>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr) 3.5rem` }}>
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-quiet px-0 text-[15px] tabular-nums"
            onClick={() => onChange(snap ? snapToNearestValidPrice(Math.min((value ?? 0) + s, MAX_PRICE)) : Math.min((value ?? 0) + s, MAX_PRICE))}
          >
            +{fmt(s)}
          </button>
        ))}
        <button type="button" className="btn btn-quiet px-0" onClick={() => onChange(null)} aria-label={`${label} löschen`}>
          &#x2715;
        </button>
      </div>
    </div>
  )
}
