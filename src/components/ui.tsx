import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { CardVersion } from '../types'

export function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div
      role="tablist"
      className="grid gap-1 rounded-2xl border border-line bg-card p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-12 rounded-xl px-1 text-[15px] font-semibold transition ${
            o.value === value ? 'bg-coin text-on-coin' : 'text-mute'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Spieler suchen',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      className="field"
      inputMode="search"
      enterKeyHint="search"
      autoComplete="off"
      autoCorrect="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  )
}

export function VersionDot({ color }: { color: string }) {
  return <span className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-white/30" style={{ background: color }} />
}

export function VersionChip({ version }: { version: Pick<CardVersion, 'name' | 'color'> }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[15px]">
      <VersionDot color={version.color} />
      {version.name}
    </span>
  )
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mt-1 text-[15px] text-mute">{text}</p>}
    </div>
  )
}

export function MoreButton({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (shown >= total) return null
  return (
    <button className="btn btn-quiet w-full" onClick={onMore}>
      Mehr anzeigen ({total - shown} weitere)
    </button>
  )
}

export function Footer() {
  return (
    <footer className="mt-10 pb-2 text-center text-[13px] text-mute">
      <p>Inoffizielles Fan-Tool, nicht mit EA verbunden</p>
      <p className="mt-1">
        <Link to="/impressum" className="inline-block px-3 py-2 underline underline-offset-2">
          Impressum
        </Link>
        <Link to="/datenschutz" className="inline-block px-3 py-2 underline underline-offset-2">
          Datenschutz
        </Link>
      </p>
    </footer>
  )
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-[28px] font-bold leading-tight">{children}</h1>
      {sub && <p className="mt-1 text-[15px] text-mute">{sub}</p>}
    </div>
  )
}

export function Tile({
  label,
  value,
  tone,
  sub,
  wide,
}: {
  label: string
  value: string
  tone?: string
  sub?: string
  wide?: boolean
}) {
  return (
    <div className={`tile ${wide ? 'col-span-2 md:col-span-4' : ''}`}>
      <div className="text-[13px] text-mute">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone ?? ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[13px] text-mute">{sub}</div>}
    </div>
  )
}
