'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { createClient } from '@/lib/supabase/client'
import { getCategoryConfig, CATEGORIES } from '@/lib/utils/categories'
import { fmtTime, fmtDur, frequencyLabel, WEEK_DAYS, daysToFrequency, frequencyToDays } from '@/lib/utils/time'
import type { RoutineBlock } from '@/lib/supabase/types'

const CUSTOM_CATS_KEY = 'lar_custom_categories'
const EXTRA_EMOJIS = ['🎯','📚','🎮','🍳','🏋️','🧹','💻','🎵','🌿','🛒','🎨','📝','🧘','🚗','🏃']

type CustomCat = { label: string; emoji: string }

function loadCustomCats(): Record<string, CustomCat> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY) ?? '{}') } catch { return {} }
}
function saveCustomCats(cats: Record<string, CustomCat>) {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats))
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

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
  const { profiles } = useAppStore()
  const [category, setCategory] = useState('casa')
  const [person, setPerson] = useState('ambos')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('08:30')
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [saving, setSaving] = useState(false)
  const [customCats, setCustomCats] = useState<Record<string, CustomCat>>(() => loadCustomCats())
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🎯')
  const supabase = createClient()

  const duration = Math.max(5, timeToMinutes(endTime) - timeToMinutes(startTime) + (timeToMinutes(endTime) < timeToMinutes(startTime) ? 1440 : 0))

  function handleStartChange(val: string) {
    setStartTime(val)
    setEndTime(minutesToTime(timeToMinutes(val) + duration))
  }

  function handleEndChange(val: string) {
    setEndTime(val)
  }

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function selectAll() { setSelectedDays([0, 1, 2, 3, 4, 5, 6]) }
  function selectWeekdays() { setSelectedDays([1, 2, 3, 4, 5]) }
  function selectWeekend() { setSelectedDays([0, 6]) }

  function addCustomCategory() {
    if (!newCatName.trim()) return
    const key = `custom_${Date.now()}`
    const updated = { ...customCats, [key]: { label: newCatName.trim(), emoji: newCatEmoji } }
    setCustomCats(updated)
    saveCustomCats(updated)
    setCategory(key)
    setShowNewCat(false)
    setNewCatName('')
    setNewCatEmoji('🎯')
  }

  async function handleSave(e: { preventDefault: () => void }) {
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

  const allCats: Record<string, { label: string; emoji: string; color: string; bg: string; tc: string }> = {
    ...(CATEGORIES as Record<string, { label: string; emoji: string; color: string; bg: string; tc: string }>),
    ...Object.fromEntries(
      Object.entries(customCats).map(([k, v]) => { const c = v as CustomCat; return [k, { label: c.label, emoji: c.emoji, color: '#7A7469', bg: '#EDE9E0', tc: '#5A5450' }] })
    ),
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
              {Object.entries(allCats).map(([key, cat]) => (
                <button type="button" key={key} onClick={() => setCategory(key)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                  style={{ backgroundColor: category === key ? cat.bg : '#EDE9E0' }}>
                  <span className="text-lg">{cat.emoji}</span>
                  <span style={{ color: cat.tc }} className="truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
              <button type="button" onClick={() => setShowNewCat(v => !v)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                style={{ backgroundColor: showNewCat ? '#EDE9E0' : '#F5F3EE' }}>
                <span className="text-lg">＋</span>
                <span className="text-muted">Nova</span>
              </button>
            </div>

            {showNewCat && (
              <div className="mt-3 p-3 bg-surface2 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-full px-3 py-2 rounded-lg border border-surface2 bg-background text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <button type="button" onClick={addCustomCategory}
                    disabled={!newCatName.trim()}
                    className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-40">
                    Criar
                  </button>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1.5">Escolha um emoji</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRA_EMOJIS.map(em => (
                      <button type="button" key={em} onClick={() => setNewCatEmoji(em)}
                        className="w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all"
                        style={{ backgroundColor: newCatEmoji === em ? '#C4622D30' : 'transparent', outline: newCatEmoji === em ? '2px solid #C4622D' : 'none' }}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted block mb-1.5">Responsável</label>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setPerson('ambos')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${person === 'ambos' ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                Ambos
              </button>
              {profiles.map(p => (
                <button type="button" key={p.id} onClick={() => setPerson(p.id)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${person === p.id ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted">Horário</label>
              <span className="text-xs text-muted bg-surface2 px-2 py-0.5 rounded-full">{fmtDur(duration)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Início</label>
                <input type="time" value={startTime} onChange={e => handleStartChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Fim</label>
                <input type="time" value={endTime} onChange={e => handleEndChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent" />
              </div>
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
