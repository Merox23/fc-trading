import { useId, useState, type RefObject } from 'react'

interface Props {
  id: string
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder?: string
  inputRef?: RefObject<HTMLInputElement | null>
}

/** Eigenes Dropdown für Namensvorschläge, statt der nativen <datalist> (auf iPhone-Safari zeigt die keinen Dropdown an) */
export function NameAutocomplete({ id, value, onChange, suggestions, placeholder, inputRef }: Props) {
  const [open, setOpen] = useState(false)
  const listId = useId()

  const term = value.trim().toLowerCase()
  const matches = term
    ? suggestions.filter((n) => n.toLowerCase().includes(term) && n.toLowerCase() !== term).slice(0, 8)
    : []
  const showList = open && matches.length > 0

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        className="field"
        autoComplete="off"
        autoCapitalize="words"
        autoCorrect="off"
        enterKeyHint="next"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder={placeholder}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-raised shadow-lg"
        >
          {matches.map((n) => (
            <li key={n}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex min-h-12 w-full items-center px-4 text-left text-[15px] active:bg-card"
                // onMouseDown statt onClick: feuert vor dem blur des Inputs, sonst schließt die Liste zuerst
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(n)
                  setOpen(false)
                }}
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
