import type { RoutineBlock } from '@/lib/supabase/types'
import { frequencyMatchesDay } from '@/lib/utils/time'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Decide se a rotina pertence a este perfil.
// Regras:
//   'ambos'      → todos
//   UUID válido  → só o perfil com esse ID
//   outro texto  → valor legado (ex: 'mateus') — trata como 'ambos' para não perder dados
function personMatchesProfile(person: string | null, profileId: string): boolean {
  if (!person || person === 'ambos') return true
  if (UUID_RE.test(person)) return person === profileId
  return true // legado: texto não-UUID → todos
}

// Gera os day_blocks que faltam para um perfil numa data, a partir das rotinas ativas.
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
    personMatchesProfile(r.person, profileId)
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
