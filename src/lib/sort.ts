import { profit } from './calc'
import type { Trade } from '../types'

export type ListedSortKey =
  | 'created_desc'
  | 'created_asc'
  | 'buy_desc'
  | 'buy_asc'
  | 'buynow_desc'
  | 'buynow_asc'
  | 'name_asc'

export const LISTED_SORT_OPTIONS: { value: ListedSortKey; label: string }[] = [
  { value: 'created_desc', label: 'Neueste zuerst' },
  { value: 'created_asc', label: 'Älteste zuerst' },
  { value: 'buy_desc', label: 'Einkauf: hoch → niedrig' },
  { value: 'buy_asc', label: 'Einkauf: niedrig → hoch' },
  { value: 'buynow_desc', label: 'Sofortkauf: hoch → niedrig' },
  { value: 'buynow_asc', label: 'Sofortkauf: niedrig → hoch' },
  { value: 'name_asc', label: 'Name (A–Z)' },
]

export function sortListed(trades: Trade[], key: ListedSortKey): Trade[] {
  const list = [...trades]
  switch (key) {
    case 'created_asc':
      return list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    case 'buy_desc':
      return list.sort((a, b) => b.buy_price - a.buy_price)
    case 'buy_asc':
      return list.sort((a, b) => a.buy_price - b.buy_price)
    case 'buynow_desc':
      return list.sort((a, b) => (b.buy_now_price ?? 0) - (a.buy_now_price ?? 0))
    case 'buynow_asc':
      return list.sort((a, b) => (a.buy_now_price ?? 0) - (b.buy_now_price ?? 0))
    case 'name_asc':
      return list.sort((a, b) => a.player_name.localeCompare(b.player_name, 'de'))
    case 'created_desc':
    default:
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
}

export type SoldSortKey = 'sold_desc' | 'sold_asc' | 'price_desc' | 'price_asc' | 'profit_desc' | 'profit_asc' | 'name_asc'

export const SOLD_SORT_OPTIONS: { value: SoldSortKey; label: string }[] = [
  { value: 'sold_desc', label: 'Neueste zuerst' },
  { value: 'sold_asc', label: 'Älteste zuerst' },
  { value: 'price_desc', label: 'Verkaufspreis: hoch → niedrig' },
  { value: 'price_asc', label: 'Verkaufspreis: niedrig → hoch' },
  { value: 'profit_desc', label: 'Gewinn: hoch → niedrig' },
  { value: 'profit_asc', label: 'Gewinn: niedrig → hoch' },
  { value: 'name_asc', label: 'Name (A–Z)' },
]

export function sortSold(trades: Trade[], key: SoldSortKey): Trade[] {
  const list = [...trades]
  switch (key) {
    case 'sold_asc':
      return list.sort((a, b) => (a.sold_at ?? '').localeCompare(b.sold_at ?? ''))
    case 'price_desc':
      return list.sort((a, b) => (b.sold_price ?? 0) - (a.sold_price ?? 0))
    case 'price_asc':
      return list.sort((a, b) => (a.sold_price ?? 0) - (b.sold_price ?? 0))
    case 'profit_desc':
      return list.sort((a, b) => profit(b.sold_price ?? 0, b.buy_price) - profit(a.sold_price ?? 0, a.buy_price))
    case 'profit_asc':
      return list.sort((a, b) => profit(a.sold_price ?? 0, a.buy_price) - profit(b.sold_price ?? 0, b.buy_price))
    case 'name_asc':
      return list.sort((a, b) => a.player_name.localeCompare(b.player_name, 'de'))
    case 'sold_desc':
    default:
      return list.sort((a, b) => (b.sold_at ?? '').localeCompare(a.sold_at ?? ''))
  }
}
