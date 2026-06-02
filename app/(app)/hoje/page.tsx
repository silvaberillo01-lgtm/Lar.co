'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useBlocks } from '@/lib/hooks/useBlocks'
import { BlockCard } from '@/components/blocks/BlockCard'
import { EditBlockSheet } from '@/components/blocks/EditBlockSheet'
import { DayTimeline } from '@/components/blocks/DayTimeline'
import { PersonToggle } from '@/components/layout/PersonToggle'
import { CATEGORIES } from '@/lib/utils/categories'
import { todayDate } from '@/lib/utils/time'
import type { DayBlock } from '@/lib/supabase/types'

export default function HojePage() {
  const { activePerson, householdId } = useAppStore()
  const { blocks, loading, updateBlock, addBlock } = useBlocks(activePerson)
  const [editBlock, setEditBlock] = useState<DayBlock | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addStart, setAddStart] = useState<string | null>(null)
  const [view, setView] = useState<'lista' | 'timeline'>('lista')

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
          <p className="text-xs text-muted mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <PersonToggle />
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-muted">Nenhum bloco para hoje</p>
          <p className="text-sm text-muted mt-1">Configure sua rotina ou adicione um bloco avulso</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1.5 bg-surface2 rounded-full p-1 mb-4 w-fit">
            {([['lista', 'Lista'], ['timeline', 'Linha do tempo']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setView(key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  view === key ? 'bg-surface shadow-sm' : 'text-muted'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {view === 'timeline' ? (
            <DayTimeline blocks={blocks} onPick={(start) => { setAddStart(start); setShowAdd(true) }} />
          ) : (
            <div className="space-y-2.5">
              {blocks.map(b => (
                <BlockCard key={b.id} block={b} onClick={() => setEditBlock(b)} />
              ))}
            </div>
          )}
        </>
      )}

      <button
        onClick={() => { setAddStart(null); setShowAdd(true) }}
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

      {showAdd && (
        <AddBlockSheet
          profileId={activePerson}
          householdId={householdId}
          initialStart={addStart}
          onClose={() => { setShowAdd(false); setAddStart(null) }}
          onSave={async (block) => { await addBlock(block); setShowAdd(false); setAddStart(null) }}
        />
      )}
    </div>
  )
}

function AddBlockSheet({ profileId, householdId, initialStart, onClose, onSave }: {
  profileId: string | null
  householdId: string | null
  initialStart?: string | null
  onClose: () => void
  onSave: (block: Omit<DayBlock, 'id' | 'created_at'>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('pessoal')
  const [startTime, setStartTime] = useState(() => {
    if (initialStart) return initialStart
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [duration, setDuration] = useState(30)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profileId || !name) return
    setSaving(true)
    await onSave({
      household_id: householdId,
      profile_id: profileId,
      routine_block_id: null,
      name,
      category,
      date: todayDate(),
      planned_start: startTime,
      actual_start: startTime,
      planned_duration: duration,
      actual_duration: duration,
      status: 'planejado',
      notes: null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-surface rounded-t-3xl p-6 max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="w-12 h-1 bg-surface2 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-6">Adicionar bloco</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="Ex: Reunião, Academia..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Categoria</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button type="button" key={key} onClick={() => setCategory(key)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                  style={{ backgroundColor: category === key ? cat.bg : '#EDE9E0' }}>
                  <span className="text-lg">{cat.emoji}</span>
                  <span style={{ color: cat.tc }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Horário</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Duração (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={5} step={5}
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-surface2 text-muted rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={saving || !name}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
