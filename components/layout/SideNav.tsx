'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/agora', label: 'Agora', emoji: '⚡' },
  { href: '/hoje', label: 'Hoje', emoji: '📋' },
  { href: '/rotina', label: 'Rotina', emoji: '🔄' },
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/semana', label: 'Semana', emoji: '📅' },
  { href: '/mercado', label: 'Mercado', emoji: '🛒' },
  { href: '/config', label: 'Configurações', emoji: '⚙️' },
]

export function SideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-dvh bg-surface border-r border-surface2 py-6 px-4 fixed left-0 top-0">
      <div className="mb-8 px-2">
        <h1 className="text-2xl font-bold text-accent">Lar.co</h1>
        <p className="text-xs text-muted mt-0.5">O ritmo do lar de vocês</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface2 hover:text-text'
              }`}>
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <button onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface2 hover:text-red-500 transition-colors mt-2">
        <span className="text-base">🚪</span>
        Sair
      </button>
    </aside>
  )
}
