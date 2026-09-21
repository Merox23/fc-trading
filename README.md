# FC Trading

Inoffizielles Fan-Tool zum Erfassen von Transfermarkt-Trades in EA FC 2027: einkaufen, überteuert anbieten, Verkauf eintragen, Statistik ansehen. Mobile-first, Dark Mode, installierbar als App (PWA).
Nicht mit EA verbunden, ohne EA-Logos oder Spielerbilder.

**Technik:** Vite, React, TypeScript, Tailwind CSS, Supabase (Login und Datenbank), Vercel (Hosting). Alles im kostenlosen Rahmen.

## Einrichten in 5 Schritten

1. **Supabase:** Projekt anlegen (Region Frankfurt). Unter *SQL Editor → New query* den Inhalt von `supabase/001_init.sql` einfügen und *Run* drücken.
2. **Dein Konto:** *Authentication → Users → Add user → Create new user*, E-Mail und Passwort eintragen, "Auto Confirm User" anhaken.
3. **GitHub:** Diesen Ordner als Repository hochladen.
4. **Vercel:** *Add New → Project*, Repository wählen. Vor dem Deploy unter *Environment Variables* eintragen:

   | Name | Wert |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL aus Supabase (`https://xxxx.supabase.co`) |
   | `VITE_SUPABASE_ANON_KEY` | Publishable key aus Supabase |
   | `VITE_ALLOW_SIGNUP` | `false` |

   Dann *Deploy*. Änderst du später eine Variable, braucht es ein neues Deployment (*Deployments → ⋯ → Redeploy*).
5. **Supabase mit Vercel verbinden:** *Authentication → URL Configuration*: Bei **Site URL** und **Redirect URLs** die Vercel-Adresse eintragen (z. B. `https://fc-trading.vercel.app`). Sonst funktionieren "Passwort vergessen" und die E-Mail-Bestätigung nicht.

**Aufs Handy:** Adresse in Safari (iPhone: *Teilen → Zum Home-Bildschirm*) oder Chrome (Android: *App installieren*) öffnen.

## Registrierung für andere an- und ausschalten

Es gibt zwei Schalter, beide müssen zusammenpassen:

- **Supabase (der echte Schutz):** *Authentication → Sign In / Providers → Email → "Allow new users to sign up"*. Aus = niemand außer dir kommt rein. An = Registrierung möglich.
- **App (nur die Anzeige):** Umgebungsvariable `VITE_ALLOW_SIGNUP` in Vercel. `true` zeigt den Button "Neues Konto erstellen" auf dem Anmeldescreen, `false` blendet ihn aus. Danach neu deployen.

Vor dem Öffnen für andere: Impressum und Datenschutz ausfüllen (`src/pages/Legal.tsx`, derzeit Platzhalter) und rechtlich prüfen lassen.

## Rechenregeln

- Erlös netto = Verkaufspreis × 0,95, abgerundet auf ganze Coins
- Gewinn = Erlös netto − Einkaufspreis
- Steuerverlust = Verkaufspreis − Erlös netto
- Gebundene Coins = Summe der Einkaufspreise aller offenen Angebote

Getestet mit `npm test` (u. a. 10.000 → 9.500, 12.345 → 11.727, Zeiträume und Top-Listen der Statistik).

## Anpassen

- **Chemstyles:** `src/constants.ts` (Stand FC 27: 19 Feldspieler-Styles plus die 5 Torwart-Styles). Bei neuen Styles die Liste ergänzen, die Datenbank bleibt unverändert. In der App gibt es außerdem "Andere …" mit Freitext.
- **Standardversionen und Farben:** im SQL (`supabase/001_init.sql`) oder direkt in Supabase unter *Table Editor → card_versions* (Zeilen mit leerer `user_id`).
- **Eigene Versionen:** in der App unter *Mehr → Kartenversionen*.

## Lokal starten (optional, braucht Node.js 20+)

```
npm install
cp .env.example .env     # Werte eintragen
npm run dev
```

## Aufbau

```
supabase/001_init.sql    Tabellen, Zugriffsregeln (RLS), Standardversionen, Konto-löschen-Funktion
src/lib/                 calc.ts (Steuer/Gewinn) · stats.ts (Statistik) · format.ts · supabase.ts
src/hooks/               useAuth · useData (Laden, Speichern, Offline-Stand) · useToast
src/components/          Shell/Tab-Leiste, BottomSheet, PriceInput, TradeForm, TradeCard, SaleSheet
src/pages/               Login, Eintragen, Angebote, Verkaeufe, Statistik, Mehr, Kartenversionen, Konto, Legal
```

## Gut zu wissen

- **Supabase Free** pausiert Projekte nach etwa einer Woche ohne Nutzung. Im Dashboard mit einem Klick wieder aktivieren, die Daten bleiben.
- Supabase verschickt im Free-Tarif nur wenige E-Mails pro Stunde (Passwort-Reset, Bestätigung).
- Offline sichtbar ist der zuletzt geladene Stand. Eintragen, Verkaufen usw. braucht Internet.
- Beim Abmelden werden die lokal zwischengespeicherten Daten gelöscht.
- Vercel Hobby ist für private, nicht kommerzielle Nutzung gedacht.
