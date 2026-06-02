'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#3B6EA5', '#7B5EA7', '#C4622D', '#3A9E6F', '#E0A030', '#B05080']

export default function OnboardingPage() {
  const [step, setStep] = useState<'profile' | 'household'>('profile')
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)

      // Se perfil já existe com nome, pula para o step do household
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('name, avatar_color, household_id')
        .eq('id', data.user.id)
        .single()

      if (profile?.household_id) {
        router.push('/agora')
        return
      }
      if (profile?.name) {
        setName(profile.name)
        setColor(profile.avatar_color ?? COLORS[0])
        setStep('household')
      }
    })
  }, []) // eslint-disable-line

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    await (supabase as any).from('profiles').upsert({ id: userId, name, avatar_color: color })
    setStep('household')
    setLoading(false)
  }

  async function saveHousehold(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setLoading(true)

    try {
      let householdId: string

      if (mode === 'create') {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { data, error } = await (supabase as any)
          .from('households')
          .insert({ name: householdName, invite_code: code })
          .select()
          .single()
        if (error) throw new Error('Erro ao criar lar: ' + error.message)
        householdId = data.id
      } else {
        const { data, error } = await (supabase as any)
          .from('households')
          .select()
          .eq('invite_code', inviteCode.toUpperCase())
          .single()
        if (error || !data) { alert('Código inválido ou não encontrado'); setLoading(false); return }
        householdId = data.id
      }

      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({ household_id: householdId })
        .eq('id', userId)
      if (profileError) throw new Error('Erro ao salvar perfil: ' + profileError.message)

      router.push('/agora')
    } catch (err: any) {
      alert(err.message ?? 'Ocorreu um erro. Tente novamente.')
      setLoading(false)
    }
  }

  if (step === 'profile') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Olá! 👋</h1>
          <p className="text-muted mb-8">Vamos configurar seu perfil</p>
          <form onSubmit={saveProfile} className="bg-surface rounded-2xl p-6 shadow-sm border border-surface2">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Seu nome</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Mateus"
                required
                className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base focus:outline-none focus:border-accent"
              />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3">Cor do avatar</label>
              <div className="flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-10 h-10 rounded-full transition-transform active:scale-95"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading || !name}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold active:opacity-80 disabled:opacity-50">
              Continuar
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Seu lar 🏠</h1>
        <p className="text-muted mb-8">Crie um novo ou entre no existente</p>
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-surface2">
          <div className="flex gap-2 mb-6">
            {(['create', 'join'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === m ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                {m === 'create' ? 'Criar novo' : 'Entrar com código'}
              </button>
            ))}
          </div>
          <form onSubmit={saveHousehold}>
            {mode === 'create' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Nome do lar</label>
                <input
                  value={householdName}
                  onChange={e => setHouseholdName(e.target.value)}
                  placeholder="Ex: Casa do Mateus e Ana"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base focus:outline-none focus:border-accent"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Código de convite</label>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Ex: ABC123"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-surface2 bg-background text-text placeholder-muted text-base uppercase focus:outline-none focus:border-accent"
                />
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-accent text-white rounded-xl font-semibold active:opacity-80 disabled:opacity-50">
              {loading ? 'Aguarde...' : mode === 'create' ? 'Criar lar' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
