'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DayBlock, RoutineBlock } from '@/lib/supabase/types'
import { todayDate, frequencyMatchesDay } from '@/lib/utils/time'

export function useBlocks(profileId: string | null, date?: string) {
  const [blocks, setBlocks] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const targetDate = date ?? todayDate()

  const generateDayBlocks = useCallback(async (householdId: string, pid: string) => {
    const { data: existing } = await (supabase as any)
      .from('day_blocks')
      .select('routine_block_id')
      .eq('profile_id', pid)
      .eq('date', targetDate) as { data: Array<{ routine_block_id: string | null }> | null }

    const existingRoutineIds = new Set(existing?.map((b: { routine_block_id: string | null }) => b.routine_block_id).filter(Boolean))

    const { data: routines } = await (supabase as any)
      .from('routine_blocks')
      .select('*')
      .eq('household_id', householdId)
      .eq('active', true) as { data: RoutineBlock[] | null }

    if (!routines) return

    const dateObj = new Date(targetDate + 'T00:00:00')
    const toGenerate = routines.filter((r: RoutineBlock) =>
      !existingRoutineIds.has(r.id) &&
      frequencyMatchesDay(r.frequency ?? 'diario', dateObj) &&
      (r.person === 'ambos' || r.person === pid)
    )

    if (toGenerate.length === 0) return

    const inserts = toGenerate.map((r: RoutineBlock) => ({
      household_id: householdId,
      profile_id: pid,
      routine_block_id: r.id,
      name: r.name,
      category: r.category,
      date: targetDate,
      planned_start: r.start_time,
      actual_start: r.start_time,
      planned_duration: r.duration_minutes,
      actual_duration: r.duration_minutes,
      status: 'planejado',
    }))

    await (supabase as any).from('day_blocks').insert(inserts)
  }, [targetDate, supabase])

  const fetchBlocks = useCallback(async () => {
    if (!profileId) { setLoading(false); return }
    setLoading(true)

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('household_id')
      .eq('id', profileId)
      .single() as { data: { household_id: string | null } | null }

    if (profile?.household_id) {
      await generateDayBlocks(profile.household_id, profileId)
    }

    const { data } = await (supabase as any)
      .from('day_blocks')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', targetDate)
      .order('planned_start') as { data: DayBlock[] | null }

    setBlocks(data ?? [])
    setLoading(false)
  }, [profileId, targetDate, supabase, generateDayBlocks])

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
