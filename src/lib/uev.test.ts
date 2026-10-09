import { describe, expect, it } from 'vitest'
import type { CardVersion, Trade } from '../types'
import ocrEng from './__fixtures__/futbin-ocr.txt?raw'
import ocrEngDeu from './__fixtures__/futbin-ocr-deu.txt?raw'
import { correctName, findListedMatch, fromFutbin, namesMatch, normalizeName, parseUevText } from './uev'

const v = (id: string, name: string): CardVersion => ({ id, user_id: null, name, color: '#000000' })
const VERSIONS = [v('gold', 'Gold'), v('icon', 'Icon'), v('hero', 'Hero'), v('totw', 'Team of the Week')]

function trade(p: Partial<Trade>): Trade {
  return {
    id: 't', user_id: 'u', player_name: 'X', card_version_id: null, rating: null, chemstyle: 'Keiner',
    buy_price: 1000, bid_price: null, buy_now_price: null, status: 'listed', sold_price: null,
    sold_type: null, sold_at: null, created_at: '2026-10-01T00:00:00Z', ...p,
  }
}

describe('Namen vergleichen', () => {
  it('ignoriert Akzente und Groß-/Kleinschreibung', () => {
    expect(normalizeName('Kylian Mbappé')).toBe('kylian mbappe')
    expect(normalizeName('Martin Ødegaard')).toBe('martin odegaard')
    expect(namesMatch('MBAPPE', 'Mbappé')).toBe(true)
  })
  it('erkennt Kurzformen mit gleichem Nachnamen', () => {
    expect(namesMatch('Mbappé', 'Kylian Mbappé')).toBe(true)
    expect(namesMatch('K. Mbappé', 'Kylian Mbappé')).toBe(true)
    expect(namesMatch('Ethan Mbappé', 'Kylian Mbappé')).toBe(false)
    expect(namesMatch('Kylian', 'Kylian Mbappé')).toBe(false)
  })
})

describe('Abgleich mit Angeboten', () => {
  const uev = { player_name: 'Mbappé', rating: 91, card_version_id: 'gold' }
  it('markiert nur offene Angebote als gekauft', () => {
    expect(findListedMatch(uev, [trade({ player_name: 'Kylian Mbappé', rating: 91, card_version_id: 'gold' })])).toBeTruthy()
    expect(findListedMatch(uev, [trade({ player_name: 'Mbappé', rating: 91, status: 'sold' })])).toBeUndefined()
  })
  it('unterscheidet Rating und Version', () => {
    expect(findListedMatch(uev, [trade({ player_name: 'Mbappé', rating: 95 })])).toBeUndefined()
    expect(findListedMatch(uev, [trade({ player_name: 'Mbappé', card_version_id: 'totw' })])).toBeUndefined()
  })
  it('lässt fehlendes Rating oder fehlende Version durchgehen', () => {
    expect(findListedMatch(uev, [trade({ player_name: 'Mbappé' })])).toBeTruthy()
    expect(findListedMatch({ ...uev, rating: null, card_version_id: null }, [trade({ player_name: 'Mbappé', rating: 88 })])).toBeTruthy()
  })
})

describe('Liste auslesen', () => {
  it('liest Spalten mit Tab oder Semikolon', () => {
    expect(parseUevText('Kylian Mbappé\t91\tReal Madrid\tTOTW\nHaaland; 90; Gold; Manchester City', VERSIONS)).toEqual([
      { player_name: 'Kylian Mbappé', rating: 91, club: 'Real Madrid', card_version_id: 'totw' },
      { player_name: 'Haaland', rating: 90, club: 'Manchester City', card_version_id: 'gold' },
    ])
  })
  it('liest freie Zeilen und ignoriert Position und Preise', () => {
    expect(parseUevText('FUTBIN Players\nMbappé 91 ST 1,250,000\nVirgil van Dijk CB 89 Icon 45K', VERSIONS)).toEqual([
      { player_name: 'Mbappé', rating: 91, club: '', card_version_id: null },
      { player_name: 'Virgil van Dijk', rating: 89, club: '', card_version_id: 'icon' },
    ])
  })
  it('liest echte Texterkennung eines Futbin-ähnlichen Screenshots', () => {
    // Ausgabe von Tesseract.js für eine Tabelle mit Name, Verein darunter, Rating, Position, Version, Preis
    const ocr = [
      'Name Rating Pos Version PS',
      'Kylian Mbappé',
      '',
      'Real Madrid 91 ST TOTW 1.25M',
      'Erling Haaland 91 ST Gold Rare 420K',
      'Manchester City',
      '',
      'Martin @degaard 87 CAM Hero SET',
      'Arsenal',
      '',
      'Virgil van Dijk 89 CB —- 45K',
      'Liverpool',
    ].join('\n')
    expect(parseUevText(ocr, VERSIONS)).toEqual([
      { player_name: 'Kylian Mbappé', rating: 91, club: 'Real Madrid', card_version_id: 'totw' },
      { player_name: 'Erling Haaland', rating: 91, club: 'Manchester City', card_version_id: 'gold' },
      { player_name: 'Martin Ødegaard', rating: 87, club: 'Arsenal', card_version_id: 'hero' },
      { player_name: 'Virgil van Dijk', rating: 89, club: 'Liverpool', card_version_id: null },
    ])
  })
  it('führt Name und Rating aus zwei Zeilen zusammen', () => {
    expect(parseUevText('Martin Ødegaard\n87\nHero', VERSIONS)).toEqual([
      { player_name: 'Martin Ødegaard', rating: 87, club: '', card_version_id: null },
    ])
  })
  it('nimmt eine reine Namensliste, wenn nirgends ein Rating steht', () => {
    expect(parseUevText('Mbappé\nHaaland\nMbappe', VERSIONS).map((p) => p.player_name)).toEqual(['Mbappé', 'Haaland'])
  })
})

describe('echter Futbin-Screenshot (Dark Mode, PC, 464 px breit)', () => {
  // Tatsächliche Ausgabe der Texterkennung (eng bzw. eng+deu) nach dem Aufbereiten in ocr.ts
  const PLAYERS = 'Shaw,Bruno Fernandes,Diaz,Banda,Kimmich,Hasegawa,Ona Batlle,Debinha,Marquinhos,Salah,Miedema,Hemp,Rodman,Martinez,Barella,Lavelle,Wirtz,Katoto,Carnesecchi,Gvardiol,Dybala,Laimer,Semenyo,Cascarino,Osimhen,Palmer,Svilar,Thuram,Rabiot,Kerolin Nicoli'.split(',')

  for (const [label, text] of [['eng', ocrEng], ['eng+deu', ocrEngDeu]]) {
    it(`findet die meisten Spieler (${label})`, () => {
      const names = parseUevText(text, VERSIONS).map(
        (p) => p.player_name,
      )
      // mit den eigenen Trades als Wörterbuch werden Lesefehler korrigiert
      const fixed = names.map((n) => correctName(n, PLAYERS) ?? n)
      const found = PLAYERS.filter((p) => fixed.some((n) => namesMatch(n, p)))
      expect(found.length).toBeGreaterThanOrEqual(26)
      expect(names.length - found.length).toBeLessThanOrEqual(6) // wenige Symbol-Reste, in der Vorschau löschbar
      expect(names).not.toContain('Order By RAT POS VER Console Frice')
    })
  }

  it('korrigiert Lesefehler nur mit ähnlichen bekannten Namen', () => {
    expect(correctName('Osimben', PLAYERS)).toBe('Osimhen')
    expect(correctName('Rablot', PLAYERS)).toBe('Rabiot')
    expect(correctName('Kerolln Nicoll', PLAYERS)).toBe('Kerolin Nicoli')
    expect(correctName('Shaw', PLAYERS)).toBeNull() // schon richtig
    expect(correctName('Mbappé', PLAYERS)).toBeNull() // nichts Ähnliches
  })
})

describe('Futbin-Lesezeichen', () => {
  it('entfernt die Position, ordnet die Version zu und überspringt Doppelte', () => {
    expect(
      fromFutbin(
        [
          { n: 'Shaw(ST)', r: 90, c: 'Manchester United', k: 'rating card-gold-rare' },
          { n: 'Bruno Fernandes (CAM)', r: 89, c: '', k: 'ut-totw' },
          { n: 'Shaw(ST)', r: 90, c: '', k: 'rating card-gold-rare' },
          { n: '(GK)', r: 85, c: '', k: '' },
        ],
        VERSIONS,
      ),
    ).toMatchObject([
      { player_name: 'Shaw', rating: 90, club: 'Manchester United', card_version_id: 'gold' },
      { player_name: 'Bruno Fernandes', rating: 89, club: '', card_version_id: 'totw' },
    ])
  })
  it('nimmt die früher gewählte Version für denselben Karten-Fingerabdruck', () => {
    const [first] = fromFutbin([{ n: 'Shaw(ST)', r: 90, c: '', k: 'badge fg:rgb(60, 45, 10) c12345.png' }], VERSIONS)
    expect(first.card_version_id).toBeNull()
    const learned = { [first.futbinKey!]: 'hero' }
    // gleicher Fingerabdruck, nur eine andere lange Nummer im Bildnamen
    const [again] = fromFutbin([{ n: 'Banda(ST)', r: 88, c: '', k: 'badge fg:rgb(60, 45, 10) c67890.png' }], VERSIONS, learned)
    expect(again.card_version_id).toBe('hero')
    expect(fromFutbin([{ n: 'X', r: 80, c: '', k: 'other' }], VERSIONS, learned)[0].card_version_id).toBeNull()
  })
})
