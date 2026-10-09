import { describe, expect, it } from 'vitest'
import type { CardVersion, Trade, UevPlayer } from '../types'
import { buildUevCsv, buildUevText } from './csv'

const gold: CardVersion = { id: 'gold', user_id: null, name: 'Gold', color: '#E5B93C' }
const versionById = (id: string | null) => (id === 'gold' ? gold : undefined)
const uev = (p: Partial<UevPlayer>): UevPlayer => ({
  id: 'u', user_id: 'x', player_name: 'X', rating: null, club: '', card_version_id: null, created_at: '', ...p,
})
const rows = [
  { u: uev({ player_name: 'Shaw', rating: 90, club: 'Man United', card_version_id: 'gold' }), match: {} as Trade },
  { u: uev({ player_name: 'Diaz; "Lucho"' }) },
]

describe('ÜV-Export', () => {
  it('baut eine CSV mit Status und escapt Sonderzeichen', () => {
    expect(buildUevCsv(rows, versionById)).toBe(
      '﻿Spieler;Rating;Verein;Version;Status\r\nShaw;90;Man United;Gold;Gekauft\r\n"Diaz; ""Lucho""";;;;Noch kaufen\r\n',
    )
  })
  it('baut eine Textliste zum Teilen', () => {
    expect(buildUevText(rows, versionById)).toBe('✓ Shaw (90 · Gold · Man United)\n○ Diaz; "Lucho"')
  })
})
