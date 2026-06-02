import type { RoutineBlock } from '@/lib/supabase/types'
import { frequencyMatchesDay } from '@/lib/utils/time'

// Gera os day_blocks que faltam para um perfil numa data, a partir das rotinas ativas.
// person nas rotinas pode ser 'ambos' (todos) ou o profile_id de um membro específico.
export async function generateDayBlocks(
  supabase: any,
  householdId: string,
  profileId: string,
  targetDate: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('day_blocks')
    .select('routine_block_id')
    .eq('profile_id', profileId)
    .eq('date', targetDate)

  const existingRoutineIds = new Set(
    (existing ?? [])
      .map((b: { routine_block_id: string | null }) => b.routine_block_id)
      .filter(Boolean)
  )

  const { data: routines } = await supabase
    .from('routine_blocks')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true)

  if (!routines) return false

  const dateObj = new Date(targetDate + 'T00:00:00')
  const toGenerate = (routines as RoutineBlock[]).filter(r =>
    !existingRoutineIds.has(r.id) &&
    frequencyMatchesDay(r.frequency ?? 'diario', dateObj) &&
    (r.person === 'ambos' || r.person === profileId)
  )

  if (toGenerate.length === 0) return false

  const inserts = toGenerate.map(r => ({
    household_id: householdId,
    profile_id: profileId,
    routine_block_id: r.id,
    name: r.name,
    category: r.category,
    date: targetDate,
    planned_start: r.start_time,
    actual_start: r.start_time,
    planned_duration: r.duration_minutes,
    actual_duration: r.duration_minutes,
    status: 'planejado',
  }))

  await supabase.from('day_blocks').insert(inserts)
  return true
}
