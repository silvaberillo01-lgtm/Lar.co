'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { useMarket } from '@/lib/hooks/useMarket'
import { getCategoryConfig } from '@/lib/utils/categories'
import { fmtTime, blockEndTime, isBlockActive, blockProgress } from '@/lib/utils/time'
import type { DayBlock } from '@/lib/supabase/types'

export default function TabletPage() {
  const { profiles, householdId } = useAppStore()
  const [now, setNow] = useState(new Date())
  const p1 = profiles[0]
  const p2 = profiles[1]
  const { blocks: blocks1 } = useBlocks(p1?.id ?? null)
  const { blocks: blocks2 } = useBlocks(p2?.id ?? null)
  const { items } = useMarket(householdId)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const currentDate = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const uncheckedItems = items.filter(i => !i.checked)

  return (
    <div className="min-h-dvh bg-background p-6 text-lg">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-accent">Lar.co</h1>
          <p className="text-muted capitalize">{currentDate}</p>
        </div>
        <div className="text-4xl font-bold text-text">{currentTime}</div>
      </header>

      <div className="grid grid-cols-2 gap-6 h-[calc(100dvh-120px)]">
        {/* Left: People timelines */}
        <div className="space-y-4 overflow-y-auto">
          {[{ profile: p1, blocks: blocks1 }, { profile: p2, blocks: blocks2 }].filter(({ profile }) => profile).map(({ profile, blocks }) => (
            <div key={profile!.id} className="bg-surface rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: profile!.avatar_color ?? '#7A7469' }}>
                  {(profile!.name ?? '?')[0]}
                </div>
                <h2 className="text-xl font-bold">{profile!.name}</h2>
              </div>
              <div className="space-y-2">
                {blocks.slice(0, 6).map((b: DayBlock) => {
                  const cat = getCategoryConfig(b.category)
                  const start = b.actual_start ?? b.planned_start ?? '00:00'
                  const dur = b.actual_duration ?? b.planned_duration ?? 30
                  const active = isBlockActive(start, dur, now)
                  const progress = active ? blockProgress(start, dur, now) : null
                  return (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ backgroundColor: cat.bg, outline: active ? `2px solid ${cat.color}` : 'none' }}>
                      <span className="text-2xl">{cat.emoji}</span>
                      <div className="flex-1">
                        <div className="font-semibold" style={{ color: cat.tc }}>{b.name}</div>
                        <div className="text-sm" style={{ color: cat.color }}>
                          {fmtTime(start)} – {fmtTime(blockEndTime(start, dur))}
                        </div>
                        {progress !== null && (
                          <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: cat.color + '30' }}>
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: cat.color }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Market list */}
        <div className="bg-surface rounded-3xl p-5 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">🛒 Mercado</h2>
          {uncheckedItems.length === 0 ? (
            <div className="text-center py-8 text-muted">Lista vazia</div>
          ) : (
            <div className="space-y-2">
              {uncheckedItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 bg-surface2 rounded-2xl">
                  <div className="w-3 h-3 rounded-full bg-accent shrink-0" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.quantity && item.quantity !== '1' && (
                      <div className="text-sm text-muted">{item.quantity}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
