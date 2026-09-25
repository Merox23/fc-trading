import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_THEME_ID } from '../lib/themes'

const KEY = 'fc-theme'

interface ThemeCtx {
  themeId: string
  setThemeId: (id: string) => void
}

const Ctx = createContext<ThemeCtx>({ themeId: DEFAULT_THEME_ID, setThemeId: () => {} })

/** Merkt sich die gewählte Akzentfarbe pro Gerät (localStorage) und setzt sie als data-Attribut auf <html> */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? DEFAULT_THEME_ID
    } catch {
      return DEFAULT_THEME_ID
    }
  })

  useEffect(() => {
    if (themeId === DEFAULT_THEME_ID) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = themeId
  }, [themeId])

  function setThemeId(id: string) {
    setThemeIdState(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      /* egal, gilt dann nur für diese Sitzung */
    }
  }

  return <Ctx.Provider value={{ themeId, setThemeId }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
