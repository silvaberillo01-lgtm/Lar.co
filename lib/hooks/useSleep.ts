'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SleepLog } from '@/lib/supabase/types'
import { todayDate } from '@/lib/utils/time'

export function useSleep(profileId: string | null, date?: string) {
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const targetDate = date ?? todayDate()

  const fetch = useCallback(async () => {
    if (!profileId) { setLoading(false); return }
    const { data } = await (supabase as any)
      .from('sleep_logs')
      .select('*')
      .eq('profile_id', profileId)
      .eq('date', targetDate)
      .single() as { data: SleepLog | null }
    setSleepLog(data)
    setLoading(false)
  }, [profileId, targetDate, supabase])

  useEffect(() => { fetch() }, [fetch])

  const upsert = useCallback(async (updates: { sleep_time?: string; wake_time?: string; quality?: number }) => {
    if (!profileId) return
    const payload = { profile_id: profileId, date: targetDate, ...updates }
    if (sleepLog) {
      const { data } = await (supabase as any).from('sleep_logs').update(payload).eq('id', sleepLog.id).select().single() as { data: SleepLog | null }
      if (data) setSleepLog(data)
    } else {
      const { data } = await (supabase as any).from('sleep_logs').insert(payload).select().single() as { data: SleepLog | null }
      if (data) setSleepLog(data)
    }
  }, [profileId, targetDate, sleepLog, supabase])

  return { sleepLog, loading, upsert }
}
