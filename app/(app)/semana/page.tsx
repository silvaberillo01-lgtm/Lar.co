'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { createClient } from '@/lib/supabase/client'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtDur, formatDate } from '@/lib/utils/time'
import type { DayBlock } from '@/lib/supabase/types'

function getWeekDates(offset = 0) {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function SemanaPage() {
  const { activePerson } = useAppStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [blocks, setBlocks] = useState<DayBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const dates = getWeekDates(weekOffset)

  const fetch = useCallback(async () => {
    if (!activePerson) return
    setLoading(true)
    const { data } = await (supabase as any)
      .from('day_blocks')
      .select('*')
      .eq('profile_id', activePerson)
      .gte('date', dates[0])
      .lte('date', dates[6]) as { data: DayBlock[] | null }
    setBlocks(data ?? [])
    setLoading(false)
  }, [activePerson, dates[0], supabase]) // eslint-disable-line

  useEffect(() => { fetch() }, [fetch])

  const totalMin = blocks.filter(b => b.status === 'done').reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Semana</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 bg-surface2 rounded-full flex items-center justify-center text-sm active:opacity-70">←</button>
          <span className="text-sm font-medium">{formatDate(dates[0])} – {formatDate(dates[6])}</span>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 bg-surface2 rounded-full flex items-center justify-center text-sm active:opacity-70">→</button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
        <span className="text-lg">⏱</span>
        <span className="text-sm">Total: <strong>{fmtDur(totalMin)}</strong> de atividades concluídas</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-surface2 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map(date => {
            const dayBlocks = blocks.filter(b => b.date === date)
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })
            return (
              <div key={date} className="bg-surface rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted capitalize w-8">{dayName}</span>
                  <span className="text-xs text-muted">{formatDate(date)}</span>
                  <span className="ml-auto text-xs text-muted">
                    {fmtDur(dayBlocks.filter(b => b.status === 'done').reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dayBlocks.map(b => {
                    const cat = getCategoryConfig(b.category)
                    return (
                      <span key={b.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: cat.bg, color: cat.tc }}>
                        {cat.emoji} {b.name}
                      </span>
                    )
                  })}
                  {dayBlocks.length === 0 && <span className="text-xs text-muted">Sem atividades</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
