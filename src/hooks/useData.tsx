import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/timeout'
import { DEFAULT_VERSION_ORDER } from '../constants'
import type { CardVersion, SoldType, Trade, TradeInput } from '../types'

const CACHE_PREFIX = 'fc-cache-v1:'

interface Cache {
  trades: Trade[]
  versions: CardVersion[]
}

function readCache(key: string): Cache | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Cache) : null
  } catch {
    return null
  }
}

function writeCache(key: string, data: Cache) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Speicher voll: nur offene Angebote und die neuesten 500 Verkäufe behalten
    try {
      const sold = data.trades.filter((t) => t.status === 'sold').slice(0, 500)
      const listed = data.trades.filter((t) => t.status === 'listed')
      localStorage.setItem(key, JSON.stringify({ trades: [...listed, ...sold], versions: data.versions }))
    } catch {
      /* Offline-Cache ist optional */
    }
  }
}

/** Beim Abmelden alle lokal gespeicherten Daten entfernen */
export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignorieren */
  }
}

// Supabase liefert max. 1000 Zeilen pro Anfrage, deshalb seitenweise laden.
async function fetchAll<T>(table: 'trades' | 'card_versions'): Promise<T[]> {
  const out: T[] = []
  const size = 1000
  for (let from = 0; ; from += size) {
    const q = supabase.from(table).select('*')
    const { data, error } = await withTimeout(
      table === 'trades'
        ? q.order('created_at', { ascending: false }).order('id').range(from, from + size - 1)
        : q.order('name').range(from, from + size - 1),
      20000,
      'Keine Antwort vom Server. Bitte später erneut versuchen.',
    )
    if (error) throw error
    out.push(...(data as T[]))
    if (data.length < size) break
  }
  return out
}

function sortVersions(list: CardVersion[]): CardVersion[] {
  const rank = (v: CardVersion) => {
    if (v.user_id !== null) return 1000
    const i = DEFAULT_VERSION_ORDER.indexOf(v.name)
    return i === -1 ? 999 : i
  }
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'de'))
}

interface DataCtx {
  trades: Trade[]
  versions: CardVersion[]
  versionById: (id: string | null) => CardVersion | undefined
  loading: boolean
  offline: boolean
  refresh: () => Promise<void>
  addTrade: (i: TradeInput) => Promise<void>
  updateTrade: (id: string, i: TradeInput) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  sellTrade: (id: string, price: number, type: SoldType) => Promise<void>
  undoSale: (id: string) => Promise<void>
  addVersion: (name: string, color: string) => Promise<void>
  updateVersion: (id: string, name: string, color: string) => Promise<void>
  deleteVersion: (id: string) => Promise<void>
}

const Ctx = createContext<DataCtx | null>(null)

export function DataProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const cacheKey = CACHE_PREFIX + userId
  const [initial] = useState(() => readCache(cacheKey))
  const [trades, setTrades] = useState<Trade[]>(initial?.trades ?? [])
  const [versions, setVersions] = useState<CardVersion[]>(sortVersions(initial?.versions ?? []))
  const [loading, setLoading] = useState(!initial)
  const [offline, setOffline] = useState(false)
  const lastLoad = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const [t, v] = await Promise.all([fetchAll<Trade>('trades'), fetchAll<CardVersion>('card_versions')])
      setTrades(t)
      setVersions(sortVersions(v))
      setOffline(false)
      lastLoad.current = Date.now()
    } catch {
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Beim Start laden und wieder, wenn die App nach >60 s zurück in den Vordergrund kommt
  useEffect(() => {
    void refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad.current > 60_000) void refresh()
    }
    const onOnline = () => void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [refresh])

  // Letzten Stand lokal merken, damit er offline sichtbar ist
  useEffect(() => {
    if (lastLoad.current > 0) writeCache(cacheKey, { trades, versions })
  }, [trades, versions, cacheKey])

  const versionMap = useMemo(() => new Map(versions.map((v) => [v.id, v])), [versions])
  const versionById = useCallback((id: string | null) => (id ? versionMap.get(id) : undefined), [versionMap])

  async function patchTrade(id: string, patch: Partial<Trade>) {
    const { data, error } = await withTimeout(
      supabase.from('trades').update(patch).eq('id', id).select().single(),
      20000,
      'Keine Antwort vom Server. Bitte später erneut versuchen.',
    )
    if (error) throw error
    setTrades((list) => list.map((t) => (t.id === id ? (data as Trade) : t)))
  }

  const value: DataCtx = {
    trades,
    versions,
    versionById,
    loading,
    offline,
    refresh,
    async addTrade(i) {
      const { data, error } = await withTimeout(
        supabase.from('trades').insert({ ...i, user_id: userId }).select().single(),
        20000,
        'Keine Antwort vom Server. Bitte später erneut versuchen.',
      )
      if (error) throw error
      setTrades((list) => [data as Trade, ...list])
    },
    updateTrade: (id, i) => patchTrade(id, i),
    async deleteTrade(id) {
      const { error } = await withTimeout(
        supabase.from('trades').delete().eq('id', id),
        20000,
        'Keine Antwort vom Server. Bitte später erneut versuchen.',
      )
      if (error) throw error
      setTrades((list) => list.filter((t) => t.id !== id))
    },
    sellTrade: (id, price, type) =>
      patchTrade(id, { status: 'sold', sold_price: price, sold_type: type, sold_at: new Date().toISOString() }),
    undoSale: (id) => patchTrade(id, { status: 'listed', sold_price: null, sold_type: null, sold_at: null }),
    async addVersion(name, color) {
      const { data, error } = await withTimeout(
        supabase.from('card_versions').insert({ user_id: userId, name, color }).select().single(),
        20000,
        'Keine Antwort vom Server. Bitte später erneut versuchen.',
      )
      if (error) throw error
      setVersions((list) => sortVersions([...list, data as CardVersion]))
    },
    async updateVersion(id, name, color) {
      const { data, error } = await withTimeout(
        supabase.from('card_versions').update({ name, color }).eq('id', id).select().single(),
        20000,
        'Keine Antwort vom Server. Bitte später erneut versuchen.',
      )
      if (error) throw error
      setVersions((list) => sortVersions(list.map((v) => (v.id === id ? (data as CardVersion) : v))))
    },
    async deleteVersion(id) {
      const { error } = await withTimeout(
        supabase.from('card_versions').delete().eq('id', id),
        20000,
        'Keine Antwort vom Server. Bitte später erneut versuchen.',
      )
      if (error) throw error
      setVersions((list) => list.filter((v) => v.id !== id))
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData(): DataCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData außerhalb von DataProvider')
  return c
}
