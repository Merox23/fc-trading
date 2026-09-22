import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BottomSheet } from '../components/BottomSheet'
import { PageTitle } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useRun } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function Konto() {
  const { session, signOut } = useAuth()
  const run = useRun()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwError, setPwError] = useState('')
  const [busy, setBusy] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    if (pw.length < 8) return setPwError('Das Passwort braucht mindestens 8 Zeichen.')
    if (pw !== pw2) return setPwError('Die beiden Passwörter sind nicht gleich.')
    setPwError('')
    setBusy(true)
    const ok = await run(async () => {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) throw error
    }, 'Passwort geändert')
    setBusy(false)
    if (ok) {
      setPw('')
      setPw2('')
    }
  }

  async function deleteAccount() {
    setBusy(true)
    const ok = await run(async () => {
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
    })
    setBusy(false)
    if (ok) await signOut()
  }

  return (
    <>
      <Link to="/mehr" className="mb-2 inline-flex min-h-12 items-center text-[15px] text-mute">
        &#x2039; Zurück
      </Link>
      <PageTitle sub={session?.user.email}>Konto</PageTitle>

      <form onSubmit={changePassword} className="tile grid gap-4 md:max-w-md" noValidate>
        <h2 className="font-display text-lg font-bold">Passwort ändern</h2>
        <div>
          <label htmlFor="new-pw" className="label">
            Neues Passwort
          </label>
          <input id="new-pw" className="field" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label htmlFor="new-pw2" className="label">
            Passwort wiederholen
          </label>
          <input id="new-pw2" className="field" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {pwError && (
          <p role="alert" className="text-[15px] font-medium text-bad">
            {pwError}
          </p>
        )}
        <button type="submit" className="btn btn-coin min-h-14" disabled={busy}>
          Passwort speichern
        </button>
      </form>

      <div className="mt-6 grid gap-3 md:max-w-md">
        <button className="btn btn-quiet min-h-14" onClick={() => void signOut()}>
          Abmelden
        </button>
        <button className="btn btn-quiet min-h-14 text-bad" onClick={() => setDelOpen(true)}>
          Konto und alle Daten löschen
        </button>
      </div>

      <BottomSheet open={delOpen} onClose={() => setDelOpen(false)} title="Konto endgültig löschen?">
        <p className="mb-4 text-[15px] leading-relaxed text-mute">
          Dein Konto, alle Spieler, Verkäufe und eigenen Versionen werden unwiderruflich gelöscht. Tippe zur
          Bestätigung <strong className="text-ink">LÖSCHEN</strong> ein.
        </p>
        <input
          className="field mb-3"
          autoCapitalize="characters"
          autoComplete="off"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          aria-label="Bestätigung"
          placeholder="LÖSCHEN"
        />
        <div className="grid gap-3">
          <button
            className="btn btn-danger min-h-14"
            disabled={busy || confirmText.trim().toUpperCase() !== 'LÖSCHEN'}
            onClick={() => void deleteAccount()}
          >
            Alles endgültig löschen
          </button>
          <button className="btn btn-quiet min-h-14" onClick={() => setDelOpen(false)}>
            Abbrechen
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
