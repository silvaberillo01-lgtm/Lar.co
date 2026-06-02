'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { createClient } from '@/lib/supabase/client'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtDur, formatDate, frequencyMatchesDay } from '@/lib/utils/time'
import type { DayBlock, RoutineBlock } from '@/lib/supabase/types'

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
  const { activePerson, householdId } = useAppStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayBlocks, setDayBlocks] = useState<DayBlock[]>([])
  const [routines, setRoutines] = useState<RoutineBlock[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const dates = getWeekDates(weekOffset)

  const fetchData = useCallback(async () => {
    if (!activePerson || !householdId) return
    setLoading(true)

    const [dbResult, routineResult] = await Promise.all([
      (supabase as any)
        .from('day_blocks')
        .select('*')
        .eq('profile_id', activePerson)
        .gte('date', dates[0])
        .lte('date', dates[6]),
      (supabase as any)
        .from('routine_blocks')
        .select('*')
        .eq('household_id', householdId)
        .eq('active', true),
    ])

    setDayBlocks(dbResult.data ?? [])
    setRoutines(routineResult.data ?? [])
    setLoading(false)
  }, [activePerson, householdId, dates[0]]) // eslint-disable-line

  useEffect(() => { fetchData() }, [fetchData])

  // Para cada dia, mescla day_blocks reais com projeções de rotina
  function getBlocksForDay(date: string) {
    const real = dayBlocks.filter(b => b.date === date)
    const realRoutineIds = new Set(real.map(b => b.routine_block_id).filter(Boolean))

    const dateObj = new Date(date + 'T00:00:00')
    const projected = routines
      .filter(r =>
        !realRoutineIds.has(r.id) &&
        frequencyMatchesDay(r.frequency ?? '', dateObj)
      )
      .map(r => ({
        id: 'proj-' + r.id + '-' + date,
        name: r.name,
        category: r.category,
        status: 'planejado',
        actual_duration: r.duration_minutes,
        planned_duration: r.duration_minutes,
        planned_start: r.start_time,
        actual_start: r.start_time,
      } as DayBlock))

    return [...real, ...projected].sort((a, b) =>
      (a.planned_start ?? '').localeCompare(b.planned_start ?? '')
    )
  }

  const allBlocks = dates.flatMap(d => getBlocksForDay(d))
  const totalMin = allBlocks
    .filter(b => b.status === 'done' || b.status === 'partial')
    .reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)
  const plannedMin = allBlocks
    .filter(b => b.status === 'planejado')
    .reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)

  const today = new Date().toISOString().split('T')[0]

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

      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-surface rounded-2xl px-4 py-3">
          <div className="text-xs text-muted mb-0.5">Concluído</div>
          <div className="font-bold text-sm">{fmtDur(totalMin)}</div>
        </div>
        <div className="flex-1 bg-surface rounded-2xl px-4 py-3">
          <div className="text-xs text-muted mb-0.5">Planejado</div>
          <div className="font-bold text-sm">{fmtDur(plannedMin)}</div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-surface2 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map(date => {
            const dayBlocksForDate = getBlocksForDay(date)
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })
            const isToday = date === today
            return (
              <div key={date}
                className="bg-surface rounded-2xl px-4 py-3"
                style={{ outline: isToday ? '2px solid #C4622D' : 'none' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold capitalize w-8 ${isToday ? 'text-accent' : 'text-muted'}`}>{dayName}</span>
                  <span className="text-xs text-muted">{formatDate(date)}</span>
                  {isToday && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">hoje</span>}
                  <span className="ml-auto text-xs text-muted">
                    {dayBlocksForDate.length} bloco{dayBlocksForDate.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {dayBlocksForDate.map(b => {
                    const cat = getCategoryConfig(b.category)
                    const faded = b.status === 'skipped'
                    return (
                      <span key={b.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: cat.bg,
                          color: cat.tc,
                          opacity: faded ? 0.4 : 1,
                          textDecoration: b.status === 'done' ? 'line-through' : 'none',
                        }}>
                        {cat.emoji} {b.name}
                      </span>
                    )
                  })}
                  {dayBlocksForDate.length === 0 && <span className="text-xs text-muted">Sem atividades</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
