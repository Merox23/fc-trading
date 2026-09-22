import { useState, type FormEvent, type ReactNode } from 'react'
import { Footer } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { diagnose } from '../lib/diagnose'
import { errMsg } from '../lib/errors'
import { withTimeout } from '../lib/timeout'
import { ALLOW_SIGNUP, supabase } from '../lib/supabase'

function Brand() {
  return (
    <div className="mb-8 text-center">
      <img src="/icon-192.png" alt="" className="mx-auto mb-4 size-20 rounded-[22px]" />
      <h1 className="font-display text-3xl font-bold text-coin">FC Trading</h1>
      <p className="mt-1 text-[15px] text-mute">Deine Transfermarkt-Bilanz</p>
    </div>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col justify-center">{children}</div>
      <Footer />
    </div>
  )
}

export function NotConfigured() {
  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="mb-3 font-display text-2xl font-bold">Einrichtung fehlt</h1>
      <p className="text-[15px] leading-relaxed text-mute">
        Die Verbindung zu Supabase ist nicht eingetragen. Lege in Vercel (Settings, Environment Variables) diese zwei
        Werte an und starte danach ein neues Deployment:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-raised p-3 text-sm">VITE_SUPABASE_URL{'\n'}VITE_SUPABASE_ANON_KEY</pre>
    </div>
  )
}

type Mode = 'login' | 'signup' | 'reset'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [diag, setDiag] = useState<string[] | null>(null)
  const [diagBusy, setDiagBusy] = useState(false)

  async function runDiag() {
    setDiagBusy(true)
    setDiag(['Prüfe ...'])
    setDiag(await diagnose())
    setDiagBusy(false)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setInfo('')
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email.trim()) return setError('Bitte die E-Mail-Adresse eingeben.')
    if (mode !== 'reset' && password.length < 6) return setError('Bitte das Passwort eingeben.')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
          20000,
          'Keine Antwort von Supabase nach 20 Sekunden.',
        )
        if (error) throw error
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('Das Passwort braucht mindestens 8 Zeichen.')
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) setInfo('Fast geschafft: Wir haben dir eine E-Mail zur Bestätigung geschickt.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setInfo('Falls ein Konto zu dieser Adresse existiert, ist eine E-Mail zum Zurücksetzen unterwegs.')
      }
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Konto erstellen' : 'Passwort zurücksetzen'

  return (
    <Frame>
      <Brand />
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <div>
          <label htmlFor="email" className="label">
            E-Mail
          </label>
          <input
            id="email"
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {mode !== 'reset' && (
          <div>
            <label htmlFor="password" className="label">
              Passwort
            </label>
            <input
              id="password"
              className="field"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-[15px] font-medium text-bad">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-[15px] font-medium text-good">
            {info}
          </p>
        )}
        <button type="submit" className="btn btn-coin min-h-14 text-lg" disabled={busy}>
          {busy ? 'Einen Moment …' : mode === 'login' ? 'Anmelden' : mode === 'signup' ? 'Registrieren' : 'Link senden'}
        </button>
        {mode === 'login' && (
          <button type="button" className="btn btn-ghost" onClick={() => switchMode('reset')}>
            Passwort vergessen?
          </button>
        )}
        {mode === 'login' && ALLOW_SIGNUP && (
          <button type="button" className="btn btn-quiet" onClick={() => switchMode('signup')}>
            Neues Konto erstellen
          </button>
        )}
        {mode !== 'login' && (
          <button type="button" className="btn btn-ghost" onClick={() => switchMode('login')}>
            Zurück zur Anmeldung
          </button>
        )}
      </form>
      {mode === 'login' && (
        <div className="mt-2 grid gap-2">
          <button type="button" className="btn btn-ghost text-[15px]" onClick={() => void runDiag()} disabled={diagBusy}>
            {diagBusy ? 'Prüfe ...' : 'Verbindung testen'}
          </button>
          {diag && (
            <pre className="whitespace-pre-wrap break-words rounded-xl bg-raised p-3 text-[13px] leading-relaxed text-mute">
              {diag.join('\n')}
            </pre>
          )}
        </div>
      )}
    </Frame>
  )
}

/** Wird gezeigt, wenn jemand über den Link aus der "Passwort vergessen"-Mail kommt */
export function Recovery() {
  const { finishRecovery } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setError('Das Passwort braucht mindestens 8 Zeichen.')
    if (pw !== pw2) return setError('Die beiden Passwörter sind nicht gleich.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(errMsg(error))
    finishRecovery()
  }

  return (
    <Frame>
      <Brand />
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <h2 className="font-display text-xl font-bold">Neues Passwort festlegen</h2>
        <div>
          <label htmlFor="pw" className="label">
            Neues Passwort
          </label>
          <input id="pw" className="field" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw2" className="label">
            Passwort wiederholen
          </label>
          <input id="pw2" className="field" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {error && (
          <p role="alert" className="text-[15px] font-medium text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-coin min-h-14 text-lg" disabled={busy}>
          {busy ? 'Speichert …' : 'Passwort speichern'}
        </button>
      </form>
    </Frame>
  )
}
