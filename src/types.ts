export type Status = 'listed' | 'sold'
export type SoldType = 'buy_now' | 'bid'

export interface CardVersion {
  id: string
  user_id: string | null // null = Standardversion für alle
  name: string
  color: string
}

export interface Trade {
  id: string
  user_id: string
  player_name: string
  card_version_id: string | null
  rating: number | null
  chemstyle: string
  buy_price: number
  bid_price: number | null
  buy_now_price: number | null
  status: Status
  sold_price: number | null
  sold_type: SoldType | null
  sold_at: string | null
  created_at: string
}

export type TradeInput = Pick<
  Trade,
  'player_name' | 'card_version_id' | 'rating' | 'chemstyle' | 'buy_price' | 'bid_price' | 'buy_now_price'
>

/** Eintrag der ÜV-Liste: ein Spieler, den du einkaufen und überteuert anbieten willst */
export interface UevPlayer {
  id: string
  user_id: string
  player_name: string
  rating: number | null
  club: string
  card_version_id: string | null
  created_at: string
}

export type UevInput = Pick<UevPlayer, 'player_name' | 'rating' | 'club' | 'card_version_id'>
