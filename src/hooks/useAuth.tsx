import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearCache } from './useData'

interface AuthCtx {
  session: Session | null | undefined // undefined = lädt noch
  recovery: boolean // true, wenn jemand über den "Passwort vergessen"-Link kommt
  finishRecovery: () => void
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  session: undefined,
  recovery: false,
  finishRecovery: () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function signOut() {
    clearCache() // keine Daten auf dem Gerät zurücklassen
    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <Ctx.Provider value={{ session, recovery, finishRecovery: () => setRecovery(false), signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
