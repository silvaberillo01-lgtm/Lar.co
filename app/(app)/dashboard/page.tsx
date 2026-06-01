'use client'
import { useMemo } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { PersonToggle } from '@/components/layout/PersonToggle'
import { getCategoryConfig, CATEGORIES } from '@/lib/utils/categories'
import { fmtDur } from '@/lib/utils/time'
import type { CategoryKey } from '@/lib/utils/categories'

export default function DashboardPage() {
  const { activePerson } = useAppStore()
  const { blocks, loading } = useBlocks(activePerson)

  const stats = useMemo(() => {
    const done = blocks.filter(b => b.status === 'done' || b.status === 'partial')
    const total = blocks.length
    const totalMin = done.reduce((s, b) => s + (b.actual_duration ?? b.planned_duration ?? 0), 0)
    const byCategory: Record<string, number> = {}
    for (const b of done) {
      const cat = b.category ?? 'pessoal'
      byCategory[cat] = (byCategory[cat] ?? 0) + (b.actual_duration ?? b.planned_duration ?? 0)
    }
    const houseMin = byCategory['casa'] ?? 0
    return { done: done.length, total, totalMin, byCategory, houseMin }
  }, [blocks])

  const filledPct = Math.round((stats.totalMin / (16 * 60)) * 100)

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 bg-surface2 rounded-2xl animate-pulse" />
        <div className="h-48 bg-surface2 rounded-3xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <PersonToggle />
      </div>

      {/* Time ring */}
      <div className="bg-surface rounded-3xl p-6 mb-4 flex flex-col items-center">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="60" fill="none" stroke="#EDE9E0" strokeWidth="14" />
          <circle
            cx="80" cy="80" r="60" fill="none"
            stroke="#C4622D" strokeWidth="14"
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - filledPct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
            className="transition-all duration-700"
          />
          <text x="80" y="84" textAnchor="middle" className="text-2xl font-bold" fill="#1A1714" fontSize="28" fontWeight="bold">{filledPct}%</text>
          <text x="80" y="102" textAnchor="middle" fill="#7A7469" fontSize="12">do dia</text>
        </svg>
        <p className="text-sm text-muted mt-2">{fmtDur(stats.totalMin)} de atividade · {stats.done}/{stats.total} blocos</p>
      </div>

      {/* Category bars */}
      <div className="bg-surface rounded-3xl p-5 mb-4">
        <h2 className="font-semibold mb-4">Por categoria</h2>
        <div className="space-y-3">
          {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, min]) => {
            const cfg = getCategoryConfig(cat)
            const pct = Math.round((min / (stats.totalMin || 1)) * 100)
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: cfg.tc }}>{cfg.emoji} {cfg.label}</span>
                  <span className="text-muted">{fmtDur(min)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-surface2">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                </div>
              </div>
            )
          })}
          {Object.keys(stats.byCategory).length === 0 && (
            <p className="text-muted text-sm text-center py-4">Marque blocos como feito para ver os dados</p>
          )}
        </div>
      </div>

      {/* Insight */}
      {stats.houseMin > 0 && (
        <div className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <p className="text-sm"><strong>{fmtDur(stats.houseMin)}</strong> de tarefas domésticas hoje</p>
        </div>
      )}
    </div>
  )
}
