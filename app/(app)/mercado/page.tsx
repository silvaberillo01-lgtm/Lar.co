'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/stores/appStore'
import { useMarket } from '@/lib/hooks/useMarket'

const SUGGESTIONS = ['Leite', 'Ovos', 'Pão', 'Arroz', 'Feijão', 'Frango', 'Tomate', 'Cebola', 'Alho', 'Manteiga', 'Iogurte', 'Queijo']

export default function MercadoPage() {
  const { householdId, activePerson } = useAppStore()
  const { items, loading, addItem, toggleItem, deleteItem, clearChecked } = useMarket(householdId)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [mode, setMode] = useState<'add' | 'shop'>('add')

  const checked = items.filter(i => i.checked)
  const unchecked = items.filter(i => !i.checked)
  const progress = items.length > 0 ? Math.round((checked.length / items.length) * 100) : 0

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !activePerson) return
    await addItem(name.trim(), quantity.trim() || '1', activePerson)
    setName('')
    setQuantity('')
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-surface2 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Mercado</h1>
        <div className="flex gap-1 bg-surface2 rounded-full p-1">
          {(['add', 'shop'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${mode === m ? 'bg-surface shadow-sm' : 'text-muted'}`}>
              {m === 'add' ? '+ Adicionar' : '🛒 Compras'}
            </button>
          ))}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>{checked.length}/{items.length} itens</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {mode === 'add' && (
        <>
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Item"
              className="flex-1 px-4 py-3 rounded-xl border border-surface2 bg-surface text-base focus:outline-none focus:border-accent"
            />
            <input
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Qtd"
              className="w-20 px-3 py-3 rounded-xl border border-surface2 bg-surface text-base focus:outline-none focus:border-accent"
            />
            <button type="submit" className="px-4 py-3 bg-accent text-white rounded-xl font-semibold active:opacity-80">+</button>
          </form>
          <div className="flex flex-wrap gap-2 mb-6">
            {SUGGESTIONS.filter(s => !items.some(i => i.name?.toLowerCase() === s.toLowerCase())).slice(0, 8).map(s => (
              <button key={s} onClick={() => activePerson && addItem(s, '1', activePerson)}
                className="px-3 py-1.5 bg-surface rounded-full text-sm border border-surface2 active:opacity-70">
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="space-y-2">
        {unchecked.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-surface px-4 py-3.5 rounded-2xl">
            <button
              onClick={() => activePerson && toggleItem(item.id, true, activePerson)}
              className="w-6 h-6 rounded-full border-2 border-surface2 shrink-0 active:scale-90 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{item.name}</div>
              {item.quantity && item.quantity !== '1' && <div className="text-xs text-muted">{item.quantity}</div>}
            </div>
            {mode === 'add' && (
              <button onClick={() => deleteItem(item.id)}
                className="text-muted text-sm px-2 py-1 active:opacity-70">✕</button>
            )}
          </div>
        ))}

        {checked.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-4 mb-2">
              <span className="text-xs text-muted font-medium">Adicionados ({checked.length})</span>
              <button onClick={clearChecked} className="text-xs text-red-500 font-medium active:opacity-70">Limpar</button>
            </div>
            {checked.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-surface px-4 py-3.5 rounded-2xl opacity-50">
                <button
                  onClick={() => activePerson && toggleItem(item.id, false, activePerson)}
                  className="w-6 h-6 rounded-full bg-accent shrink-0 flex items-center justify-center text-white text-xs active:scale-90 transition-transform"
                >✓</button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-through">{item.name}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-muted">Lista vazia</p>
            <p className="text-sm text-muted mt-1">Adicione itens acima</p>
          </div>
        )}
      </div>
    </div>
  )
}
