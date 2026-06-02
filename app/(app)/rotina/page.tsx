'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { createClient } from '@/lib/supabase/client'
import { getCategoryConfig, CATEGORIES } from '@/lib/utils/categories'
import { fmtTime, fmtDur, frequencyLabel, WEEK_DAYS, daysToFrequency, frequencyToDays } from '@/lib/utils/time'
import type { RoutineBlock } from '@/lib/supabase/types'

export default function RotinaPage() {
  const { householdId } = useAppStore()
  const [routines, setRoutines] = useState<RoutineBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    if (!householdId) return
    const { data } = await (supabase as any)
      .from('routine_blocks')
      .select('*')
      .eq('household_id', householdId)
      .order('start_time')
    setRoutines(data ?? [])
    setLoading(false)
  }, [householdId, supabase])

  useEffect(() => { fetch() }, [fetch])

  async function deleteRoutine(id: string) {
    setRoutines(prev => prev.filter(r => r.id !== id))
    await (supabase as any).from('routine_blocks').delete().eq('id', id)
  }

  async function toggleActive(id: string, active: boolean) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, active } : r))
    await (supabase as any).from('routine_blocks').update({ active }).eq('id', id)
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-surface2 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Rotina</h1>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold active:opacity-80">
          + Novo bloco
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔄</div>
          <p className="text-muted">Nenhuma rotina configurada</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {routines.map(r => {
            const cat = getCategoryConfig(r.category)
            return (
              <div key={r.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{ backgroundColor: cat.bg, opacity: r.active ? 1 : 0.5 }}>
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: cat.tc }}>{r.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: cat.color }}>
                    {r.start_time ? fmtTime(r.start_time) : '–'} · {r.duration_minutes ? fmtDur(r.duration_minutes) : '–'} · {frequencyLabel(r.frequency ?? '')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(r.id, !r.active)}
                    className="text-xs px-2 py-1 rounded-lg font-medium"
                    style={{ backgroundColor: cat.color + '20', color: cat.tc }}>
                    {r.active ? 'Pausar' : 'Ativar'}
                  </button>
                  <button onClick={() => deleteRoutine(r.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 font-medium">
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <AddRoutineSheet
          householdId={householdId}
          onClose={() => setShowForm(false)}
          onSaved={() => { fetch(); setShowForm(false) }}
        />
      )}
    </div>
  )
}

function AddRoutineSheet({ householdId, onClose, onSaved }: {
  householdId: string | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('casa')
  const [person, setPerson] = useState('ambos')
  const [startTime, setStartTime] = useState('08:00')
  const [duration, setDuration] = useState(30)
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function selectAll() { setSelectedDays([0, 1, 2, 3, 4, 5, 6]) }
  function selectWeekdays() { setSelectedDays([1, 2, 3, 4, 5]) }
  function selectWeekend() { setSelectedDays([0, 6]) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || selectedDays.length === 0) return
    setSaving(true)
    await (supabase as any).from('routine_blocks').insert({
      household_id: householdId,
      name,
      category,
      person,
      start_time: startTime,
      duration_minutes: duration,
      frequency: daysToFrequency(selectedDays),
      active: true,
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-surface rounded-t-3xl p-6 max-h-[90dvh] overflow-y-auto shadow-2xl">
        <div className="w-12 h-1 bg-surface2 rounded-full mx-auto mb-6" />
        <h2 className="text-lg font-bold mb-6">Novo bloco de rotina</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="Ex: Trabalho remoto"
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

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Responsável</label>
            <div className="flex gap-2">
              {(['mateus', 'esposa', 'ambos']).map(p => (
                <button type="button" key={p} onClick={() => setPerson(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize ${person === p ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                  {p}
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-muted">Dias da semana</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-accent font-medium">Todos</button>
                <button type="button" onClick={selectWeekdays} className="text-xs text-accent font-medium">Seg–Sex</button>
                <button type="button" onClick={selectWeekend} className="text-xs text-accent font-medium">Fim de semana</button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {WEEK_DAYS.map(d => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() => toggleDay(d.value)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: selectedDays.includes(d.value) ? '#C4622D' : '#EDE9E0',
                    color: selectedDays.includes(d.value) ? '#fff' : '#7A7469',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Selecione pelo menos um dia</p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-surface2 text-muted rounded-xl font-semibold">Cancelar</button>
            <button type="submit" disabled={saving || !name || selectedDays.length === 0}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
