import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  activePerson: string | null   // profile_id
  currentDate: string           // YYYY-MM-DD
  householdId: string | null
  profiles: Array<{ id: string; name: string | null; avatar_color: string | null }>
  setActivePerson: (id: string) => void
  setCurrentDate: (date: string) => void
  setHouseholdId: (id: string) => void
  setProfiles: (profiles: Array<{ id: string; name: string | null; avatar_color: string | null }>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activePerson: null,
      currentDate: new Date().toISOString().split('T')[0],
      householdId: null,
      profiles: [],
      setActivePerson: (id) => set({ activePerson: id }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setHouseholdId: (id) => set({ householdId: id }),
      setProfiles: (profiles) => set({ profiles }),
    }),
    { name: 'lar-app-store' }
  )
)
