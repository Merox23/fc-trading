/** Macht aus technischen Fehlern verständliche deutsche Meldungen. */
export function errMsg(e: unknown): string {
  const m = (e as { message?: string } | null)?.message ?? String(e)
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return `Keine Verbindung (${m}). Bitte später erneut versuchen.`
  if (/Invalid login credentials/i.test(m)) return 'E-Mail oder Passwort falsch.'
  if (/Email not confirmed/i.test(m)) return 'Bitte zuerst die E-Mail-Adresse bestätigen.'
  if (/Signups not allowed|signup.*disabled/i.test(m)) return 'Die Registrierung ist derzeit deaktiviert.'
  if (/rate limit|too many/i.test(m)) return 'Zu viele Versuche. Bitte kurz warten.'
  if (/different from the old/i.test(m)) return 'Das neue Passwort muss sich vom alten unterscheiden.'
  if (/at least \d+ characters|weak/i.test(m)) return 'Das Passwort ist zu kurz oder zu schwach.'
  if (/foreign key/i.test(m)) return 'Wird noch verwendet und kann nicht gelöscht werden.'
  if (/already registered/i.test(m)) return 'Diese E-Mail-Adresse ist schon registriert.'
  return m
}
