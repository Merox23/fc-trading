export interface ThemeOption {
  id: string
  label: string
  accent: string
  onAccent: string
}

/** Akzentfarben zur Auswahl. Alle mit ausreichend Kontrast gegen den dunklen App-Hintergrund getestet. */
export const THEMES: ThemeOption[] = [
  { id: 'gold', label: 'Gold', accent: '#F2C14E', onAccent: '#0B1020' },
  { id: 'blau', label: 'Blau', accent: '#38BDF8', onAccent: '#0B1020' },
  { id: 'gruen', label: 'Grün', accent: '#34D399', onAccent: '#0B1020' },
  { id: 'lila', label: 'Lila', accent: '#A78BFA', onAccent: '#0B1020' },
  { id: 'orange', label: 'Orange', accent: '#FB923C', onAccent: '#0B1020' },
  { id: 'pink', label: 'Pink', accent: '#F472B6', onAccent: '#0B1020' },
  { id: 'tuerkis', label: 'Türkis', accent: '#22D3EE', onAccent: '#0B1020' },
]

export const DEFAULT_THEME_ID = 'gold'
