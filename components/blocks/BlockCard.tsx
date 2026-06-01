'use client'
import { DayBlock } from '@/lib/supabase/types'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtTime, blockEndTime, isBlockActive } from '@/lib/utils/time'

interface BlockCardProps {
  block: DayBlock
  onClick?: () => void
  isActive?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  planejado: '',
  done: '✓',
  partial: '◑',
  skipped: '✕',
}

export function BlockCard({ block, onClick, isActive: forceActive }: BlockCardProps) {
  const cat = getCategoryConfig(block.category)
  const startTime = block.actual_start ?? block.planned_start ?? '00:00'
  const duration = block.actual_duration ?? block.planned_duration ?? 30
  const endTime = blockEndTime(startTime, duration)
  const active = forceActive ?? isBlockActive(startTime, duration)
  const statusIcon = STATUS_LABELS[block.status ?? 'planejado'] ?? ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left active:opacity-80 transition-all`}
      style={{
        backgroundColor: cat.bg,
        outline: active ? `2px solid ${cat.color}` : 'none',
      }}
    >
      <div className="text-xl shrink-0">{cat.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: cat.tc }}>{block.name}</div>
        <div className="text-xs mt-0.5" style={{ color: cat.color }}>
          {fmtTime(startTime)} – {fmtTime(endTime)}
        </div>
      </div>
      {statusIcon && (
        <span className="text-sm font-bold shrink-0" style={{ color: cat.color }}>{statusIcon}</span>
      )}
    </button>
  )
}
