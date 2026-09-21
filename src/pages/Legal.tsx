import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer, PageTitle } from '../components/ui'

function Page({ title, children }: { title: string; children: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <button className="mb-2 inline-flex min-h-12 items-center text-[15px] text-mute" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))}>
        &#x2039; Zurück
      </button>
      <PageTitle>{title}</PageTitle>
      <div className="grid gap-4 text-[15px] leading-relaxed text-mute">{children}</div>
      <Footer />
    </div>
  )
}

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl border border-coin/40 bg-coin/10 p-3 text-coin">{children}</p>
)

/* PLATZHALTER: Diese Texte vor der Öffnung für andere Nutzer mit deinen echten Angaben füllen. */
export function Impressum() {
  return (
    <Page title="Impressum">
      <Hint>Platzhalter. Trage hier deine Angaben ein, bevor du die App für andere öffnest.</Hint>
      <div>
        <h2 className="font-semibold text-ink">Angaben nach § 5 DDG</h2>
        <p>[Vor- und Nachname]</p>
        <p>[Straße und Hausnummer]</p>
        <p>[PLZ und Ort]</p>
      </div>
      <div>
        <h2 className="font-semibold text-ink">Kontakt</h2>
        <p>E-Mail: [deine E-Mail-Adresse]</p>
      </div>
      <div>
        <h2 className="font-semibold text-ink">Hinweis</h2>
        <p>Inoffizielles Fan-Tool. Nicht mit Electronic Arts Inc. verbunden oder von ihr unterstützt.</p>
      </div>
    </Page>
  )
}

export function Datenschutz() {
  return (
    <Page title="Datenschutz">
      <Hint>Platzhalter. Vor der Öffnung für andere Nutzer ausfüllen und rechtlich prüfen lassen.</Hint>
      <div>
        <h2 className="font-semibold text-ink">Verantwortlicher</h2>
        <p>[Name, Anschrift, E-Mail-Adresse]</p>
      </div>
      <div>
        <h2 className="font-semibold text-ink">Welche Daten gespeichert werden</h2>
        <p>
          E-Mail-Adresse und Passwort (nur als geschützter Hash) für die Anmeldung sowie die Handelsdaten, die du selbst
          einträgst (Spieler, Preise, Verkäufe, eigene Kartenversionen).
        </p>
      </div>
      <div>
        <h2 className="font-semibold text-ink">Dienstleister</h2>
        <p>Hosting: Vercel. Datenbank und Anmeldung: Supabase. [Standorte und Auftragsverarbeitung ergänzen]</p>
      </div>
      <div>
        <h2 className="font-semibold text-ink">Deine Rechte</h2>
        <p>
          Du kannst dein Konto und alle Daten jederzeit selbst löschen: Mehr, Konto, "Konto und alle Daten löschen".
          Weitere Rechte (Auskunft, Berichtigung usw.): [Beschreibung ergänzen]
        </p>
      </div>
    </Page>
  )
}
