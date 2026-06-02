'use client'
import type { DayBlock } from '@/lib/supabase/types'
import { getCategoryConfig } from '@/lib/utils/categories'
import { toMin, fmtTime, fmtDur, fromMin } from '@/lib/utils/time'

const DAY_START = 6 * 60   // 06:00
const DAY_END = 24 * 60    // 00:00

type Segment =
  | { type: 'free'; start: number; end: number }
  | { type: 'block'; start: number; end: number; block: DayBlock }

// Monta a linha do tempo do dia: blocos ocupados + espaços livres entre eles.
function buildSegments(blocks: DayBlock[]): { segments: Segment[]; freeMin: number } {
  const items = blocks
    .filter(b => b.status !== 'skipped')
    .map(b => {
      const start = toMin((b.actual_start ?? b.planned_start ?? '00:00').slice(0, 5))
      const dur = b.actual_duration ?? b.planned_duration ?? 30
      return { start, end: start + dur, block: b }
    })
    .sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = Math.min(DAY_START, items[0]?.start ?? DAY_START)
  let freeMin = 0

  for (const it of items) {
    if (it.start > cursor) {
      segments.push({ type: 'free', start: cursor, end: it.start })
      freeMin += it.start - cursor
    }
    segments.push({ type: 'block', start: it.start, end: it.end, block: it.block })
    cursor = Math.max(cursor, it.end)
  }
  if (cursor < DAY_END) {
    segments.push({ type: 'free', start: cursor, end: DAY_END })
    freeMin += DAY_END - cursor
  }
  return { segments, freeMin }
}

export function DayTimeline({ blocks, onPick }: {
  blocks: DayBlock[]
  onPick?: (startTime: string) => void
}) {
  const { segments, freeMin } = buildSegments(blocks)
  if (blocks.length === 0) return null

  return (
    <div className="bg-surface rounded-3xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Planejamento do dia</h2>
        <span className="text-xs text-muted">{fmtDur(freeMin)} livre</span>
      </div>
      <div className="space-y-1.5">
        {segments.map((seg, i) => {
          if (seg.type === 'free') {
            const gap = seg.end - seg.start
            if (gap < 15) return null
            return (
              <button
                key={i}
                onClick={() => onPick?.(fromMin(seg.start))}
                className="w-full flex items-center gap-2 py-1.5 px-3 rounded-xl border border-dashed border-surface2 text-left active:opacity-70"
              >
                <span className="text-xs text-muted w-10">{fmtTime(fromMin(seg.start))}</span>
                <span className="text-xs text-muted flex-1">Livre · {fmtDur(gap)}</span>
                {onPick && <span className="text-xs text-accent font-medium">+ encaixar</span>}
              </button>
            )
          }
          const cat = getCategoryConfig(seg.block.category)
          const done = seg.block.status === 'done' || seg.block.status === 'partial'
          return (
            <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-xl" style={{ backgroundColor: cat.bg }}>
              <span className="text-xs w-10" style={{ color: cat.color }}>{fmtTime(fromMin(seg.start))}</span>
              <span className="text-sm">{cat.emoji}</span>
              <span className="text-sm font-medium flex-1 truncate" style={{ color: cat.tc }}>{seg.block.name}</span>
              <span className="text-xs" style={{ color: cat.color }}>{fmtDur(seg.end - seg.start)}{done ? ' ✓' : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
