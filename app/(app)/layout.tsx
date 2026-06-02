'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/stores/appStore'
import { BottomNav } from '@/components/layout/BottomNav'
import { SideNav } from '@/components/layout/SideNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setActivePerson, setHouseholdId, setProfiles, activePerson } = useAppStore()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: { household_id: string | null } | null }

      if (!profile?.household_id) { router.push('/onboarding'); return }

      setHouseholdId(profile.household_id)
      if (!activePerson) setActivePerson(user.id)

      const { data: allProfiles } = await (supabase as any)
        .from('profiles')
        .select('id, name, avatar_color')
        .eq('household_id', profile.household_id) as { data: Array<{ id: string; name: string | null; avatar_color: string | null }> | null }

      if (allProfiles) setProfiles(allProfiles)
    }
    init()
  }, []) // eslint-disable-line

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-background">
      <SideNav />
      {/* Mobile: botão de logout fixo no topo direito */}
      <button
        onClick={handleLogout}
        className="md:hidden fixed top-4 right-4 z-50 w-9 h-9 bg-surface border border-surface2 rounded-full flex items-center justify-center text-muted shadow-sm active:opacity-70"
        title="Sair"
      >
        🚪
      </button>
      <main className="md:ml-56 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
