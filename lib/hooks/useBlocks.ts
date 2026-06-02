'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DayBlock } from '@/lib/supabase/types'
import { todayDate } from '@/lib/utils/time'
import { generateDayBlocks } from './generateDayBlocks'

export function useBlocks(profileId: string | null, date?: string) {
  const [blocks, setBlocks] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const targetDate = date ?? todayDate()

  const fetchBlocks = useCallback(async () => {
    if (!profileId) { setLoading(false); return }
    setLoading(true)

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('household_id')
      .eq('id', profileId)
      .single() as { data: { household_id: string | null } | null }

    if (profile?.household_id) {
      await generateDayBlocks(supabase, profile.household_id, profileId, targetDate)
    }

    const { data } = await (supabase as any)
      .from('day_blocks')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', targetDate)
      .order('planned_start') as { data: DayBlock[] | null }

    setBlocks(data ?? [])
    setLoading(false)
  }, [profileId, targetDate, supabase])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const updateBlock = useCallback(async (id: string, updates: Partial<DayBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
    await (supabase as any).from('day_blocks').update(updates).eq('id', id)
  }, [supabase])

  const addBlock = useCallback(async (block: Omit<DayBlock, 'id' | 'created_at'>) => {
    const { data } = await (supabase as any).from('day_blocks').insert(block).select().single() as { data: DayBlock | null }
    if (data) setBlocks(prev => [...prev, data].sort((a, b) =>
      (a.planned_start ?? '').localeCompare(b.planned_start ?? '')
    ))
  }, [supabase])

  const deleteBlock = useCallback(async (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    await (supabase as any).from('day_blocks').delete().eq('id', id)
  }, [supabase])

  return { blocks, loading, updateBlock, addBlock, deleteBlock, refetch: fetchBlocks }
}
