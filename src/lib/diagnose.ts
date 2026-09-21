/** Verbindungstest für die Anmeldeseite: zeigt, woran es liegt, wenn die Anmeldung nicht klappt. */
export async function diagnose(): Promise<string[]> {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? '')
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '')
  const out: string[] = []

  const odd = (s: string) => [...s].filter((c) => c.charCodeAt(0) < 33 || c.charCodeAt(0) > 126).length

  out.push(`Adresse: ${url || '(leer)'}`)
  out.push(`Adresse ohne Sonderzeichen: ${odd(url) === 0 ? 'ja' : 'NEIN (' + odd(url) + ' ungültig)'}`)
  out.push(`Key: ${key.slice(0, 15)}... (${key.length} Zeichen)`)
  out.push(`Key ohne Sonderzeichen: ${odd(key) === 0 ? 'ja' : 'NEIN (' + odd(key) + ' ungültig)'}`)

  async function probe(label: string, path: string, init: RequestInit = {}) {
    const t0 = Date.now()
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 12000)
    try {
      const r = await fetch(url + path, { ...init, signal: ctl.signal })
      out.push(`${label}: HTTP ${r.status} (${Date.now() - t0} ms)`)
    } catch (e) {
      const name = (e as Error).name === 'AbortError' ? 'keine Antwort nach 12 s' : `Fehler "${(e as Error).message}"`
      out.push(`${label}: ${name} (${Date.now() - t0} ms)`)
    } finally {
      clearTimeout(timer)
    }
  }

  await probe('Test 1, einfache Anfrage', '/auth/v1/health')
  await probe('Test 2, mit Key', '/auth/v1/settings', { headers: { apikey: key } })
  await probe('Test 3, Anmelde-Anfrage mit Testdaten', '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.invalid', password: 'x' }),
  })
  return out
}
