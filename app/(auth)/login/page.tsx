'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email ou senha incorretos.')
        setLoading(false)
        return
      }
      router.push('/agora')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-accent mb-2">Lar.co</h1>
          <p className="text-muted text-base">O ritmo do lar de vocês</p>
        </div>

        <div className="flex gap-1 bg-surface2 rounded-full p-1 mb-6">
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${mode === m ? 'bg-surface shadow-sm text-text' : 'text-muted'}`}>
              {m === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 shadow-sm border border-surface2 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base focus:outline-none focus:border-accent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-base active:opacity-80 disabled:opacity-50 transition-opacity mt-2"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
