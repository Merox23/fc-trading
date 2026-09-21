import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** false, wenn die Umgebungsvariablen fehlen (dann zeigt die App eine Hilfe-Seite) */
export const configured = Boolean(url && key)

/** Registrierung in der App sichtbar? (Zusätzlich muss sie in Supabase erlaubt sein.) */
export const ALLOW_SIGNUP = import.meta.env.VITE_ALLOW_SIGNUP === 'true'

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing')
