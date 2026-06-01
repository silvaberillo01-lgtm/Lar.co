'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MarketItem } from '@/lib/supabase/types'

export function useMarket(householdId: string | null) {
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    if (!householdId) { setLoading(false); return }
    const { data } = await (supabase as any)
      .from('market_items')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at') as { data: MarketItem[] | null }
    setItems(data ?? [])
    setLoading(false)
  }, [householdId, supabase])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!householdId) return
    const channel = supabase
      .channel('market-' + householdId)
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'market_items',
        filter: `household_id=eq.${householdId}`,
      }, () => { fetch() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [householdId, supabase, fetch])

  const addItem = useCallback(async (name: string, quantity: string, addedBy: string) => {
    const optimistic: MarketItem = {
      id: crypto.randomUUID(),
      household_id: householdId,
      name,
      quantity,
      checked: false,
      added_by: addedBy,
      checked_by: null,
      checked_at: null,
      created_at: new Date().toISOString(),
    }
    setItems(prev => [...prev, optimistic])
    await (supabase as any).from('market_items').insert({ household_id: householdId, name, quantity, added_by: addedBy })
    fetch()
  }, [householdId, supabase, fetch])

  const toggleItem = useCallback(async (id: string, checked: boolean, checkedBy: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked, checked_by: checkedBy, checked_at: checked ? new Date().toISOString() : null } : i))
    await (supabase as any).from('market_items').update({
      checked,
      checked_by: checked ? checkedBy : null,
      checked_at: checked ? new Date().toISOString() : null,
    }).eq('id', id)
  }, [supabase])

  const deleteItem = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await (supabase as any).from('market_items').delete().eq('id', id)
  }, [supabase])

  const clearChecked = useCallback(async () => {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    setItems(prev => prev.filter(i => !i.checked))
    await (supabase as any).from('market_items').delete().in('id', checkedIds)
  }, [items, supabase])

  return { items, loading, addItem, toggleItem, deleteItem, clearChecked }
}
