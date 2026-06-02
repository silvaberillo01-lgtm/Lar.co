'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DayBlock } from '@/lib/supabase/types'
import { todayDate } from '@/lib/utils/time'
import { generateDayBlocks } from './generateDayBlocks'

// Busca os day_blocks de um perfil num intervalo de datas (inclusive).
// Se o dia de hoje estiver no intervalo, garante a geração das rotinas de hoje.
export function useBlocksRange(profileId: string | null, startDate: string, endDate: string) {
  const [blocks, setBlocks] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBlocks = useCallback(async () => {
    if (!profileId) { setLoading(false); return }
    setLoading(true)

    const today = todayDate()
    if (today >= startDate && today <= endDate) {
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('household_id')
        .eq('id', profileId)
        .single() as { data: { household_id: string | null } | null }
      if (profile?.household_id) {
        await generateDayBlocks(supabase, profile.household_id, profileId, today)
      }
    }

    const { data } = await (supabase as any)
      .from('day_blocks')
      .select('*')
      .eq('profile_id', profileId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('planned_start') as { data: DayBlock[] | null }

    setBlocks(data ?? [])
    setLoading(false)
  }, [profileId, startDate, endDate, supabase])

  useEffect(() => { fetchBlocks() }, [fetchBlocks])

  return { blocks, loading, refetch: fetchBlocks }
}
