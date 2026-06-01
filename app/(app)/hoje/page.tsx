'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { BlockCard } from '@/components/blocks/BlockCard'
import { EditBlockSheet } from '@/components/blocks/EditBlockSheet'
import { PersonToggle } from '@/components/layout/PersonToggle'
import type { DayBlock } from '@/lib/supabase/types'
import { todayDate } from '@/lib/utils/time'

export default function HojePage() {
  const { activePerson, householdId } = useAppStore()
  const { blocks, loading, updateBlock, addBlock } = useBlocks(activePerson)
  const [editBlock, setEditBlock] = useState<DayBlock | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface2 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Hoje</h1>
          <p className="text-xs text-muted mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <PersonToggle />
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-muted">Nenhum bloco para hoje</p>
          <p className="text-sm text-muted mt-1">Configure sua rotina para começar</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {blocks.map(b => (
            <BlockCard key={b.id} block={b} onClick={() => setEditBlock(b)} />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-accent text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        +
      </button>

      <EditBlockSheet
        block={editBlock}
        open={!!editBlock}
        onClose={() => setEditBlock(null)}
        onSave={updateBlock}
      />
    </div>
  )
}
