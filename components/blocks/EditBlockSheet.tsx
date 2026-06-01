'use client'
import { useState, useEffect } from 'react'
import { DayBlock } from '@/lib/supabase/types'
import { getCategoryConfig, CATEGORIES } from '@/lib/utils/categories'
import { fmtTime } from '@/lib/utils/time'

interface EditBlockSheetProps {
  block: DayBlock | null
  open: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<DayBlock>) => void
}

const STATUSES = [
  { value: 'planejado', label: 'Planejado', color: '#7A7469' },
  { value: 'done', label: 'Feito ✓', color: '#3A9E6F' },
  { value: 'partial', label: 'Parcial ◑', color: '#E0A030' },
  { value: 'skipped', label: 'Pulei ✕', color: '#C4622D' },
]

export function EditBlockSheet({ block, open, onClose, onSave }: EditBlockSheetProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [actualStart, setActualStart] = useState('')
  const [actualDuration, setActualDuration] = useState(30)
  const [status, setStatus] = useState('planejado')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (block) {
      setName(block.name ?? '')
      setCategory(block.category ?? '')
      setActualStart(block.actual_start ?? block.planned_start ?? '')
      setActualDuration(block.actual_duration ?? block.planned_duration ?? 30)
      setStatus(block.status ?? 'planejado')
      setNotes(block.notes ?? '')
    }
  }, [block])

  function handleSave() {
    if (!block) return
    onSave(block.id, {
      name,
      category,
      actual_start: actualStart,
      actual_duration: actualDuration,
      status,
      notes,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-surface rounded-t-3xl p-6 max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="w-12 h-1 bg-surface2 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-6">Editar bloco</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Categoria</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                    category === key ? '' : 'bg-surface2'
                  }`}
                  style={{
                    backgroundColor: category === key ? cat.bg : undefined,
                    outline: category === key ? `2px solid ${cat.color}` : 'none',
                  }}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="leading-tight text-center" style={{ color: cat.tc }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Início</label>
              <input
                type="time"
                value={actualStart.slice(0, 5)}
                onChange={e => setActualStart(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted block mb-1.5">Duração (min)</label>
              <input
                type="number"
                value={actualDuration}
                onChange={e => setActualDuration(Number(e.target.value))}
                min={5}
                step={5}
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    status === s.value ? 'text-white' : 'bg-surface2 text-muted'
                  }`}
                  style={{ backgroundColor: status === s.value ? s.color : undefined }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 bg-surface2 text-muted rounded-xl font-semibold active:opacity-80">
            Cancelar
          </button>
          <button onClick={handleSave}
            className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold active:opacity-80">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
