'use client'
import { useAppStore } from '@/lib/stores/appStore'

export function PersonToggle() {
  const { profiles, activePerson, setActivePerson } = useAppStore()

  if (profiles.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 bg-surface2 rounded-full p-1">
      {profiles.map(p => (
        <button
          key={p.id}
          onClick={() => setActivePerson(p.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activePerson === p.id ? 'bg-surface shadow-sm' : 'text-muted'
          }`}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: p.avatar_color ?? '#7A7469' }}
          >
            {(p.name ?? '?')[0].toUpperCase()}
          </span>
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  )
}
