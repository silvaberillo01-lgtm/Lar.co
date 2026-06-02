export function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMin(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtDur(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${m}min`
}

export function fmtTime(time: string): string {
  return time.slice(0, 5)
}

export function blockEndTime(startTime: string, durationMin: number): string {
  return fromMin(toMin(startTime) + durationMin)
}

export function blockProgress(startTime: string, durationMin: number, now?: Date): number {
  const nowDate = now ?? new Date()
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()
  const start = toMin(startTime)
  const end = start + durationMin
  if (nowMin < start) return 0
  if (nowMin >= end) return 100
  return Math.round(((nowMin - start) / durationMin) * 100)
}

export function isBlockActive(startTime: string, durationMin: number, now?: Date): boolean {
  const nowDate = now ?? new Date()
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()
  const start = toMin(startTime)
  const end = start + durationMin
  return nowMin >= start && nowMin < end
}

export function isBlockPast(startTime: string, durationMin: number, now?: Date): boolean {
  const nowDate = now ?? new Date()
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes()
  const end = toMin(startTime) + durationMin
  return nowMin >= end
}

export function sleepDuration(sleepTime: string, wakeTime: string): number {
  let sleepMin = toMin(sleepTime)
  let wakeMin = toMin(wakeTime)
  if (wakeMin < sleepMin) wakeMin += 24 * 60
  return wakeMin - sleepMin
}

export function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function weekDayName(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' })
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// frequency format: "diario" | "1,2,3,4,5" (comma-separated JS day numbers 0=Sun..6=Sat)
export function frequencyMatchesDay(frequency: string, date: Date): boolean {
  if (!frequency) return false
  if (frequency === 'diario') return true
  const dow = date.getDay()
  const days = frequency.split(',').map(Number)
  return days.includes(dow)
}

export const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
]

export function daysToFrequency(days: number[]): string {
  if (days.length === 7) return 'diario'
  return days.sort((a, b) => a - b).join(',')
}

export function frequencyToDays(frequency: string): number[] {
  if (!frequency) return []
  if (frequency === 'diario') return [0, 1, 2, 3, 4, 5, 6]
  return frequency.split(',').map(Number)
}

export function frequencyLabel(frequency: string): string {
  if (!frequency) return '–'
  if (frequency === 'diario') return 'Todo dia'
  const days = frequencyToDays(frequency)
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Seg–Sex'
  return days.map(d => WEEK_DAYS[d]?.label ?? '').join(', ')
}
