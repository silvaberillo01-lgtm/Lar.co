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

export function frequencyMatchesDay(frequency: string, date: Date): boolean {
  const dow = date.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  switch (frequency) {
    case 'diario': return true
    case 'seg-sex': return dow >= 1 && dow <= 5
    case 'seg-qua-sex': return dow === 1 || dow === 3 || dow === 5
    case 'ter-qui': return dow === 2 || dow === 4
    case 'semanal': return dow === 1 // mondays
    case 'quinzenal': return dow === 1 // simplified
    case 'mensal': return date.getDate() === 1
    default: return false
  }
}
