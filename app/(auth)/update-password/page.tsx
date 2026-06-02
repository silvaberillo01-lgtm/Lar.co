'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase redireciona com token na URL — ele é processado automaticamente pelo client
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // pronto para redefinir
      }
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/agora'), 2000)
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-semibold text-lg">Senha definida!</h2>
          <p className="text-muted text-sm mt-1">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent mb-2">Lar.co</h1>
          <p className="text-muted">Defina sua senha</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 shadow-sm border border-surface2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="repita a senha"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-base focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-accent text-white rounded-xl font-semibold active:opacity-80 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
