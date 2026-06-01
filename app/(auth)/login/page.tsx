'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/onboarding` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-accent mb-2">Lar.co</h1>
          <p className="text-muted text-base">O ritmo do lar de vocês</p>
        </div>

        {sent ? (
          <div className="bg-surface rounded-2xl p-6 text-center shadow-sm border border-surface2">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-semibold text-lg mb-2">Verifique seu email</h2>
            <p className="text-muted text-sm">Enviamos um link de acesso para <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-surface rounded-2xl p-6 shadow-sm border border-surface2">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-base active:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Enviando...' : 'Entrar com link mágico'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
