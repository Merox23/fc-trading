import { describe, expect, it } from 'vitest'
import type { CardVersion, Trade } from '../types'
import { findListedMatch, namesMatch, normalizeName, parseUevText } from './uev'

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
