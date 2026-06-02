'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SleepLog } from '@/lib/supabase/types'

export function useSleepRange(profileId: string | null, startDate: string, endDate: string) {
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    if (!profileId) { setLoading(false); return }
    setLoading(true)
    const { data } = await (supabase as any)
      .from('sleep_logs')
      .select('*')
      .eq('profile_id', profileId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date') as { data: SleepLog[] | null }
    setLogs(data ?? [])
    setLoading(false)
  }, [profileId, startDate, endDate, supabase])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, loading }
}
