import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../lib/timeout'
import type { UevInput, UevPlayer } from '../types'

const TIMEOUT_MSG = 'Keine Antwort vom Server. Bitte später erneut versuchen.'

/** ÜV-Liste laden und bearbeiten. Wird nur auf der ÜV-Seite gebraucht, deshalb nicht im DataProvider. */
export function useUev(userId: string) {
  const [list, setList] = useState<UevPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.from('uev_players').select('*').order('created_at', { ascending: false }).order('id'),
        20000,
        TIMEOUT_MSG,
      )
      if (error) throw error
      setList(data as UevPlayer[])
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    list,
    loading,
    error,
    refresh,
    async addMany(items: UevInput[]) {
      if (items.length === 0) return
      const { data, error } = await withTimeout(
        supabase.from('uev_players').insert(items.map((i) => ({ ...i, user_id: userId }))).select(),
        20000,
        TIMEOUT_MSG,
      )
      if (error) throw error
      setList((l) => [...(data as UevPlayer[]), ...l])
    },
    async update(id: string, i: UevInput) {
      const { data, error } = await withTimeout(
        supabase.from('uev_players').update(i).eq('id', id).select().single(),
        20000,
        TIMEOUT_MSG,
      )
      if (error) throw error
      setList((l) => l.map((u) => (u.id === id ? (data as UevPlayer) : u)))
    },
    async remove(ids: string[]) {
      const { error } = await withTimeout(supabase.from('uev_players').delete().in('id', ids), 20000, TIMEOUT_MSG)
      if (error) throw error
      setList((l) => l.filter((u) => !ids.includes(u.id)))
    },
  }
}
