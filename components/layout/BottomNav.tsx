'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/agora', label: 'Agora', emoji: '⚡' },
  { href: '/hoje', label: 'Hoje', emoji: '📋' },
  { href: '/rotina', label: 'Rotina', emoji: '🔄' },
  { href: '/dashboard', label: 'Dados', emoji: '📊' },
  { href: '/mercado', label: 'Mercado', emoji: '🛒' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface2 pb-safe z-40 md:hidden">
      <div className="flex">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors ${
                active ? 'text-accent' : 'text-muted'
              }`}>
              <span className="text-xl leading-none">{item.emoji}</span>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
