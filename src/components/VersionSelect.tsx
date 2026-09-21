import { useState } from 'react'
import { useData } from '../hooks/useData'
import { BottomSheet } from './BottomSheet'
import { VersionChip, VersionDot } from './ui'

interface Props {
  value: string | null
  onChange: (id: string) => void
}

/** Auswahl der Kartenversion als Bottom-Sheet mit Farbmarkierung */
export function VersionSelect({ value, onChange }: Props) {
  const { versions, versionById } = useData()
  const [open, setOpen] = useState(false)
  const current = versionById(value)

  return (
    <>
      <span className="label">Version</span>
      <button type="button" className="field flex items-center justify-between text-left" onClick={() => setOpen(true)}>
        {current ? <VersionChip version={current} /> : <span className="text-mute/70">Version wählen</span>}
        <span className="text-mute" aria-hidden="true">
          &#x25BE;
        </span>
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Version wählen">
        <ul className="grid gap-1">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-base ${
                  v.id === value ? 'bg-raised' : ''
                }`}
                onClick={() => {
                  onChange(v.id)
                  setOpen(false)
                }}
              >
                <VersionDot color={v.color} />
                <span className="flex-1">{v.name}</span>
                {v.id === value && <span className="text-coin">&#x2713;</span>}
              </button>
            </li>
          ))}
        </ul>
        {versions.length === 0 && <p className="text-mute">Noch keine Versionen geladen.</p>}
      </BottomSheet>
    </>
  )
}
