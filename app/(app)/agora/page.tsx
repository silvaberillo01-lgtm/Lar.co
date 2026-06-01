'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { EditBlockSheet } from '@/components/blocks/EditBlockSheet'
import { SleepBar } from '@/components/sleep/SleepBar'
import { PersonToggle } from '@/components/layout/PersonToggle'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtTime, fmtDur, blockEndTime, blockProgress, isBlockActive, isBlockPast } from '@/lib/utils/time'
import type { DayBlock } from '@/lib/supabase/types'

export default function AgoraPage() {
  const { activePerson } = useAppStore()
  const { blocks, loading, updateBlock } = useBlocks(activePerson)
  const [editBlock, setEditBlock] = useState<DayBlock | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const activeBlock = blocks.find(b =>
    b.status !== 'skipped' &&
    isBlockActive(b.actual_start ?? b.planned_start ?? '00:00', b.actual_duration ?? b.planned_duration ?? 30, now)
  )
  const upcomingBlocks = blocks.filter(b => {
    const start = b.actual_start ?? b.planned_start ?? '00:00'
    const dur = b.actual_duration ?? b.planned_duration ?? 30
    return !isBlockPast(start, dur, now) && !isBlockActive(start, dur, now)
  })
  const nextBlock = upcomingBlocks[0]

  function quickAction(block: DayBlock, action: 'done' | 'partial' | 'skipped' | 'plus15') {
    if (typeof navigator !== 'undefined') navigator.vibrate?.(50)
    if (action === 'plus15') {
      updateBlock(block.id, { actual_duration: (block.actual_duration ?? block.planned_duration ?? 30) + 15 })
    } else {
      updateBlock(block.id, { status: action })
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 bg-surface2 rounded-2xl animate-pulse" />
        <div className="h-48 bg-surface2 rounded-3xl animate-pulse" />
        <div className="h-24 bg-surface2 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Agora</h1>
        <PersonToggle />
      </div>

      <SleepBar profileId={activePerson} />

      <div className="mt-4">
        {activeBlock ? (
          <ActiveBlockCard
            block={activeBlock}
            now={now}
            onQuickAction={(a) => quickAction(activeBlock, a)}
            onEdit={() => setEditBlock(activeBlock)}
          />
        ) : (
          <div className="bg-surface rounded-3xl p-6 text-center">
            <div className="text-4xl mb-3">☕</div>
            <p className="text-muted">Nenhum bloco ativo agora</p>
          </div>
        )}
      </div>

      {nextBlock && (
        <div className="mt-4 bg-surface rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">{getCategoryConfig(nextBlock.category).emoji}</span>
          <div>
            <div className="text-xs text-muted">Próximo</div>
            <div className="font-semibold text-sm">{nextBlock.name}</div>
          </div>
          <div className="ml-auto text-sm font-medium text-muted">
            {fmtTime(nextBlock.actual_start ?? nextBlock.planned_start ?? '00:00')}
          </div>
        </div>
      )}

      {upcomingBlocks.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted mb-2 font-medium">Mais hoje</div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {upcomingBlocks.slice(1, 6).map(b => {
              const cat = getCategoryConfig(b.category)
              return (
                <button
                  key={b.id}
                  onClick={() => setEditBlock(b)}
                  className="shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl min-w-[72px] active:opacity-80"
                  style={{ backgroundColor: cat.bg }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-xs font-medium truncate max-w-full" style={{ color: cat.tc }}>
                    {fmtTime(b.actual_start ?? b.planned_start ?? '00:00')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <EditBlockSheet
        block={editBlock}
        open={!!editBlock}
        onClose={() => setEditBlock(null)}
        onSave={updateBlock}
      />
    </div>
  )
}

function ActiveBlockCard({ block, now, onQuickAction, onEdit }: {
  block: DayBlock
  now: Date
  onQuickAction: (action: 'done' | 'partial' | 'skipped' | 'plus15') => void
  onEdit: () => void
}) {
  const cat = getCategoryConfig(block.category)
  const start = block.actual_start ?? block.planned_start ?? '00:00'
  const dur = block.actual_duration ?? block.planned_duration ?? 30
  const progress = blockProgress(start, dur, now)
  const end = blockEndTime(start, dur)

  return (
    <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: cat.bg }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl mb-1">{cat.emoji}</div>
          <h2 className="text-xl font-bold" style={{ color: cat.tc }}>{block.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: cat.color }}>
            {fmtTime(start)} – {fmtTime(end)} · {fmtDur(dur)}
          </p>
        </div>
        <button onClick={onEdit}
          className="text-xs px-3 py-1.5 rounded-xl font-medium active:opacity-70"
          style={{ backgroundColor: cat.color + '20', color: cat.tc }}>
          Ajustar
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1" style={{ color: cat.color }}>
          <span>Progresso</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: cat.color + '30' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%`, backgroundColor: cat.color }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {([
          { action: 'done' as const, label: '✓ Feito', color: '#3A9E6F' },
          { action: 'partial' as const, label: '◑ Parcial', color: '#E0A030' },
          { action: 'skipped' as const, label: '✕ Pulei', color: '#C4622D' },
          { action: 'plus15' as const, label: '+15min', color: '#4A90C4' },
        ]).map(btn => (
          <button
            key={btn.action}
            onClick={() => onQuickAction(btn.action)}
            className="py-2.5 rounded-xl text-xs font-semibold text-white active:opacity-80 transition-opacity"
            style={{ backgroundColor: btn.color }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
