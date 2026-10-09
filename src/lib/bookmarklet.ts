/**
 * Lesezeichen-Button ("Bookmarklet") für Futbin: läuft im Browser auf der geöffneten Futbin-Seite,
 * liest die Spieler direkt aus der Seite (keine Texterkennung) und öffnet die ÜV-Liste der App
 * mit den Daten im Link (#uev=…). Futbin blockiert das nicht, weil die Seite schon offen ist.
 */

/** Ein Spieler, wie das Lesezeichen ihn von Futbin mitbringt */
export interface FutbinPlayer {
  /** Name, evtl. noch mit Position "Shaw(ST)" */
  n: string
  /** Rating, falls gefunden */
  r: number | null
  /** Verein, falls ein Vereinslogo mit Namen gefunden wurde */
  c: string
  /** CSS-Klassen rund um das Rating (verraten oft die Kartenversion, z. B. "gold rare", "totw") */
  k: string
}

export interface BookmarkletPayload {
  v: 1
  players: FutbinPlayer[]
  /** Fallback ohne erkennbare Spielerzeilen: markierter Text oder Seitentext */
  text?: string
}

/**
 * Liest Spieler aus einer Futbin-Seite. Läuft als Lesezeichen im Browser, deshalb komplett
 * eigenständig: keine Imports, keine Variablen von außen (der Code wird per toString() übertragen).
 * `choose` fragt nach, wenn die Seite mehrere Spielerlisten enthält (z. B. Suchergebnis + eigene Liste).
 */
export function collectFromPage(doc: Document, choose: (question: string) => string | null): BookmarkletPayload | null {
  const PLAYER_LINK = 'a[href*="/player/"]'
  const hrefOf = (a: Element) => (a.getAttribute('href') || '').split(/[?#]/)[0]
  const selection = doc.getSelection ? doc.getSelection() : null
  const selected = selection && !selection.isCollapsed ? selection : null

  // Zu jedem Spielerlink die größte Zeile suchen, die nur diesen einen Spieler enthält
  const rows: Element[] = []
  const links = Array.from(doc.querySelectorAll(PLAYER_LINK))
  for (const a of links) {
    if (selected && !selected.containsNode(a, true)) continue
    const href = hrefOf(a)
    let row: Element = a
    while (row.parentElement && row.parentElement !== doc.body) {
      const inside = Array.from(row.parentElement.querySelectorAll(PLAYER_LINK)).map(hrefOf)
      if (inside.some((h) => h !== href)) break
      row = row.parentElement
    }
    const el = row as HTMLElement
    if (rows.indexOf(row) !== -1 || !(el.offsetWidth || el.offsetHeight)) continue
    rows.push(row)
  }

  if (rows.length === 0) {
    const text = (selected ? selected.toString() : doc.body.innerText).slice(0, 20000)
    return text.trim() ? { v: 1, players: [], text } : null
  }

  // Zeilen nach Liste gruppieren (gleiches Elternelement)
  const groups: Element[][] = []
  for (const r of rows) {
    const g = groups.find((x) => x[0].parentElement === r.parentElement)
    if (g) g.push(r)
    else groups.push([r])
  }

  const parse = (row: Element): FutbinPlayer | null => {
    const el = row as HTMLElement
    const link = row.matches(PLAYER_LINK) ? row : row.querySelector(PLAYER_LINK)
    const lines = el.innerText.split('\n').map((s) => s.trim()).filter(Boolean)
    const linkText = link ? (link as HTMLElement).innerText.trim() : ''
    const name =
      (/\p{L}{2}/u.test(linkText) ? linkText.split('\n')[0] : '') ||
      (link && link.getAttribute('title')) ||
      lines.find((l) => /\p{L}{2}/u.test(l)) ||
      ''
    if (!name) return null

    // Rating: alleinstehende Zahl 40–99 (Preise wie "28K" oder "1,250" zählen nicht)
    let rating: number | null = null
    let ratingEl: Element | null = null
    const walker = doc.createTreeWalker(row, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const t = (node.textContent || '').trim()
      if (/^[4-9]\d$/.test(t)) {
        rating = Number(t)
        ratingEl = node.parentElement
        break
      }
    }

    // Verein: Logo, dessen Bildpfad "club" enthält und das einen Namen trägt
    let club = ''
    for (const img of Array.from(row.querySelectorAll('img'))) {
      const label = (img.getAttribute('title') || img.getAttribute('alt') || '').trim()
      if (/club/i.test(img.getAttribute('src') || '') && label && !/^club$/i.test(label)) {
        club = label
        break
      }
    }

    // Klassen rund um das Rating sammeln, daraus liest die App die Version
    const classes: string[] = []
    for (let e: Element | null = ratingEl, i = 0; e && i < 4 && e !== row.parentElement; e = e.parentElement, i++) {
      classes.push(e.className && typeof e.className === 'string' ? e.className : '')
    }
    return { n: name, r: rating, c: club, k: classes.join(' ').slice(0, 300) }
  }

  let group = groups[0]
  if (groups.length > 1) {
    groups.sort((a, b) => b.length - a.length)
    const names = (g: Element[]) =>
      g
        .slice(0, 3)
        .map((r) => (parse(r) || { n: '?' }).n.split('(')[0].trim())
        .join(', ')
    const answer = choose(
      'Welche Liste übernehmen? Nummer eingeben:\n\n' +
        groups.map((g, i) => `${i + 1}) ${g.length} Spieler: ${names(g)} …`).join('\n'),
    )
    if (answer == null) return null
    group = groups[Number(answer) - 1] || groups[0]
  }

  const players = group.map(parse).filter((p): p is FutbinPlayer => !!p)
  return { v: 1, players }
}

/** Fertiger Lesezeichen-Code für diese App (Adresse der App wird eingebaut) */
export function bookmarkletCode(appOrigin: string): string {
  const src =
    `(function(o){var p=(${collectFromPage.toString()})(document,function(q){return prompt(q)});` +
    `if(!p){alert('Keine Spieler gefunden.');return}` +
    `var u=o+'/mehr/uev#uev='+encodeURIComponent(JSON.stringify(p));` +
    `if(!window.open(u,'_blank'))location.href=u})(${JSON.stringify(appOrigin)})`
  return 'javascript:' + encodeURIComponent(src)
}

/** Daten aus dem Link (#uev=…) lesen, die das Lesezeichen mitgeschickt hat */
export function readPayloadFromHash(hash: string): BookmarkletPayload | null {
  if (!hash.startsWith('#uev=')) return null
  try {
    const p = JSON.parse(decodeURIComponent(hash.slice(5))) as BookmarkletPayload
    return p && p.v === 1 && Array.isArray(p.players) ? p : null
  } catch {
    return null
  }
}
