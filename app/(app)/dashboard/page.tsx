'use client'
import { useMemo, useState } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocksRange } from '@/lib/hooks/useBlocksRange'
import { PersonToggle } from '@/components/layout/PersonToggle'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtDur, todayDate, addDays, startOfWeek, formatDate } from '@/lib/utils/time'

type PeriodKey = 'hoje' | 'semana' | 'semana_passada' | 'custom'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'semana_passada', label: 'Semana passada' },
  { key: 'custom', label: 'Personalizado' },
]

function rangeFor(period: PeriodKey, customStart: string, customEnd: string): { start: string; end: string } {
  const today = todayDate()
  switch (period) {
    case 'hoje':
      return { start: today, end: today }
    case 'semana': {
      const start = startOfWeek(today)
      return { start, end: addDays(start, 6) }
    }
    case 'semana_passada': {
      const start = addDays(startOfWeek(today), -7)
      return { start, end: addDays(start, 6) }
    }
    case 'custom':
      return customStart <= customEnd
        ? { start: customStart, end: customEnd }
        : { start: customEnd, end: customStart }
  }
}

export default function DashboardPage() {
  const { activePerson } = useAppStore()
  const [period, setPeriod] = useState<PeriodKey>('hoje')
  const [customStart, setCustomStart] = useState(todayDate())
  const [customEnd, setCustomEnd] = useState(todayDate())

  const { start, end } = rangeFor(period, customStart, customEnd)
  const { blocks, loading } = useBlocksRange(activePerson, start, end)

  const dayCount = useMemo(() => {
    const s = new Date(start + 'T00:00:00').getTime()
    const e = new Date(end + 'T00:00:00').getTime()
    return Math.max(1, Math.round((e - s) / 86400000) + 1)
  }, [start, end])

  const stats = useMemo(() => {
    const active = blocks.filter(b => b.status !== 'skipped')
    const done = blocks.filter(b => b.status === 'done' || b.status === 'partial')
    const totalPlanned = active.reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)
    const totalDone = done.reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)

    const byCategory: Record<string, number> = {}
    for (const b of active) {
      const cat = b.category ?? 'pessoal'
      byCategory[cat] = (byCategory[cat] ?? 0) + (b.actual_duration ?? b.planned_duration ?? 0)
    }

    return {
      done: done.length,
      total: active.length,
      totalPlanned,
      totalDone,
      byCategory,
      houseMin: byCategory['casa'] ?? 0,
    }
  }, [blocks])

  // Janela "acordado" de ~16h/dia (6h–22h) como referência de capacidade
  const dayCapacity = 960 * dayCount
  const filledPct = Math.min(100, Math.round((stats.totalPlanned / dayCapacity) * 100))
  const donePct = Math.min(100, Math.round((stats.totalDone / dayCapacity) * 100))
  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <PersonToggle />
      </div>

      {/* Seletor de período */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-3">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === p.key ? 'bg-accent text-white' : 'bg-surface2 text-muted'
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' ? (
        <div className="flex items-center gap-2 mb-4">
          <input type="date" value={customStart} max={customEnd} onChange={e => setCustomStart(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-surface2 bg-background text-sm focus:outline-none focus:border-accent" />
          <span className="text-muted text-sm">até</span>
          <input type="date" value={customEnd} min={customStart} onChange={e => setCustomEnd(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-surface2 bg-background text-sm focus:outline-none focus:border-accent" />
        </div>
      ) : (
        <p className="text-xs text-muted mb-4">
          {start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`}
          {dayCount > 1 && ` · ${dayCount} dias`}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-48 bg-surface2 rounded-3xl animate-pulse" />
          <div className="h-32 bg-surface2 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Time ring duplo: planejado + concluído */}
          <div className="bg-surface rounded-3xl p-6 mb-4 flex flex-col items-center">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="60" fill="none" stroke="#EDE9E0" strokeWidth="14" />
              <circle cx="80" cy="80" r="60" fill="none"
                stroke="#C4622D30" strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - filledPct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
              <circle cx="80" cy="80" r="60" fill="none"
                stroke="#C4622D" strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - donePct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                className="transition-all duration-700"
              />
              <text x="80" y="74" textAnchor="middle" fill="#1A1714" fontSize="26" fontWeight="bold">{stats.done}/{stats.total}</text>
              <text x="80" y="92" textAnchor="middle" fill="#7A7469" fontSize="11">blocos feitos</text>
              <text x="80" y="106" textAnchor="middle" fill="#C4622D" fontSize="11" fontWeight="bold">{completionPct}%</text>
            </svg>
            <div className="flex gap-4 mt-2 text-xs text-muted">
              <span>⏱ Planejado: <strong className="text-text">{fmtDur(stats.totalPlanned)}</strong></span>
              <span>✓ Feito: <strong className="text-accent">{fmtDur(stats.totalDone)}</strong></span>
            </div>
            {dayCount > 1 && (
              <p className="text-xs text-muted mt-1">média de {fmtDur(Math.round(stats.totalPlanned / dayCount))}/dia planejados</p>
            )}
          </div>

          {/* Distribuição por categoria */}
          <div className="bg-surface rounded-3xl p-5 mb-4">
            <h2 className="font-semibold mb-4">Distribuição {dayCount > 1 ? 'do período' : 'do dia'}</h2>
            {Object.keys(stats.byCategory).length === 0 ? (
              <p className="text-muted text-sm text-center py-4">Nenhum bloco neste período</p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(stats.byCategory) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, min]) => {
                  const cfg = getCategoryConfig(cat)
                  const pct = Math.round((min / (stats.totalPlanned || 1)) * 100)
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium" style={{ color: cfg.tc }}>{cfg.emoji} {cfg.label}</span>
                        <span className="text-muted">{fmtDur(min)} · {pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-surface2">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {stats.houseMin > 0 && (
            <div className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🏠</span>
              <p className="text-sm"><strong>{fmtDur(stats.houseMin)}</strong> de tarefas domésticas {dayCount > 1 ? 'no período' : 'planejadas hoje'}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
