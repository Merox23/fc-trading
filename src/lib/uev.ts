import type { CardVersion, Trade, UevInput, UevPlayer } from '../types'

// Buchstaben, die NFD nicht zerlegt (z. B. Ø in "Ødegaard")
const SPECIAL: Record<string, string> = { ø: 'o', ł: 'l', đ: 'd', ß: 'ss', æ: 'ae', œ: 'oe', ı: 'i', þ: 'th' }

/** Name vergleichbar machen: klein, ohne Akzente und Satzzeichen ("Mbappé" = "mbappe") */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[øłđßæœıþ]/g, (c) => SPECIAL[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Gleicher Spieler? Exakt gleich oder ein Name ist eine Kurzform des anderen mit gleichem
 * Nachnamen ("Mbappé" = "Kylian Mbappé", "K. Mbappé" = "Kylian Mbappé").
 */
export function namesMatch(a: string, b: string): boolean {
  const x = normalizeName(a)
  const y = normalizeName(b)
  if (!x || !y) return false
  if (x === y) return true
  const ta = x.split(' ')
  const tb = y.split(' ')
  if (ta[ta.length - 1] !== tb[tb.length - 1]) return false
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  // jedes Wort der Kurzform kommt im langen Namen vor, einzelne Buchstaben gelten als Initiale
  return short.every((w) => long.some((l) => l === w || (w.length === 1 && l.startsWith(w))))
}

/** Passt ein Trade zum ÜV-Eintrag? Rating und Version zählen nur, wenn beide Seiten sie haben. */
export function matchesTrade(u: Pick<UevPlayer, 'player_name' | 'rating' | 'card_version_id'>, t: Trade): boolean {
  if (u.rating != null && t.rating != null && u.rating !== t.rating) return false
  if (u.card_version_id && t.card_version_id && u.card_version_id !== t.card_version_id) return false
  return namesMatch(u.player_name, t.player_name)
}

/** Offenes Angebot, das zum ÜV-Eintrag passt. Verkaufte Spieler zählen nicht, die kannst du nachkaufen. */
export function findListedMatch(
  u: Pick<UevPlayer, 'player_name' | 'rating' | 'card_version_id'>,
  trades: Trade[],
): Trade | undefined {
  return trades.find((t) => t.status === 'listed' && matchesTrade(u, t))
}

/** Gleicher Eintrag schon in der ÜV-Liste? (Name, Rating und Version gleich) */
export function isSameUev(a: UevInput, b: UevInput): boolean {
  return (
    normalizeName(a.player_name) === normalizeName(b.player_name) &&
    (a.rating ?? null) === (b.rating ?? null) &&
    (a.card_version_id ?? null) === (b.card_version_id ?? null)
  )
}

// ---------------------------------------------------------------------------
// Text aus Screenshot (Texterkennung) oder kopierter Futbin-Tabelle auslesen

// Futbin-Bezeichnungen, die anders heißen als die Versionen in der App
const VERSION_ALIASES: Record<string, string> = {
  totw: 'Team of the Week',
  inform: 'Team of the Week',
  'if': 'Team of the Week',
  icons: 'Icon',
  ikone: 'Icon',
  heroes: 'Hero',
  rare: 'Gold',
  'gold rare': 'Gold',
}

const POSITIONS = new Set(
  'GK LB LWB CB RB RWB CDM CM CAM LM RM LW RW CF ST TW IV LV RV ZDM ZM ZOM LF RF MS'.split(' '),
)

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Sucht eine Version im Text, längste Namen zuerst ("Team of the Week" vor "Team") */
function findVersion(text: string, versions: CardVersion[]): { id: string; match: string } | null {
  const candidates: { label: string; name: string }[] = [
    ...versions.map((v) => ({ label: v.name, name: v.name })),
    ...Object.entries(VERSION_ALIASES).map(([label, name]) => ({ label, name })),
  ].sort((a, b) => b.label.length - a.label.length)
  for (const c of candidates) {
    const m = new RegExp(`(^|[^\\p{L}])(${escapeRe(c.label)})(?=$|[^\\p{L}])`, 'iu').exec(text)
    if (!m) continue
    const v = versions.find((x) => x.name.toLowerCase() === c.name.toLowerCase())
    if (v) return { id: v.id, match: m[2] }
  }
  return null
}

/** Rating = alleinstehende Zahl 40–99, aber keine Preise wie "45,000" oder "45K" */
const RATING_RE = /(?<![\d.,])([4-9]\d)(?![\d]|[.,]\d|\s?[kKmM]\b)/

function cleanName(s: string): string {
  const words = s
    // Texterkennung liest Ø gern als @ ("@degaard")
    .replace(/@(?=\p{L})/gu, 'Ø')
    .replace(/[^\p{L}\s'.-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !POSITIONS.has(w.toUpperCase()) && /\p{L}/u.test(w))
  // Reste aus anderen Spalten ("Martin Ødegaard SET") am Ende weglassen, wenn der Name sonst normal geschrieben ist
  while (words.length > 1 && /^\p{Lu}{2,4}$/u.test(words[words.length - 1]) && words.some((w) => /\p{Ll}/u.test(w))) words.pop()
  return words.join(' ').replace(/^[\s'.-]+|[\s'.-]+$/g, '')
}

// Überschriften und Menüpunkte aus Screenshots, keine Spieler
const HEADER_RE = /\b(name|rating|ovr|pos|position|version|price|preis|players|spieler|futbin|club|verein|nation|liga|league)\b/i

const hasLetters = (s: string) => (s.match(/\p{L}/gu) ?? []).length >= 2

/** Eine Zeile mit Trennzeichen ("Name; 91; Real Madrid; TOTW") Feld für Feld lesen */
function parseFields(fields: string[], versions: CardVersion[]): UevInput | null {
  let rating: number | null = null
  let versionId: string | null = null
  const rest: string[] = []
  for (const raw of fields) {
    const f = raw.trim()
    if (!f) continue
    if (rating == null && /^[4-9]\d$/.test(f)) {
      rating = Number(f)
      continue
    }
    if (/^[\d\s.,kKmM]+$/.test(f) || POSITIONS.has(f.toUpperCase())) continue
    const v: { id: string; match: string } | null = versionId ? null : findVersion(f, versions)
    if (v && v.match.length >= f.length - 1) {
      versionId = v.id
      continue
    }
    rest.push(f)
  }
  const name = cleanName(rest[0] ?? '')
  if (!hasLetters(name)) return null
  return { player_name: name, rating, club: rest.slice(1).join(' ').trim(), card_version_id: versionId }
}

/** Freie Zeile (Texterkennung): Rating und Version heraussuchen, der Rest ist der Name */
function parseLoose(line: string, versions: CardVersion[]): { name: string; rating: number | null; versionId: string | null } {
  let text = line
  let rating: number | null = null
  const r = RATING_RE.exec(text)
  if (r) {
    rating = Number(r[1])
    text = text.slice(0, r.index) + ' ' + text.slice(r.index + r[1].length)
  }
  const v = findVersion(text, versions)
  if (v) text = text.replace(new RegExp(escapeRe(v.match), 'i'), ' ')
  // alles ab der ersten Preisangabe weglassen
  text = text.replace(/\d[\d.,]*\s?[kKmM]?\b.*$/, '')
  return { name: cleanName(text), rating, versionId: v?.id ?? null }
}

/**
 * Macht aus Text (Texterkennung oder eingefügt) eine Liste von Spielern.
 * Zeilen mit Tab, Semikolon oder "|" werden als Spalten gelesen (Name, Rating, Verein, Version),
 * sonst wird pro Zeile Name + Rating + Version gesucht. Typische Screenshot-Layouts:
 * - Name und Rating in einer Zeile, Verein in der Zeile darunter
 * - Name allein, darunter Verein + Rating (dann ist der Text in der Rating-Zeile der Verein)
 * - Name allein, darunter nur das Rating
 * Zeilen ohne Rating, die keinem Spieler zugeordnet werden können (Überschriften, Menüs),
 * fallen weg, außer der ganze Text enthält gar kein Rating (reine Namensliste).
 */
export function parseUevText(text: string, versions: CardVersion[]): UevInput[] {
  const out: UevInput[] = []
  const namesOnly: UevInput[] = []
  let pending: { name: string; versionId: string | null } | null = null
  // letzter Spieler, dessen Name in derselben Zeile wie das Rating stand: die Zeile darunter ist sein Verein
  let clubFor: UevInput | null = null
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (/[\t;|]/.test(line)) {
      pending = null
      clubFor = null
      const p = parseFields(line.split(/[\t;|]/), versions)
      if (p) out.push(p)
      continue
    }
    const { name, rating, versionId } = parseLoose(line, versions)
    if (rating == null && HEADER_RE.test(line)) continue
    const okName = hasLetters(name)
    if (okName) namesOnly.push({ player_name: name, rating: null, club: '', card_version_id: versionId })

    if (okName && rating != null && pending) {
      out.push({ player_name: pending.name, rating, club: name, card_version_id: versionId ?? pending.versionId })
      pending = null
      clubFor = null
    } else if (okName && rating != null) {
      clubFor = { player_name: name, rating, club: '', card_version_id: versionId }
      out.push(clubFor)
    } else if (okName && clubFor) {
      clubFor.club = name
      clubFor = null
    } else if (okName) {
      pending = { name, versionId }
    } else if (rating != null && pending) {
      out.push({ player_name: pending.name, rating, club: '', card_version_id: versionId ?? pending.versionId })
      pending = null
    } else if (versionId && pending) {
      pending.versionId = versionId
    }
  }

  const list = out.length > 0 ? out : namesOnly
  // doppelte Zeilen nur einmal übernehmen
  return list.filter((p, i) => list.findIndex((q) => isSameUev(p, q)) === i)
}
