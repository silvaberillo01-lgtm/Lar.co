'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/appStore'

export default function ConfigPage() {
  const { householdId } = useAppStore()
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [householdName, setHouseholdName] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!householdId) return
    ;(supabase as any)
      .from('households')
      .select('name, invite_code')
      .eq('id', householdId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setInviteCode(data.invite_code)
          setHouseholdName(data.name ?? '')
        }
      })
  }, [householdId, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function copyCode() {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6">Configurações</h1>

      {/* Código de convite */}
      <div className="bg-surface rounded-3xl p-5 mb-4">
        <h2 className="font-semibold mb-1">Convidar parceiro(a)</h2>
        <p className="text-sm text-muted mb-4">
          Compartilhe esse código com sua esposa. Na tela de cadastro ela escolhe "Entrar com código" e digita esse código para entrar no seu lar.
        </p>
        {inviteCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface2 rounded-2xl px-4 py-3 text-center">
              <span className="text-2xl font-bold tracking-widest text-accent">{inviteCode}</span>
            </div>
            <button onClick={copyCode}
              className="px-4 py-3 bg-accent text-white rounded-2xl font-semibold text-sm active:opacity-80 min-w-[80px]">
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        ) : (
          <div className="h-12 bg-surface2 rounded-2xl animate-pulse" />
        )}
        <p className="text-xs text-muted mt-3">
          Lar: <strong>{householdName}</strong>
        </p>
      </div>

      {/* Como funciona */}
      <div className="bg-surface rounded-2xl px-4 py-4 mb-4">
        <h3 className="font-semibold text-sm mb-3">Como sua esposa entra</h3>
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Ela acessa o site e cria uma conta</li>
          <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Na tela seguinte, toca em "Entrar com código"</li>
          <li className="flex gap-2"><span className="text-accent font-bold">3.</span> Digita o código <strong className="text-text">{inviteCode}</strong></li>
          <li className="flex gap-2"><span className="text-accent font-bold">4.</span> Pronto — ela entra no mesmo lar e vê a rotina</li>
        </ol>
      </div>

      {/* Sair */}
      <button onClick={handleLogout}
        className="w-full py-3 bg-surface rounded-2xl border border-surface2 text-muted font-semibold text-sm active:opacity-70 flex items-center justify-center gap-2">
        🚪 Sair da conta
      </button>
    </div>
  )
}
